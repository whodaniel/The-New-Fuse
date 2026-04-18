import { Test, TestingModule } from '@nestjs/testing';
import { EnhancedTaskManagementService, EnhancedTaskData } from './EnhancedTaskManagementService.js';
import { TaskSynchronizationService } from './TaskSynchronizationService.js';
import { SyncOrchestrator } from '../services/SyncOrchestrator.js';
import { DrizzleService } from '@the-new-fuse/database';

describe('EnhancedTaskManagementService Integration', () => {
  let service: EnhancedTaskManagementService;
  let taskSyncService: jest.Mocked<TaskSynchronizationService>;
  let syncOrchestrator: jest.Mocked<SyncOrchestrator>;
  let dbService: jest.Mocked<DrizzleService>;

  beforeEach(async () => {
    // Create mocks
    taskSyncService = {
      syncTaskData: jest.fn(),
      syncTaskExecution: jest.fn(),
      updateTaskDependencies: jest.fn(),
      getTaskDependencies: jest.fn().mockResolvedValue([]),
      getTaskDependents: jest.fn().mockResolvedValue([]),
      resolveTaskConflict: jest.fn(),
      getTaskSyncStatus: jest.fn(),
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn()
    } as any;

    syncOrchestrator = {
      syncTenantData: jest.fn(),
      syncGlobalData: jest.fn(),
      syncAgentState: jest.fn(),
      syncPromptTemplates: jest.fn(),
      resolveConflict: jest.fn()
    } as any;

    dbService = {
      task: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      taskExecution: {
        create: jest.fn(),
        update: jest.fn()
      },
      workflow: {
        findMany: jest.fn(),
        findUnique: jest.fn()
      },
      workflowStep: {
        update: jest.fn()
      }
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnhancedTaskManagementService,
        {
          provide: TaskSynchronizationService,
          useValue: taskSyncService
        },
        {
          provide: SyncOrchestrator,
          useValue: syncOrchestrator
        },
        {
          provide: DrizzleService,
          useValue: dbService
        }
      ]
    }).compile();

    service = module.get<EnhancedTaskManagementService>(EnhancedTaskManagementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('task lifecycle integration', () => {
    it('should create, execute, and complete a task with full synchronization', async () => {
      // Mock database responses
      const mockCreatedTask = {
        id: 'task1',
        type: 'integration_test',
        status: 'PENDING',
        priority: 'HIGH',
        pipelineId: 'pipeline1',
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockTaskExecution = {
        id: 'exec1',
        taskId: 'task1',
        status: 'RUNNING',
        startedAt: new Date()
      };

      dbService.task.create.mockResolvedValue(mockCreatedTask);
      dbService.taskExecution.create.mockResolvedValue(mockTaskExecution);
      dbService.taskExecution.update.mockResolvedValue({
        ...mockTaskExecution,
        status: 'COMPLETED',
        completedAt: new Date()
      });

      // Step 1: Create task
      const taskData: Omit<EnhancedTaskData, 'id' | 'version' | 'lastModified' | 'modifiedBy'> = {
        type: 'integration_test',
        status: 'PENDING',
        priority: 'HIGH',
        pipelineId: 'pipeline1',
        userId: 'user1',
        dependencies: ['dep1'],
        estimatedDuration: 60000,
        tags: ['integration', 'test']
      };

      const createdTask = await service.createTask(taskData, 'tenant1');

      expect(createdTask.id).toBe('task1');
      expect(createdTask.syncStatus).toBe('pending');
      expect(taskSyncService.syncTaskData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'task1',
          type: 'integration_test',
          status: 'PENDING'
        }),
        'tenant1'
      );
      expect(taskSyncService.updateTaskDependencies).toHaveBeenCalledWith(
        'task1',
        ['dep1'],
        'tenant1'
      );

      // Step 2: Execute task
      const executionId = await service.executeTask('task1', {
        timeout: 120000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential',
          baseDelay: 2000
        }
      }, 'tenant1');

      expect(executionId).toBe('exec1');
      expect(dbService.taskExecution.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          task: { connect: { id: 'task1' } },
          status: 'RUNNING',
          startedAt: expect.any(Date)
        }
      });
      expect(taskSyncService.syncTaskExecution).toHaveBeenCalled();

      // Step 3: Complete task
      const result = { output: 'success', metrics: { duration: 45000 } };
      await service.completeTaskExecution(executionId, result, undefined, 'tenant1');

      expect(dbService.taskExecution.update).toHaveBeenCalledWith({
        where: { id: executionId },
        data: {
          status: 'COMPLETED',
          output: JSON.stringify(result),
          error: undefined,
          completedAt: expect.any(Date)
        }
      });

      // Verify final sync calls
      expect(taskSyncService.syncTaskData).toHaveBeenCalledTimes(3); // Create, execute, complete
      expect(taskSyncService.syncTaskExecution).toHaveBeenCalledTimes(2); // Start, complete
    });

    it('should handle task failure with proper error handling', async () => {
      // Setup existing task
      const existingTask: EnhancedTaskData = {
        id: 'task1',
        type: 'failing_task',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        pipelineId: 'pipeline1',
        userId: 'user1',
        version: 1,
        lastModified: new Date(),
        modifiedBy: 'user1',
        syncStatus: 'synced',
        startTime: new Date()
      };

      // Mock service state
      (service as any).taskCache.set('task1', existingTask);
      (service as any).executionContexts.set('exec1', {
        id: 'exec1',
        taskId: 'task1',
        timeout: 60000
      });

      dbService.taskExecution.update.mockResolvedValue({
        id: 'exec1',
        status: 'FAILED',
        error: 'Task execution failed',
        completedAt: new Date()
      });

      // Complete with error
      const error = 'Task execution failed';
      await service.completeTaskExecution('exec1', undefined, error, 'tenant1');

      expect(taskSyncService.syncTaskData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'task1',
          status: 'FAILED',
          error: 'Task execution failed',
          progress: expect.any(Number)
        }),
        'tenant1'
      );

      expect(taskSyncService.syncTaskExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'exec1',
          status: 'FAILED',
          error: 'Task execution failed'
        }),
        'tenant1'
      );
    });
  });

  describe('workflow integration', () => {
    it('should integrate with workflow system for task progression', async () => {
      // Mock workflow data
      const mockWorkflow = {
        id: 'workflow1',
        steps: [
          { id: 'step1', order: 1 },
          { id: 'step2', order: 2 },
          { id: 'step3', order: 3 }
        ]
      };

      dbService.workflow.findMany.mockResolvedValue([mockWorkflow]);
      dbService.workflow.findUnique.mockResolvedValue(mockWorkflow);
      dbService.workflowStep.update.mockResolvedValue({});

      // Initialize service to load workflow integrations
      await service.onModuleInit();

      // Setup tasks in cache
      const task1: EnhancedTaskData = {
        id: 'step1',
        type: 'workflow_task',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        pipelineId: 'pipeline1',
        userId: 'user1',
        version: 1,
        lastModified: new Date(),
        modifiedBy: 'user1',
        syncStatus: 'synced'
      };

      const task2: EnhancedTaskData = {
        id: 'step2',
        type: 'workflow_task',
        status: 'PENDING',
        priority: 'MEDIUM',
        pipelineId: 'pipeline1',
        userId: 'user1',
        version: 1,
        lastModified: new Date(),
        modifiedBy: 'user1',
        syncStatus: 'synced'
      };

      (service as any).taskCache.set('step1', task1);
      (service as any).taskCache.set('step2', task2);

      // Complete first task
      await service.updateTask('step1', { status: 'COMPLETED' }, 'user1', 'tenant1');

      // Verify workflow step was updated
      expect(dbService.workflowStep.update).toHaveBeenCalledWith({
        where: { id: 'step1' },
        data: {
          lastExecutedAt: expect.any(Date),
          statistics: {
            lastStatus: 'COMPLETED',
            lastExecution: expect.any(Date),
            previousStatus: 'IN_PROGRESS'
          }
        }
      });

      // Verify next task was triggered
      expect(taskSyncService.syncTaskData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'step2',
          status: 'PENDING' // Should remain pending but be marked as ready
        }),
        'tenant1'
      );
    });
  });

  describe('dependency management integration', () => {
    it('should handle complex dependency chains', async () => {
      // Setup dependency chain: task1 -> task2 -> task3
      taskSyncService.getTaskDependencies
        .mockResolvedValueOnce(['task1']) // task2 depends on task1
        .mockResolvedValueOnce(['task2']); // task3 depends on task2

      taskSyncService.getTaskDependents
        .mockResolvedValueOnce(['task2']) // task1 has task2 as dependent
        .mockResolvedValueOnce(['task3']); // task2 has task3 as dependent

      const task1: EnhancedTaskData = {
        id: 'task1',
        type: 'dependency_test',
        status: 'COMPLETED',
        priority: 'HIGH',
        pipelineId: 'pipeline1',
        userId: 'user1',
        version: 1,
        lastModified: new Date(),
        modifiedBy: 'user1',
        syncStatus: 'synced'
      };

      const task2: EnhancedTaskData = {
        id: 'task2',
        type: 'dependency_test',
        status: 'PENDING',
        priority: 'HIGH',
        pipelineId: 'pipeline1',
        userId: 'user1',
        version: 1,
        lastModified: new Date(),
        modifiedBy: 'user1',
        syncStatus: 'synced',
        dependencies: ['task1']
      };

      (service as any).taskCache.set('task1', task1);
      (service as any).taskCache.set('task2', task2);

      // Get task relationships
      const relationships = await service.getTaskRelationships('task2');

      expect(relationships.dependencies).toEqual(['task1']);
      expect(taskSyncService.getTaskDependencies).toHaveBeenCalledWith('task2');
      expect(taskSyncService.getTaskDependents).toHaveBeenCalledWith('task2');
    });

    it('should update dependencies and sync changes', async () => {
      const task: EnhancedTaskData = {
        id: 'task1',
        type: 'dependency_update_test',
        status: 'PENDING',
        priority: 'MEDIUM',
        pipelineId: 'pipeline1',
        userId: 'user1',
        version: 1,
        lastModified: new Date(),
        modifiedBy: 'user1',
        syncStatus: 'synced'
      };

      (service as any).taskCache.set('task1', task);

      // Update task with new dependencies
      const updatedTask = await service.updateTask(
        'task1',
        { dependencies: ['dep1', 'dep2'] },
        'user1',
        'tenant1'
      );

      expect(updatedTask.dependencies).toEqual(['dep1', 'dep2']);
      expect(taskSyncService.updateTaskDependencies).toHaveBeenCalledWith(
        'task1',
        ['dep1', 'dep2'],
        'tenant1'
      );
      expect(taskSyncService.syncTaskData).toHaveBeenCalled();
    });
  });

  describe('progress tracking integration', () => {
    it('should update task progress with real-time sync', async () => {
      const task: EnhancedTaskData = {
        id: 'task1',
        type: 'progress_test',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        pipelineId: 'pipeline1',
        userId: 'user1',
        version: 1,
        lastModified: new Date(),
        modifiedBy: 'user1',
        syncStatus: 'synced',
        progress: 0
      };

      (service as any).taskCache.set('task1', task);

      // Update progress
      await service.updateTaskProgress('task1', 50, { checkpoint: 'halfway' }, 'tenant1');

      expect(taskSyncService.syncTaskData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'task1',
          progress: 50,
          metadata: expect.objectContaining({
            checkpoint: 'halfway',
            lastProgressUpdate: expect.any(Date)
          })
        }),
        'tenant1'
      );
    });

    it('should clamp progress values to valid range', async () => {
      const task: EnhancedTaskData = {
        id: 'task1',
        type: 'progress_clamp_test',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        pipelineId: 'pipeline1',
        userId: 'user1',
        version: 1,
        lastModified: new Date(),
        modifiedBy: 'user1',
        syncStatus: 'synced',
        progress: 50
      };

      (service as any).taskCache.set('task1', task);

      // Test negative progress
      await service.updateTaskProgress('task1', -10, {}, 'tenant1');
      expect(taskSyncService.syncTaskData).toHaveBeenCalledWith(
        expect.objectContaining({ progress: 0 }),
        'tenant1'
      );

      // Test progress over 100
      await service.updateTaskProgress('task1', 150, {}, 'tenant1');
      expect(taskSyncService.syncTaskData).toHaveBeenCalledWith(
        expect.objectContaining({ progress: 100 }),
        'tenant1'
      );
    });
  });

  describe('error handling and resilience', () => {
    it('should handle database errors gracefully', async () => {
      dbService.task.create.mockRejectedValue(new Error('Database connection failed'));

      const taskData: Omit<EnhancedTaskData, 'id' | 'version' | 'lastModified' | 'modifiedBy'> = {
        type: 'error_test',
        status: 'PENDING',
        priority: 'LOW',
        pipelineId: 'pipeline1',
        userId: 'user1'
      };

      await expect(service.createTask(taskData, 'tenant1')).rejects.toThrow('Database connection failed');
    });

    it('should handle sync service errors gracefully', async () => {
      taskSyncService.syncTaskData.mockRejectedValue(new Error('Sync service unavailable'));

      const task: EnhancedTaskData = {
        id: 'task1',
        type: 'sync_error_test',
        status: 'PENDING',
        priority: 'MEDIUM',
        pipelineId: 'pipeline1',
        userId: 'user1',
        version: 1,
        lastModified: new Date(),
        modifiedBy: 'user1',
        syncStatus: 'synced'
      };

      (service as any).taskCache.set('task1', task);

      await expect(
        service.updateTask('task1', { status: 'IN_PROGRESS' }, 'user1', 'tenant1')
      ).rejects.toThrow('Sync service unavailable');
    });
  });

  describe('metrics and monitoring integration', () => {
    it('should provide comprehensive sync metrics', async () => {
      // Setup test data
      const tasks: EnhancedTaskData[] = [
        {
          id: 'task1',
          type: 'metrics_test',
          status: 'COMPLETED',
          priority: 'HIGH',
          pipelineId: 'pipeline1',
          userId: 'user1',
          version: 1,
          lastModified: new Date(),
          modifiedBy: 'user1',
          syncStatus: 'synced'
        },
        {
          id: 'task2',
          type: 'metrics_test',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          pipelineId: 'pipeline1',
          userId: 'user1',
          version: 1,
          lastModified: new Date(),
          modifiedBy: 'user1',
          syncStatus: 'pending'
        }
      ];

      tasks.forEach(task => (service as any).taskCache.set(task.id, task));

      const metrics = await service.getTaskSyncMetrics();

      expect(metrics).toEqual({
        cachedTasks: 2,
        activeExecutions: 0,
        workflowIntegrations: 0,
        syncStatuses: {
          synced: 1,
          pending: 1,
          conflict: 0
        }
      });
    });
  });
});