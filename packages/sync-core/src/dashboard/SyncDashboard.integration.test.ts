import { Test, TestingModule } from '@nestjs/testing';
import { SyncDashboardService } from './SyncDashboardService.js';
import { DashboardWebSocketIntegration } from './DashboardWebSocketIntegration.js';
import { DashboardMonitoringIntegration } from './DashboardMonitoringIntegration.js';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { SyncRedisConfig } from '../config/SyncRedisConfig.js';
import { EventEmitter } from 'events';

describe('SyncDashboard Integration', () => {
  let dashboardService: SyncDashboardService;
  let wsIntegration: DashboardWebSocketIntegration;
  let monitoringIntegration: DashboardMonitoringIntegration;
  let mockRedisService: jest.Mocked<UnifiedRedisService>;
  let mockRedisConfig: jest.Mocked<SyncRedisConfig>;
  let mockWsService: any;
  let mockMonitoringService: any;

  beforeEach(async () => {
    // Mock services
    mockRedisService = {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      publish: jest.fn(),
      keys: jest.fn(),
      hgetall: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn()
    } as any;

    mockRedisConfig = {
      getChannelName: jest.fn(),
      getKeyPattern: jest.fn(),
      getTenantKey: jest.fn(),
      getGlobalKey: jest.fn()
    } as any;

    mockWsService = {
      broadcastToTenant: jest.fn().mockResolvedValue(1),
      broadcastToAll: jest.fn().mockResolvedValue(5),
      sendToUser: jest.fn().mockResolvedValue(true)
    };

    mockMonitoringService = {
      recordMetric: jest.fn().mockResolvedValue(undefined),
      getSystemHealth: jest.fn().mockResolvedValue({
        overall: 'healthy',
        clockSync: { status: 'synced', lastSync: new Date().toISOString(), drift: 0 },
        redis: 'healthy',
        database: 'healthy',
        fileSystem: 'healthy',
        webSocket: 'healthy'
      }),
      createAlert: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      emit: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncDashboardService,
        DashboardWebSocketIntegration,
        DashboardMonitoringIntegration,
        {
          provide: UnifiedRedisService,
          useValue: mockRedisService
        },
        {
          provide: SyncRedisConfig,
          useValue: mockRedisConfig
        },
        {
          provide: 'IAgentWebSocketService',
          useValue: mockWsService
        },
        {
          provide: 'IMonitoringService',
          useValue: mockMonitoringService
        },
        {
          provide: 'IExistingMonitoringService',
          useValue: mockMonitoringService
        }
      ]
    }).compile();

    dashboardService = module.get<SyncDashboardService>(SyncDashboardService);
    wsIntegration = module.get<DashboardWebSocketIntegration>(DashboardWebSocketIntegration);
    monitoringIntegration = module.get<DashboardMonitoringIntegration>(DashboardMonitoringIntegration);

    // Setup mock implementations
    mockRedisConfig.getChannelName.mockImplementation((type, subtype) => `sync:${type}:${subtype}`);
    mockRedisConfig.getKeyPattern.mockImplementation((type, pattern) => `sync:${type}:${pattern}`);
  });

  afterEach(async () => {
    await dashboardService.onModuleDestroy();
  });

  describe('end-to-end dashboard updates', () => {
    beforeEach(async () => {
      await dashboardService.onModuleInit();
      await monitoringIntegration.onModuleInit();
    });

    it('should handle complete sync metrics flow', async () => {
      // Simulate Redis metrics data
      mockRedisService.keys.mockResolvedValue(['sync:metrics:tenant:test-tenant']);
      mockRedisService.hgetall.mockResolvedValue({
        sync_operations: '25',
        conflicts: '5',
        file_changes: '12',
        avg_sync_time: '180',
        success_rate: '94',
        throughput: '15.2',
        network_errors: '2',
        conflict_errors: '3',
        validation_errors: '1'
      });

      // Trigger metrics collection
      await dashboardService['collectAndBroadcastMetrics']();

      // Verify metrics were processed and broadcast
      expect(mockWsService.broadcastToTenant).toHaveBeenCalledWith(
        'test-tenant',
        expect.objectContaining({
          type: 'sync_dashboard_update',
          payload: expect.objectContaining({
            type: 'sync_metrics',
            tenantId: 'test-tenant',
            data: expect.objectContaining({
              operations: { sync: 25, conflicts: 5, fileChanges: 12 },
              performance: { avgSyncTime: 180, successRate: 94, throughput: 15.2 },
              errors: { networkErrors: 2, conflictErrors: 3, validationErrors: 1 }
            })
          })
        })
      );

      // Verify dashboard data is cached
      const dashboardData = await dashboardService.getDashboardData('test-tenant');
      expect(dashboardData.metrics).toBeDefined();
      expect(dashboardData.metrics!.operations.sync).toBe(25);
    });

    it('should handle system health monitoring flow', async () => {
      // Trigger health check
      await dashboardService['checkAndBroadcastHealth']();

      // Verify health was checked and broadcast
      expect(mockMonitoringService.getSystemHealth).toHaveBeenCalled();
      expect(mockWsService.broadcastToAll).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sync_dashboard_update',
          payload: expect.objectContaining({
            type: 'sync_health',
            data: expect.objectContaining({
              status: 'healthy',
              clockSync: expect.objectContaining({
                status: 'synced'
              })
            })
          })
        })
      );
    });

    it('should handle alert creation and broadcasting', async () => {
      const alertData = {
        level: 'warning' as const,
        message: 'High sync latency detected',
        component: 'sync_monitor',
        tenantId: 'test-tenant',
        metadata: { latency: 5000 }
      };

      // Create alert
      await dashboardService.createAlert(alertData);

      // Verify alert was stored in monitoring system
      expect(mockMonitoringService.createAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...alertData,
          id: expect.any(String),
          timestamp: expect.any(Date)
        })
      );

      // Verify alert was broadcast
      expect(mockWsService.broadcastToTenant).toHaveBeenCalledWith(
        'test-tenant',
        expect.objectContaining({
          type: 'sync_dashboard_update',
          payload: expect.objectContaining({
            type: 'system_alert',
            data: expect.objectContaining(alertData)
          })
        })
      );

      // Verify alert is in dashboard data
      const dashboardData = await dashboardService.getDashboardData('test-tenant');
      expect(dashboardData.alerts).toHaveLength(1);
      expect(dashboardData.alerts[0].message).toBe('High sync latency detected');
    });

    it('should handle multi-session user updates', async () => {
      const userUpdate = {
        type: 'task_progress' as const,
        userId: 'user-123',
        data: { taskId: 'task-456', progress: 85, status: 'in_progress' },
        timestamp: new Date()
      };

      // Process user-specific update
      await dashboardService['processDashboardUpdate'](userUpdate);

      // Verify update was sent to user
      expect(mockWsService.sendToUser).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          type: 'sync_dashboard_update',
          payload: userUpdate
        })
      );
    });
  });

  describe('monitoring integration', () => {
    beforeEach(async () => {
      await dashboardService.onModuleInit();
      await monitoringIntegration.onModuleInit();
    });

    it('should integrate with existing monitoring events', async () => {
      const monitoringEvent = {
        type: 'agent_disconnected' as const,
        source: 'heartbeat_service',
        data: { agentId: 'agent-123' },
        timestamp: new Date(),
        severity: 'medium' as const
      };

      // Simulate monitoring event
      await monitoringIntegration['handleMonitoringEvent'](monitoringEvent);

      // Verify metric was recorded
      expect(mockMonitoringService.recordMetric).toHaveBeenCalledWith(
        'monitoring_event_agent_disconnected',
        1,
        {
          source: 'heartbeat_service',
          severity: 'medium',
          tenant: 'global'
        }
      );
    });

    it('should create alerts for high severity monitoring events', async () => {
      const criticalEvent = {
        type: 'system_health_change' as const,
        source: 'monitoring_service',
        data: { status: 'critical', component: 'database' },
        timestamp: new Date(),
        tenantId: 'test-tenant',
        severity: 'critical' as const
      };

      // Simulate critical monitoring event
      await monitoringIntegration['handleMonitoringEvent'](criticalEvent);

      // Verify alert was created
      expect(dashboardService.createAlert).toBeDefined();
    });
  });

  describe('real-time synchronization', () => {
    beforeEach(async () => {
      await dashboardService.onModuleInit();
    });

    it('should synchronize dashboard state across multiple sessions', async () => {
      // Simulate sync operation update
      const syncUpdate = {
        type: 'sync_operation' as const,
        tenantId: 'test-tenant',
        data: {
          id: 'op-123',
          type: 'sync',
          status: 'completed',
          resourceType: 'agent',
          resourceId: 'agent-456',
          startedAt: new Date(),
          completedAt: new Date()
        },
        timestamp: new Date()
      };

      // Process the update
      await dashboardService['processDashboardUpdate'](syncUpdate);

      // Verify it was broadcast to tenant
      expect(mockWsService.broadcastToTenant).toHaveBeenCalledWith(
        'test-tenant',
        expect.objectContaining({
          payload: syncUpdate
        })
      );

      // Verify it's cached for future requests
      const dashboardData = await dashboardService.getDashboardData('test-tenant');
      expect(dashboardData.operations).toHaveLength(1);
      expect(dashboardData.operations[0].id).toBe('op-123');
    });

    it('should handle conflict detection updates', async () => {
      const conflictUpdate = {
        type: 'conflict_detected' as const,
        tenantId: 'test-tenant',
        data: {
          id: 'conflict-789',
          resourceType: 'template',
          resourceId: 'template-123',
          conflictType: 'concurrent',
          localVersion: { version: 1 },
          remoteVersion: { version: 2 },
          createdAt: new Date()
        },
        timestamp: new Date()
      };

      // Process conflict update
      await dashboardService['processDashboardUpdate'](conflictUpdate);

      // Verify broadcast
      expect(mockWsService.broadcastToTenant).toHaveBeenCalledWith(
        'test-tenant',
        expect.objectContaining({
          payload: conflictUpdate
        })
      );
    });
  });

  describe('performance and scalability', () => {
    beforeEach(async () => {
      await dashboardService.onModuleInit();
    });

    it('should handle high volume of updates efficiently', async () => {
      const updates = Array.from({ length: 100 }, (_, i) => ({
        type: 'sync_operation' as const,
        tenantId: 'test-tenant',
        data: {
          id: `op-${i}`,
          type: 'sync',
          status: 'completed',
          resourceType: 'file',
          resourceId: `file-${i}`,
          startedAt: new Date(),
          completedAt: new Date()
        },
        timestamp: new Date()
      }));

      // Process all updates
      const startTime = Date.now();
      await Promise.all(updates.map(update => 
        dashboardService['processDashboardUpdate'](update)
      ));
      const endTime = Date.now();

      // Verify performance (should complete within reasonable time)
      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second

      // Verify only recent operations are kept (max 50)
      const dashboardData = await dashboardService.getDashboardData('test-tenant');
      expect(dashboardData.operations.length).toBeLessThanOrEqual(50);
    });

    it('should limit alert cache size', async () => {
      // Create many alerts
      const alerts = Array.from({ length: 150 }, (_, i) => ({
        level: 'info' as const,
        message: `Test alert ${i}`,
        component: 'test',
        tenantId: 'test-tenant'
      }));

      // Create all alerts
      await Promise.all(alerts.map(alert => 
        dashboardService.createAlert(alert)
      ));

      // Verify cache is limited (max 100)
      const dashboardData = await dashboardService.getDashboardData('test-tenant');
      expect(dashboardData.alerts.length).toBeLessThanOrEqual(100);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await dashboardService.onModuleInit();
    });

    it('should handle Redis connection failures gracefully', async () => {
      mockRedisService.keys.mockRejectedValue(new Error('Redis connection lost'));

      // Should not throw
      await expect(dashboardService['collectAndBroadcastMetrics']()).resolves.not.toThrow();
    });

    it('should handle WebSocket broadcast failures gracefully', async () => {
      mockWsService.broadcastToTenant.mockRejectedValue(new Error('WebSocket error'));

      const update = {
        type: 'sync_metrics' as const,
        tenantId: 'test-tenant',
        data: { operations: { sync: 1, conflicts: 0, fileChanges: 0 } },
        timestamp: new Date()
      };

      // Should not throw
      await expect(dashboardService['processDashboardUpdate'](update)).resolves.not.toThrow();
    });

    it('should handle monitoring service failures gracefully', async () => {
      mockMonitoringService.getSystemHealth.mockRejectedValue(new Error('Monitoring service down'));

      // Should not throw
      await expect(dashboardService['checkAndBroadcastHealth']()).resolves.not.toThrow();
    });
  });
});