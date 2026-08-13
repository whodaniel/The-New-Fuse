import { Test, TestingModule } from '@nestjs/testing';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { SyncRedisConfig } from '../config/SyncRedisConfig';
import {
  IAgentWebSocketService,
  IMonitoringService,
  SyncDashboardService,
} from './SyncDashboardService';

describe('SyncDashboardService', () => {
  let service: SyncDashboardService;
  let mockRedisService: jest.Mocked<UnifiedRedisService>;
  let mockRedisConfig: jest.Mocked<SyncRedisConfig>;
  let mockWsService: jest.Mocked<IAgentWebSocketService>;
  let mockMonitoringService: jest.Mocked<IMonitoringService>;

  beforeEach(async () => {
    // Mock Redis service
    mockRedisService = {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      keys: jest.fn(),
      hgetall: jest.fn(),
      publish: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
    } as any;

    // Mock Redis config
    mockRedisConfig = {
      getChannelName: jest.fn(),
      getKeyPattern: jest.fn(),
      getTenantKey: jest.fn(),
      getGlobalKey: jest.fn(),
    } as any;

    // Mock WebSocket service
    mockWsService = {
      broadcastToTenant: jest.fn(),
      broadcastToAll: jest.fn(),
      sendToUser: jest.fn(),
    };

    // Mock monitoring service
    mockMonitoringService = {
      recordMetric: jest.fn(),
      getSystemHealth: jest.fn(),
      createAlert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SyncDashboardService,
          useFactory: () =>
            new SyncDashboardService(
              mockRedisService,
              mockRedisConfig,
              mockWsService,
              mockMonitoringService
            ),
        },
      ],
    }).compile();

    service = module.get<SyncDashboardService>(SyncDashboardService);

    // Setup mock implementations
    mockRedisConfig.getChannelName.mockImplementation((type, subtype) => `sync:${type}:${subtype}`);
    mockRedisConfig.getKeyPattern.mockImplementation((type, pattern) => `sync:${type}:${pattern}`);
  });

  afterEach(async () => {
    if (service) {
      await service.onModuleDestroy();
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await service.onModuleInit();

      // Verify Redis subscriptions
      expect(mockRedisService.subscribe).toHaveBeenCalledTimes(6);
      expect(mockRedisService.subscribe).toHaveBeenCalledWith(
        'sync:sync:operations',
        expect.any(Function)
      );
      expect(mockRedisService.subscribe).toHaveBeenCalledWith(
        'sync:sync:conflicts',
        expect.any(Function)
      );
    });

    it('should handle initialization errors gracefully', async () => {
      mockRedisService.subscribe.mockRejectedValue(new Error('Redis connection failed'));

      await expect(service.onModuleInit()).rejects.toThrow('Redis connection failed');
    });
  });

  describe('dashboard updates', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should process sync metrics update', async () => {
      const metricsUpdate = {
        type: 'sync_metrics' as const,
        tenantId: 'tenant-1',
        data: {
          operations: { sync: 10, conflicts: 2, fileChanges: 5 },
          performance: { avgSyncTime: 150, successRate: 95, throughput: 10.5 },
          errors: { networkErrors: 1, conflictErrors: 2, validationErrors: 0 },
        },
        timestamp: new Date(),
      };

      // Simulate receiving update
      service['processDashboardUpdate'](metricsUpdate);

      // Verify WebSocket broadcast
      expect(mockWsService.broadcastToTenant).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          type: 'sync_dashboard_update',
          payload: metricsUpdate,
        })
      );

      // Verify metrics recording
      expect(mockMonitoringService.recordMetric).toHaveBeenCalledWith(
        'sync_dashboard_updates_total',
        1,
        { type: 'sync_metrics', tenant: 'tenant-1' }
      );
    });

    it('should process system alert update', async () => {
      const alertUpdate = {
        type: 'system_alert' as const,
        tenantId: 'tenant-1',
        data: {
          id: 'alert-1',
          level: 'warning' as const,
          message: 'High CPU usage detected',
          component: 'system_monitor',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };

      service['processDashboardUpdate'](alertUpdate);

      // Verify alert is cached
      const dashboardData = await service.getDashboardData('tenant-1');
      expect(dashboardData.alerts).toHaveLength(1);
      expect(dashboardData.alerts[0]).toEqual(alertUpdate.data);
    });

    it('should broadcast to all users for global updates', async () => {
      const globalUpdate = {
        type: 'sync_health' as const,
        data: {
          status: 'healthy',
          clockSync: { status: 'synced', lastSync: new Date(), drift: 0 },
          services: {
            redis: 'healthy',
            database: 'healthy',
            fileSystem: 'healthy',
            webSocket: 'healthy',
          },
          lastCheck: new Date(),
        },
        timestamp: new Date(),
      };

      service['processDashboardUpdate'](globalUpdate);

      expect(mockWsService.broadcastToAll).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sync_dashboard_update',
          payload: globalUpdate,
        })
      );
    });

    it('should send to specific user when userId is provided', async () => {
      const userUpdate = {
        type: 'task_progress' as const,
        userId: 'user-1',
        data: { taskId: 'task-1', progress: 75 },
        timestamp: new Date(),
      };

      service['processDashboardUpdate'](userUpdate);

      expect(mockWsService.sendToUser).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          type: 'sync_dashboard_update',
          payload: userUpdate,
        })
      );
    });
  });

  describe('metrics collection', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should collect and broadcast metrics from Redis', async () => {
      // Mock Redis keys and data
      mockRedisService.keys.mockResolvedValue([
        'sync:metrics:tenant:tenant-1',
        'sync:metrics:global',
      ]);

      mockRedisService.hgetall.mockImplementation((key) => {
        if (key === 'sync:metrics:tenant:tenant-1') {
          return Promise.resolve({
            sync_operations: '15',
            conflicts: '3',
            file_changes: '8',
            avg_sync_time: '200',
            success_rate: '92',
            throughput: '12.5',
          });
        }
        return Promise.resolve({});
      });

      await service['collectAndBroadcastMetrics']();

      expect(mockRedisService.keys).toHaveBeenCalledWith('sync:metrics:*');
      expect(mockWsService.broadcastToTenant).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          payload: expect.objectContaining({
            type: 'sync_metrics',
            data: expect.objectContaining({
              operations: { sync: 15, conflicts: 3, fileChanges: 8 },
              performance: { avgSyncTime: 200, successRate: 92, throughput: 12.5 },
            }),
          }),
        })
      );
    });
  });

  describe('health monitoring', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should check and broadcast system health', async () => {
      const mockHealth = {
        overall: 'healthy',
        clockSync: { status: 'synced', lastSync: new Date().toISOString(), drift: 5 },
        redis: 'healthy',
        database: 'healthy',
        fileSystem: 'healthy',
        webSocket: 'healthy',
      };

      mockMonitoringService.getSystemHealth.mockResolvedValue(mockHealth);

      await service['checkAndBroadcastHealth']();

      expect(mockMonitoringService.getSystemHealth).toHaveBeenCalled();
      expect(mockWsService.broadcastToAll).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            type: 'sync_health',
            data: expect.objectContaining({
              status: 'healthy',
              clockSync: expect.objectContaining({
                status: 'synced',
                drift: 5,
              }),
            }),
          }),
        })
      );
    });

    it('should handle health check errors gracefully', async () => {
      mockMonitoringService.getSystemHealth.mockRejectedValue(new Error('Health check failed'));

      // Should not throw
      await expect(service['checkAndBroadcastHealth']()).resolves.not.toThrow();
    });
  });

  describe('alert management', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should create and broadcast alerts', async () => {
      const alertData = {
        level: 'critical' as const,
        message: 'Database connection lost',
        component: 'database_monitor',
        tenantId: 'tenant-1',
        metadata: { connectionId: 'conn-123' },
      };

      await service.createAlert(alertData);

      expect(mockMonitoringService.createAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...alertData,
          id: expect.any(String),
          timestamp: expect.any(Date),
        })
      );

      expect(mockWsService.broadcastToTenant).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          payload: expect.objectContaining({
            type: 'system_alert',
            data: expect.objectContaining(alertData),
          }),
        })
      );
    });
  });

  describe('dashboard data retrieval', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should return cached dashboard data', async () => {
      // Add some test data to cache
      const testMetrics = {
        operations: { sync: 5, conflicts: 1, fileChanges: 3 },
        performance: { avgSyncTime: 100, successRate: 98, throughput: 8.5 },
        errors: { networkErrors: 0, conflictErrors: 1, validationErrors: 0 },
      };

      service['metricsCache'].set('tenant-1', testMetrics);

      const dashboardData = await service.getDashboardData('tenant-1');

      expect(dashboardData.metrics).toEqual(testMetrics);
      expect(dashboardData.health).toBeNull();
      expect(dashboardData.alerts).toEqual([]);
      expect(dashboardData.operations).toEqual([]);
    });

    it('should return global data when no tenant specified', async () => {
      const globalHealth = {
        status: 'healthy' as const,
        clockSync: { status: 'synced' as const, lastSync: new Date(), drift: 0 },
        services: {
          redis: 'healthy',
          database: 'healthy',
          fileSystem: 'healthy',
          webSocket: 'healthy',
        },
        lastCheck: new Date(),
      };

      service['healthCache'].set('global', globalHealth);

      const dashboardData = await service.getDashboardData();

      expect(dashboardData.health).toEqual(globalHealth);
    });
  });

  describe('refresh functionality', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should refresh dashboard data', async () => {
      const collectSpy = jest.spyOn(service as any, 'collectAndBroadcastMetrics');
      const healthSpy = jest.spyOn(service as any, 'checkAndBroadcastHealth');

      await service.refreshDashboard('tenant-1');

      expect(collectSpy).toHaveBeenCalled();
      expect(healthSpy).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources on destroy', async () => {
      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(mockRedisService.unsubscribe).toHaveBeenCalledTimes(6);
    });
  });

  describe('tenant key extraction', () => {
    it('should extract tenant ID from Redis key', () => {
      const extractTenant = service['extractTenantFromKey'].bind(service);

      expect(extractTenant('sync:metrics:tenant:tenant-123:data')).toBe('tenant-123');
      expect(extractTenant('sync:health:tenant:abc-def:status')).toBe('abc-def');
      expect(extractTenant('sync:global:data')).toBeUndefined();
    });
  });
});
