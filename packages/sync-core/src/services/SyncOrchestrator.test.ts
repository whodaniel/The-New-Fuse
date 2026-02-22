import { Test, TestingModule } from '@nestjs/testing';
import { SyncOrchestrator, AgentState, IWebSocketService } from './SyncOrchestrator';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { DrizzleService } from '@the-new-fuse/database';
import { PromptTemplateServiceImpl } from '@the-new-fuse/prompt-templating';
import { SyncConflictData, SyncResourceType } from '../types';

describe('SyncOrchestrator', () => {
  let service: SyncOrchestrator;
  let redisService: jest.Mocked<UnifiedRedisService>;
  let wsService: jest.Mocked<IWebSocketService>;
  let dbService: jest.Mocked<DrizzleService>;
  let promptTemplateService: jest.Mocked<PromptTemplateServiceImpl>;

  const mockUser = {
    id: 'user-1',
    role: 'USER',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockAgent = {
    id: 'agent-1',
    userId: 'user-1',
    name: 'Test Agent',
    status: 'ACTIVE',
    type: 'CHAT',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const mockRedisService = {
      psubscribe: jest.fn(),
      punsubscribe: jest.fn(),
      publish: jest.fn(),
      lpush: jest.fn(),
      $executeRaw: jest.fn(),
      $queryRaw: jest.fn()
    };

    const mockWsService = {
      sendMessage: jest.fn(),
      broadcastToAllUsers: jest.fn()
    };

    const mockDbService = {
      user: {
        findMany: jest.fn()
      },
      agent: {
        update: jest.fn(),
        upsert: jest.fn()
      },
      task: {
        upsert: jest.fn()
      },
      workflow: {
        upsert: jest.fn()
      },
      $executeRaw: jest.fn(),
      $queryRaw: jest.fn()
    };

    const mockPromptTemplateService = {
      updateTemplate: jest.fn(),
      createTemplate: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncOrchestrator,
        {
          provide: UnifiedRedisService,
          useValue: mockRedisService
        },
        {
          provide: 'IWebSocketService',
          useValue: mockWsService
        },
        {
          provide: DrizzleService,
          useValue: mockDbService
        },
        {
          provide: PromptTemplateServiceImpl,
          useValue: mockPromptTemplateService
        }
      ]
    }).compile();

    service = module.get<SyncOrchestrator>(SyncOrchestrator);
    redisService = module.get(UnifiedRedisService);
    wsService = module.get('IWebSocketService');
    dbService = module.get(DrizzleService);
    promptTemplateService = module.get(PromptTemplateServiceImpl);

    // Setup default mocks
    dbService.user.findMany.mockResolvedValue([mockUser]);
    dbService.$executeRaw.mockResolvedValue(undefined);
    dbService.$queryRaw.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize successfully', async () => {
      await service.onModuleInit();

      expect(redisService.psubscribe).toHaveBeenCalledTimes(2);
      expect(redisService.psubscribe).toHaveBeenCalledWith(
        'sync:*',
        expect.any(Function)
      );
      expect(redisService.psubscribe).toHaveBeenCalledWith(
        'conflict:*',
        expect.any(Function)
      );
      expect(dbService.user.findMany).toHaveBeenCalled();
    });

    it('should load tenant contexts', async () => {
      await service.onModuleInit();

      const tenantContext = await service.getTenantContext('user-1');
      expect(tenantContext).toBeDefined();
      expect(tenantContext?.tenantId).toBe('user-1');
      expect(tenantContext?.userId).toBe('user-1');
      expect(tenantContext?.permissions).toContain('read');
      expect(tenantContext?.permissions).toContain('write');
    });
  });

  describe('syncTenantData', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should sync tenant data successfully', async () => {
      const testData = { id: 'test-1', name: 'Test Data' };
      
      await service.syncTenantData('user-1', 'agent', testData);

      expect(dbService.$executeRaw).toHaveBeenCalled();
      expect(redisService.publish).toHaveBeenCalledWith(
        'sync:user-1:agent',
        expect.objectContaining({
          operation: expect.objectContaining({
            resourceType: 'agent',
            tenantId: 'user-1',
            data: testData
          })
        })
      );
      expect(wsService.sendMessage).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          type: 'sync_update',
          payload: expect.objectContaining({
            tenantId: 'user-1',
            resourceType: 'agent'
          })
        })
      );
    });

    it('should throw error for unknown tenant', async () => {
      const testData = { id: 'test-1', name: 'Test Data' };
      
      await expect(
        service.syncTenantData('unknown-tenant', 'agent', testData)
      ).rejects.toThrow('Tenant context not found: unknown-tenant');
    });
  });

  describe('syncGlobalData', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should sync global data successfully', async () => {
      const testData = { id: 'global-1', name: 'Global Data' };
      
      await service.syncGlobalData('template', testData);

      expect(dbService.$executeRaw).toHaveBeenCalled();
      expect(redisService.publish).toHaveBeenCalledWith(
        'sync:global:template',
        expect.objectContaining({
          operation: expect.objectContaining({
            resourceType: 'template',
            data: testData
          })
        })
      );
      expect(wsService.broadcastToAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sync_update',
          payload: expect.objectContaining({
            dataType: 'template',
            global: true
          })
        })
      );
    });
  });

  describe('syncAgentState', () => {
    beforeEach(async () => {
      await service.onModuleInit();
      dbService.agent.update.mockResolvedValue(mockAgent);
    });

    it('should sync agent state successfully', async () => {
      const agentState: AgentState = {
        id: 'agent-1',
        status: 'ACTIVE',
        metadata: { test: 'data' },
        lastUpdate: new Date()
      };

      await service.syncAgentState('agent-1', agentState);

      expect(dbService.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: {
          status: 'ACTIVE',
          metadata: { test: 'data' },
          updatedAt: expect.any(Date)
        }
      });
      expect(redisService.publish).toHaveBeenCalled();
    });

    it('should handle agent update errors', async () => {
      dbService.agent.update.mockRejectedValue(new Error('Database error'));
      
      const agentState: AgentState = {
        id: 'agent-1',
        status: 'ACTIVE',
        metadata: {},
        lastUpdate: new Date()
      };

      await expect(
        service.syncAgentState('agent-1', agentState)
      ).rejects.toThrow('Database error');
    });
  });

  describe('syncPromptTemplates', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should sync new templates', async () => {
      const templates = [
        { name: 'New Template', content: 'Template content' }
      ];

      await service.syncPromptTemplates(templates);

      expect(promptTemplateService.createTemplate).toHaveBeenCalledWith(templates[0]);
      expect(redisService.publish).toHaveBeenCalled();
    });

    it('should sync existing templates', async () => {
      const templates = [
        { id: 'template-1', name: 'Updated Template', content: 'Updated content' }
      ];

      await service.syncPromptTemplates(templates);

      expect(promptTemplateService.updateTemplate).toHaveBeenCalledWith(
        'template-1',
        templates[0]
      );
      expect(redisService.publish).toHaveBeenCalled();
    });
  });

  describe('resolveConflict', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should resolve conflict with latest_wins strategy', async () => {
      const conflict: SyncConflictData = {
        id: 'conflict-1',
        resourceType: 'agent',
        resourceId: 'agent-1',
        tenantId: 'user-1',
        conflictType: 'version',
        localVersion: { timestamp: '2023-01-01T00:00:00Z', data: 'local' },
        remoteVersion: { timestamp: '2023-01-02T00:00:00Z', data: 'remote' },
        createdAt: new Date()
      };

      const resolution = await service.resolveConflict(conflict);

      expect(resolution.strategy).toBe('latest_wins');
      expect(resolution.resolvedData.data).toBe('remote'); // Remote is newer
      expect(dbService.$executeRaw).toHaveBeenCalled(); // Conflict resolution update
      expect(redisService.publish).toHaveBeenCalled(); // Sync resolved data
    });

    it('should resolve conflict with merge strategy', async () => {
      const conflict: SyncConflictData = {
        id: 'conflict-1',
        resourceType: 'agent',
        resourceId: 'agent-1',
        tenantId: 'user-1',
        conflictType: 'checksum',
        localVersion: { field1: 'local', field2: 'shared' },
        remoteVersion: { field1: 'remote', field3: 'new' },
        createdAt: new Date()
      };

      const resolution = await service.resolveConflict(conflict);

      expect(resolution.strategy).toBe('merge');
      expect(resolution.resolvedData).toEqual(
        expect.objectContaining({
          field1: 'remote', // Remote overwrites local
          field2: 'shared', // Local field preserved
          field3: 'new',    // New remote field added
          mergedAt: expect.any(Date),
          mergeStrategy: 'simple_merge'
        })
      );
    });

    it('should queue manual resolution for concurrent conflicts', async () => {
      const conflict: SyncConflictData = {
        id: 'conflict-1',
        resourceType: 'agent',
        resourceId: 'agent-1',
        tenantId: 'user-1',
        conflictType: 'concurrent',
        localVersion: { data: 'local' },
        remoteVersion: { data: 'remote' },
        createdAt: new Date()
      };

      const resolution = await service.resolveConflict(conflict);

      expect(resolution.strategy).toBe('manual');
      expect(resolution.resolvedData).toBeNull();
      expect(redisService.lpush).toHaveBeenCalledWith(
        'manual_conflicts',
        JSON.stringify(conflict)
      );
    });
  });

  describe('metrics and monitoring', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should return current metrics', () => {
      const metrics = service.getMetrics();

      expect(metrics).toHaveProperty('operations');
      expect(metrics).toHaveProperty('performance');
      expect(metrics).toHaveProperty('resources');
      expect(metrics.operations).toHaveProperty('sync');
      expect(metrics.operations).toHaveProperty('conflicts');
    });

    it('should return active tenants', () => {
      const tenants = service.getActiveTenants();

      expect(tenants).toContain('user-1');
      expect(tenants).toHaveLength(1);
    });

    it('should return active operations', async () => {
      const operations = await service.getActiveOperations();

      expect(Array.isArray(operations)).toBe(true);
    });

    it('should return tenant context', async () => {
      const context = await service.getTenantContext('user-1');

      expect(context).toBeDefined();
      expect(context?.tenantId).toBe('user-1');
      expect(context?.isolationLevel).toBe('strict');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should handle Redis publish errors gracefully', async () => {
      redisService.publish.mockRejectedValue(new Error('Redis error'));
      
      const testData = { id: 'test-1', name: 'Test Data' };
      
      await expect(
        service.syncTenantData('user-1', 'agent', testData)
      ).rejects.toThrow('Redis error');
    });

    it('should handle database errors gracefully', async () => {
      dbService.$executeRaw.mockRejectedValue(new Error('Database error'));
      
      const testData = { id: 'test-1', name: 'Test Data' };
      
      await expect(
        service.syncTenantData('user-1', 'agent', testData)
      ).rejects.toThrow('Database error');
    });

    it('should handle WebSocket errors gracefully', async () => {
      wsService.sendMessage.mockRejectedValue(new Error('WebSocket error'));
      
      const testData = { id: 'test-1', name: 'Test Data' };
      
      // Should not throw even if WebSocket fails
      await service.syncTenantData('user-1', 'agent', testData);
      
      expect(dbService.$executeRaw).toHaveBeenCalled();
      expect(redisService.publish).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources on module destroy', async () => {
      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(redisService.punsubscribe).toHaveBeenCalledWith('sync:*');
      expect(redisService.punsubscribe).toHaveBeenCalledWith('conflict:*');
    });
  });
});