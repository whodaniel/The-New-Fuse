import { Test, TestingModule } from '@nestjs/testing';
import { TaskSynchronizationService, TaskSyncData, TaskExecutionSyncData } from './TaskSynchronizationService';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { DrizzleService } from '@the-new-fuse/database';

describe('TaskSynchronizationService', () => {
  let service: TaskSynchronizationService;
  let mockRedisService: jest.Mocked<UnifiedRedisService>;
  let mockWebSocketService: jest.Mocked<any>;
  let mockDbService: jest.Mocked<DrizzleService>;
  let mockSyncOrchestrator: jest.Mocked<SyncOrchestrator>;

  beforeEach(async () => {
    // Create mocks
    mockRedisService = {
      psubscribe: jest.fn(),
      punsubscribe: jest.fn(),
      publish: jest.fn(),
      lpush: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn()
    } as any;

    mockWebSocketService = {
      sendMessage: jest.fn().mockResolvedValue(true),
      broadcastToAllUsers: jest.fn().mockResolvedValue(1),
      broadcastToTenant: jest.fn().mockResolvedValue(1)
    };

    mockDbService = {
      task: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn()
      },
      taskExecution: {
        update: jest.fn(),
        create: jest.fn()
      },
      workflow: {
        findMany: jest.fn()
      },
      user: {
        findMany: jest.fn()
      },
      $executeRaw: jest.fn(),
      $queryRaw: jest.fn()
    } as any;

    mockSyncOrchestrator = {
      syncTenantData: jest.fn(),
      syncGlobalData: jest.fn()
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskSynchronizationService,
        {
          provide: UnifiedRedisService,
          useValue: mockRedisService
        },
        {
          provide: 'IWebSocketService',
          useValue: mockWebSocketService
        },
        {
          provide: DrizzleService,
          useValue: mockDbService
        },
        {
          provide: SyncOrchestrator,
          useValue: mockSyncOrchestrator
        }
      ]
    }).compile();

    service = module.get<TaskSynchronizationService>(TaskSynchronizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize channel subscriptions', async () => {
      // Mock workflow data
      mockDbService.workflow.findMany.mockResolvedValue([
        {
          id: 'workflow1',
          steps: [
            {
              id: 'step1',
              nextSteps: ['step2', 'step3'],
              conditions: {}
            }
          ]
        }
      ]);

      await service.onModuleInit();

      expect(mockRedisService.psubscribe).toHaveBeenCalledTimes(3);
      expect(mockRedisService.psubscribe).toHaveBeenCalledWith(
        'task_sync:*',
        expect.any(Function)
      );
      expect(mockRedisService.psubscribe).toHaveBeenCalledWith(
        'task_execution:*',
        expect.any(Function)
      );
      expect(mockRedisService.psubscribe).toHaveBeenCalledWith(
        'task_dependency:*',
        expect.any(Function)
      );
    });

    it('should load task dependencies from workflows', async () => {
      const mockWorkflows = [
        {
          id: 'workflow1',
          steps: [
            {
              id: 'step1',
              nextSteps: ['step2'],
              conditions: {}
            },
            {
              id: 'step2',
              nextSteps: ['step3'],
              conditions: {}
            }
          ]
        }
      ];

      mockDbService.workflow.findMany.mockResolvedValue(mockWorkflows);

      await service.onModuleInit();

      // Verify dependencies were loaded
      const dependencies = await service.getTaskDependencies('step1');
      expect(dependencies).toEqual(['step2']);
    });
  });

  describe('syncTaskData', () => {
    it('should sync task data successfully', async () => {
      const taskData: TaskSyncData = {
        id: 'task1',
        type: 'test_task',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        pipelineId: 'pipeline1',
        userId: 'user1',
        version: 1,
        lastModified: new Date(),
        modifiedBy: 'user1'
      };

      mockDbService.$executeRaw.mockResolvedValue([{ id: 'task1' }]);

      await service.syncTaskData(taskData, 'tenant1');

      expect(mockSyncOrchestrator.syncTenantData).toHaveBeenCalledWith(
        'tenant1',
        'task',
        expect.objectContaining({
          ...taskData,
          syncTimestamp: expect.any(Date)
        })
      );

      expect(mockRedisService.publish).toHaveBeenCalledWith(
        'task_sync:tenant1',
        expect.objectContaining({
          taskData,
          timestamp: expect.any(Number)
        })
      );

      expect(mockWebSocketService.sendMessage).toHaveBeenCalled();
    });

    it('should handle task completion and update dependents', async () => {
      const taskData: TaskSyncData = {
        id: 'task1',
        type: 'test_task',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        pipelineId: 'pipeline1',
        userId: 'user1',
        version: 2,
        lastModified: new Date(),
        modifiedBy: 'user1'
      };

      // Mock dependent task
      mockDbService.task.findUnique.mockResolvedValue({
        id: 'task2',
        status: 'PENDING',
        type: 'dependent_task',
        priority: 'MEDIUM',
        pipelineId: 'pipeline1',
        userId: 'user1'
      });

      mockDbService.task.findMany.mockResolvedValue([
        { id: 'task1', status: 'COMPLETED' }
      ]);

      mockDbService.$executeRaw.mockResolvedValue([{ id: 'task1' }]);

      // Set up dependency relationship
      await service.updateTaskDependencies('task2', ['task1'], 'tenant1');
      
      await service.syncTaskData(taskData, 'tenant1');

      // Verify dependent task was updated
      expect(mockSyncOrchestrator.syncTenantData).toHaveBeenCalledTimes(2); // Original task + dependent
    });

    it('should handle sync errors gracefully', async () => {
      const taskData: TaskSyncData = {
        id: 'task1',
        type: 'test_task',
        status: 'FAILED',
        priority: 'LOW',
        pipelineId: 'pipeline1',
        userId: 'user1',
        version: 1,
        lastModified: new Date(),
        modifiedBy: 'user1'
      };

      mockDbService.$executeRaw.mockRejectedValue(new Error('Database error'));

      await expect(service.syncTaskData(taskData, 'tenant1')).rejects.toThrow('Database error');
    });
  });

  describe('syncTaskExecution', () => {
    it('should sync task execution data', async () => {
      const executionData: TaskExecutionSyncData = {
        id: 'exec1',
        taskId: 'task1',
        status: 'COMPLETED',
        output: { result: 'success' },
        startedAt: new Date(),
        completedAt: new Date(),
        version: 1,
        lastModified: new Date()
      };

      mockDbService.$executeRaw.mockResolvedValue([{ id: 'exec1' }]);
      mockDbService.task.findUnique.mockResolvedValue({
        id: 'task1',
        userId: 'user1'
      });

      await service.syncTaskExecution(executionData, 'tenant1');

      expect(mockSyncOrchestrator.syncTenantData).toHaveBeenCalledWith(
        'tenant1',
        'task',
        expect.objectContaining({
          execution: executionData,
          syncTimestamp: expect.any(Date)
        })
      );

      expect(mockRedisService.publish).toHaveBeenCalledWith(
        'task_execution:tenant1',
        expect.objectContaining({
          executionData,
          timestamp: expect.any(Number)
        })
      );
    });

    it('should send completion notification', async () => {
      const executionData: TaskExecutionSyncData = {
        id: 'exec1',
        taskId: 'task1',
        status: 'COMPLETED',
        startedAt: new Date(),
        completedAt: new Date(),
        version: 1,
        lastModified: new Date()
      };

      mockDbService.$executeRaw.mockResolvedValue([{ id: 'exec1' }]);
      mockDbService.task.findUnique.mockResolvedValue({
        id: 'task1',
        userId: 'user1'
      });

      await service.syncTaskExecution(executionData, 'tenant1');

      expect(mockWebSocketService.sendMessage).toHaveBeenCalledWith(
        'user1',
        expect.objectContaining({
          type: 'task_notifications',
          payload: expect.objectContaining({
            notifications: expect.arrayContaining([
              expect.objectContaining({
                type: 'task_completed',
                taskId: 'task1'
              })
            ])
          })
        })
      );
    });
  });

  describe('updateTaskDependencies', () => {
    it('should update task dependencies and sync changes', async () => {
      const taskId = 'task1';
      const dependencies = ['dep1', 'dep2'];

      await service.updateTaskDependencies(taskId, dependencies, 'tenant1');

      expect(mockSyncOrchestrator.syncTenantData).toHaveBeenCalledWith(
        'tenant1',
        'task',
        expect.objectContaining({
          dependencyUpdate: expect.objectContaining({
            taskId,
            dependencies,
            updateType: 'reorder'
          })
        })
      );

      expect(mockRedisService.publish).toHaveBeenCalledWith(
        'task_dependency:tenant1',
        expect.any(Object)
      );

      // Verify dependencies were stored
      const storedDependencies = await service.getTaskDependencies(taskId);
      expect(storedDependencies).toEqual(dependencies);
    });

    it('should notify affected users of dependency changes', async () => {
      const taskId = 'task1';
      const dependencies = ['dep1'];

      // Mock affected tasks
      mockDbService.task.findUnique
        .mockResolvedValueOnce({ id: 'dep1', userId: 'user1' })
        .mockResolvedValueOnce({ id: 'task1', userId: 'user2' });

      await service.updateTaskDependencies(taskId, dependencies, 'tenant1');

      expect(mockWebSocketService.sendMessage).toHaveBeenCalledTimes(2); // One for each affected user
    });
  });

  describe('resolveTaskConflict', () => {
    it('should resolve conflicts using latest wins strategy', async () => {
      const localVersion: TaskSyncData = {
        id: 'task1',
        type: 'test_task',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        pipelineId: 'pipeline1',
        userId: 'user1',
        version: 1,
        lastModified: new Date('2023-01-01T10:00:00Z'),
        modifiedBy: 'user1'
      };

      const remoteVersion: TaskSyncData = {
        ...localVersion,
        status: 'COMPLETED',
        version: 2,
        lastModified: new Date('2023-01-01T11:00:00Z'),
        modifiedBy: 'user2'
      };

      mockDbService.$executeRaw.mockResolvedValue([{ id: 'task1' }]);

      const resolution = await service.resolveTaskConflict(
        'task1',
        localVersion,
        remoteVersion,
        'tenant1'
      );

      expect(resolution.strategy).toBe('latest_wins_remote');
      expect(resolution.resolvedData.status).toBe('COMPLETED');
      expect(resolution.resolvedData.lastModified).toEqual(remoteVersion.lastModified);
    });

    it('should merge non-conflicting fields', async () => {
      const localVersion: TaskSyncData = {
        id: 'task1',
        type: 'test_task',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        pipelineId: 'pipeline1',
        userId: 'user1',
        version: 1,
        lastModified: new Date('2023-01-01T10:00:00Z'),
        modifiedBy: 'user1',
        metadata: { field1: 'value1' }
      };

      const remoteVersion: TaskSyncData = {
        ...localVersion,
        priority: 'MEDIUM',
        version: 1,
        lastModified: new Date('2023-01-01T10:30:00Z'),
        modifiedBy: 'user2',
        metadata: { field2: 'value2' }
      };

      mockDbService.$executeRaw.mockResolvedValue([{ id: 'task1' }]);

      const resolution = await service.resolveTaskConflict(
        'task1',
        localVersion,
        remoteVersion,
        'tenant1'
      );

      expect(resolution.strategy).toBe('merge');
      expect(resolution.resolvedData.metadata).toEqual({
        field1: 'value1',
        field2: 'value2',
        conflictResolved: true,
        conflictResolvedAt: expect.any(Date),
        originalVersions: {
          local: 1,
          remote: 1
        }
      });
    });
  });

  describe('dependency management', () => {
    it('should get task dependencies correctly', async () => {
      await service.updateTaskDependencies('task1', ['dep1', 'dep2'], 'tenant1');
      
      const dependencies = await service.getTaskDependencies('task1');
      expect(dependencies).toEqual(['dep1', 'dep2']);
    });

    it('should get task dependents correctly', async () => {
      await service.updateTaskDependencies('task1', ['dep1'], 'tenant1');
      await service.updateTaskDependencies('task2', ['dep1'], 'tenant1');
      
      const dependents = await service.getTaskDependents('dep1');
      expect(dependents).toEqual(['task1', 'task2']);
    });

    it('should check all dependencies completed', async () => {
      // Mock completed dependencies
      mockDbService.task.findMany.mockResolvedValue([
        { id: 'dep1', status: 'COMPLETED' },
        { id: 'dep2', status: 'COMPLETED' }
      ]);

      // Use reflection to access private method for testing
      const checkMethod = (service as any).checkAllDependenciesCompleted;
      const result = await checkMethod.call(service, ['dep1', 'dep2']);
      
      expect(result).toBe(true);
    });

    it('should return false when dependencies are not completed', async () => {
      // Mock incomplete dependencies
      mockDbService.task.findMany.mockResolvedValue([
        { id: 'dep1', status: 'COMPLETED' },
        { id: 'dep2', status: 'IN_PROGRESS' }
      ]);

      // Use reflection to access private method for testing
      const checkMethod = (service as any).checkAllDependenciesCompleted;
      const result = await checkMethod.call(service, ['dep1', 'dep2']);
      
      expect(result).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources on module destroy', async () => {
      await service.onModuleDestroy();

      expect(mockRedisService.punsubscribe).toHaveBeenCalledTimes(3);
      expect(mockRedisService.punsubscribe).toHaveBeenCalledWith('task_sync:*');
      expect(mockRedisService.punsubscribe).toHaveBeenCalledWith('task_execution:*');
      expect(mockRedisService.punsubscribe).toHaveBeenCalledWith('task_dependency:*');
    });
  });

  describe('public API methods', () => {
    it('should get task sync status', async () => {
      const taskId = 'task1';
      await service.updateTaskDependencies(taskId, ['dep1'], 'tenant1');
      
      const status = await service.getTaskSyncStatus(taskId);
      
      expect(status).toEqual({
        taskId,
        hasPendingSync: false,
        lastSyncOperation: undefined,
        dependencyCount: 1,
        dependentCount: 0
      });
    });
  });
});