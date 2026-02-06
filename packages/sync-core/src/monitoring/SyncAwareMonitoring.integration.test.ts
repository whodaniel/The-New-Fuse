import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { DashboardMonitoringIntegration } from '../dashboard/DashboardMonitoringIntegration';
import { SyncDashboardService } from '../dashboard/SyncDashboardService';
import { SyncAwareHeartbeatMonitoringService } from './SyncAwareHeartbeatMonitoringService';
import { SyncHealthDashboardIntegration } from './SyncHealthDashboardIntegration';
import { UnifiedSyncHealthReporting } from './UnifiedSyncHealthReporting';

// Mock services
class MockHeartbeatMonitoringService extends EventEmitter {
  registerAgent(agentId: string): void {}
  recordHeartbeat(agentId: string): void {
    this.emit('heartbeat_received', { agentId });
  }
  getMonitoringStatus() {
    return {
      activeAgents: 1,
      stalledAgents: 0,
      failedAgents: 0,
      activeAlerts: 0,
      humanNotificationsPending: 0,
    };
  }
}

class MockMasterClockService extends EventEmitter {
  async now(): Promise<Date> {
    return new Date();
  }
  getClockMetrics() {
    return { drift: 0, lastSync: new Date(), syncCount: 1 };
  }
}

class MockSyncOrchestrator extends EventEmitter {
  async syncTenantData(): Promise<void> {}
}

class MockConflictManager extends EventEmitter {
  async resolveConflict(): Promise<any> {
    return { resolved: true };
  }
}

class MockRedisService extends EventEmitter {
  async get(key: string): Promise<string | null> {
    return null;
  }
  async set(key: string, value: string): Promise<void> {}
  async publish(channel: string, message: string): Promise<void> {}
  async subscribe(channel: string): Promise<void> {}
}

class MockRedisConfig {
  getKeyspace(type: string): string {
    return `test:${type}`;
  }
  getChannelName(type: string): string {
    return `test:channel:${type}`;
  }
}

class MockMetricsService {
  async createPerformanceMetric(data: any): Promise<any> {
    return data;
  }
  async createErrorMetric(data: any): Promise<any> {
    return data;
  }
  async createUsageMetric(data: any): Promise<any> {
    return data;
  }
  async getPerformanceStats(): Promise<any> {
    return {};
  }
  async findMetricsByTimeRange(): Promise<any> {
    return [];
  }
}

describe('Sync-Aware Monitoring Integration', () => {
  let module: TestingModule;
  let syncHealthService: SyncAwareHeartbeatMonitoringService;
  let dashboardIntegration: SyncHealthDashboardIntegration;
  let healthReporting: UnifiedSyncHealthReporting;
  let dashboardService: SyncDashboardService;
  let monitoringIntegration: DashboardMonitoringIntegration;

  let mockHeartbeatService: MockHeartbeatMonitoringService;
  let mockMasterClockService: MockMasterClockService;
  let mockSyncOrchestrator: MockSyncOrchestrator;
  let mockConflictManager: MockConflictManager;
  let mockRedisService: MockRedisService;
  let mockRedisConfig: MockRedisConfig;
  let mockMetricsService: MockMetricsService;

  beforeEach(async () => {
    // Create mock instances
    mockHeartbeatService = new MockHeartbeatMonitoringService();
    mockMasterClockService = new MockMasterClockService();
    mockSyncOrchestrator = new MockSyncOrchestrator();
    mockConflictManager = new MockConflictManager();
    mockRedisService = new MockRedisService();
    mockRedisConfig = new MockRedisConfig();
    mockMetricsService = new MockMetricsService();

    module = await Test.createTestingModule({
      providers: [
        // Core services
        {
          provide: SyncDashboardService,
          useFactory: () =>
            new SyncDashboardService(
              mockRedisService as any,
              mockRedisConfig as any,
              {} as any, // Mock WebSocket service
              {} as any // Mock monitoring service
            ),
        },
        {
          provide: DashboardMonitoringIntegration,
          useFactory: (dashboardService: SyncDashboardService) =>
            new DashboardMonitoringIntegration(
              dashboardService,
              {} as any, // Mock monitoring service
              mockMetricsService as any,
              mockHeartbeatService as any
            ),
          inject: [SyncDashboardService],
        },
        {
          provide: SyncAwareHeartbeatMonitoringService,
          useFactory: () =>
            new SyncAwareHeartbeatMonitoringService(
              mockHeartbeatService as any,
              mockMasterClockService as any,
              mockSyncOrchestrator as any,
              mockConflictManager as any
            ),
        },
        {
          provide: SyncHealthDashboardIntegration,
          useFactory: (
            syncHealthService: SyncAwareHeartbeatMonitoringService,
            dashboardService: SyncDashboardService,
            monitoringIntegration: DashboardMonitoringIntegration
          ) =>
            new SyncHealthDashboardIntegration(
              syncHealthService,
              dashboardService,
              monitoringIntegration,
              {} as any, // Mock monitoring service
              mockMetricsService as any
            ),
          inject: [
            SyncAwareHeartbeatMonitoringService,
            SyncDashboardService,
            DashboardMonitoringIntegration,
          ],
        },
        {
          provide: UnifiedSyncHealthReporting,
          useFactory: (
            syncHealthService: SyncAwareHeartbeatMonitoringService,
            dashboardIntegration: SyncHealthDashboardIntegration
          ) =>
            new UnifiedSyncHealthReporting(
              syncHealthService,
              dashboardIntegration,
              mockMetricsService as any
            ),
          inject: [SyncAwareHeartbeatMonitoringService, SyncHealthDashboardIntegration],
        },
      ],
    }).compile();

    // Get service instances
    syncHealthService = module.get<SyncAwareHeartbeatMonitoringService>(
      SyncAwareHeartbeatMonitoringService
    );
    dashboardService = module.get<SyncDashboardService>(SyncDashboardService);
    monitoringIntegration = module.get<DashboardMonitoringIntegration>(
      DashboardMonitoringIntegration
    );
    dashboardIntegration = module.get<SyncHealthDashboardIntegration>(
      SyncHealthDashboardIntegration
    );
    healthReporting = module.get<UnifiedSyncHealthReporting>(UnifiedSyncHealthReporting);

    // Initialize services
    await syncHealthService.onModuleInit();
    await dashboardIntegration.onModuleInit();
    await healthReporting.onModuleInit();
  });

  afterEach(async () => {
    await syncHealthService.onModuleDestroy();
    await dashboardIntegration.onModuleDestroy();
    await healthReporting.onModuleDestroy();
    await module.close();
  });

  describe('End-to-End Monitoring Flow', () => {
    it('should handle complete monitoring workflow from heartbeat to health report', async () => {
      const agentId = 'integration-test-agent';
      const tenantId = 'integration-test-tenant';

      // Track events through the pipeline
      const events: string[] = [];

      // Setup event listeners
      syncHealthService.on('sync_aware_heartbeat_received', () => {
        events.push('heartbeat_received');
      });

      dashboardIntegration.on('sync_health_dashboard_updated', () => {
        events.push('dashboard_updated');
      });

      healthReporting.on('health_report_generated', () => {
        events.push('health_report_generated');
      });

      // Simulate agent heartbeat
      mockHeartbeatService.recordHeartbeat(agentId);

      // Wait for events to propagate
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Simulate sync operation
      mockSyncOrchestrator.emit('sync_operation_completed', {
        agentId,
        operation: { type: 'file_sync' },
        duration: 200,
        tenantId,
      });

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Generate health report
      const report = await healthReporting.generateOnDemandReport();

      // Verify the complete flow
      expect(events).toContain('heartbeat_received');
      expect(report).toBeDefined();
      expect(report.systemOverview).toBeDefined();
      expect(report.syncPerformance).toBeDefined();
      expect(report.agentHealth).toBeDefined();
    });

    it('should handle sync failure escalation workflow', async () => {
      const agentId = 'failing-agent';
      const tenantId = 'test-tenant';

      // Track escalation events
      const escalations: any[] = [];

      syncHealthService.on('sync_health_escalation_created', (escalation) => {
        escalations.push(escalation);
      });

      dashboardIntegration.on('sync_escalation_dashboard_updated', (escalation) => {
        escalations.push({ type: 'dashboard_escalation', data: escalation });
      });

      // Create agent heartbeat
      mockHeartbeatService.recordHeartbeat(agentId);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Simulate multiple sync failures
      for (let i = 0; i < 5; i++) {
        mockSyncOrchestrator.emit('sync_operation_failed', {
          agentId,
          operation: { type: 'file_sync' },
          error: new Error(`Sync failure ${i + 1}`),
          tenantId,
        });
      }

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Manually trigger health check to detect high error rate
      const heartbeat = syncHealthService.getSyncAwareHeartbeat(agentId);
      if (heartbeat) {
        heartbeat.syncMetrics.syncOperationsTotal = 10;
        heartbeat.syncMetrics.syncOperationsFailed = 5;
        heartbeat.syncMetrics.syncErrorRate = 0.5; // 50% error rate
      }

      // Trigger health check
      await (syncHealthService as any).performSyncHealthCheck();

      // Verify escalation was created
      expect(escalations.length).toBeGreaterThan(0);
      expect(escalations[0].type).toBe('sync_failure');
      expect(escalations[0].severity).toBe('critical');
    });

    it('should handle conflict detection and resolution workflow', async () => {
      const agentId = 'conflict-agent';
      const tenantId = 'test-tenant';

      // Track conflict events
      const conflictEvents: any[] = [];

      syncHealthService.on('sync_conflict_health_updated', (data) => {
        conflictEvents.push(data);
      });

      // Create agent heartbeat
      mockHeartbeatService.recordHeartbeat(agentId);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Simulate conflict detection
      mockConflictManager.emit('conflict_detected', {
        agentId,
        conflict: {
          type: 'file_conflict',
          resourceId: 'test-file.txt',
          localVersion: 'v1',
          remoteVersion: 'v2',
        },
        tenantId,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Simulate conflict resolution
      mockConflictManager.emit('conflict_resolved', {
        agentId,
        conflict: {
          type: 'file_conflict',
          resourceId: 'test-file.txt',
          resolution: 'merged',
        },
        tenantId,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify conflict events were processed
      expect(conflictEvents.length).toBe(2);
      expect(conflictEvents[0].resolved).toBeUndefined();
      expect(conflictEvents[1].resolved).toBe(true);

      // Verify conflict metrics were updated
      const heartbeat = syncHealthService.getSyncAwareHeartbeat(agentId);
      expect(heartbeat?.syncMetrics.conflictsDetected).toBeGreaterThan(0);
      expect(heartbeat?.syncMetrics.conflictsResolved).toBeGreaterThan(0);
    });

    it('should generate comprehensive health reports with real data', async () => {
      const agents = ['agent-1', 'agent-2', 'agent-3'];
      const tenantId = 'multi-agent-tenant';

      // Create multiple agents with different health states
      for (const agentId of agents) {
        mockHeartbeatService.recordHeartbeat(agentId);
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Simulate different sync operations
        mockSyncOrchestrator.emit('sync_operation_completed', {
          agentId,
          operation: { type: 'file_sync' },
          duration: Math.random() * 1000 + 100,
          tenantId,
        });
      }

      // Simulate some failures for agent-2
      mockSyncOrchestrator.emit('sync_operation_failed', {
        agentId: 'agent-2',
        operation: { type: 'file_sync' },
        error: new Error('Network timeout'),
        tenantId,
      });

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Generate comprehensive report
      const report = await healthReporting.generateOnDemandReport('real_time');

      // Verify report completeness
      expect(report.reportId).toBeDefined();
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.reportType).toBe('real_time');

      expect(report.systemOverview.totalAgents).toBeGreaterThan(0);
      expect(report.syncPerformance).toBeDefined();
      expect(report.conflictMetrics).toBeDefined();
      expect(report.agentHealth).toBeDefined();
      expect(report.escalationMetrics).toBeDefined();
      expect(report.infrastructureHealth).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.trends).toBeDefined();

      // Verify metrics integration
      expect(typeof report.syncPerformance.errorRate).toBe('number');
      expect(typeof report.syncPerformance.avgLatency).toBe('number');
      expect(typeof report.conflictMetrics.conflictRate).toBe('number');
    });

    it('should handle dashboard updates and alert generation', async () => {
      const agentId = 'dashboard-test-agent';

      // Track dashboard and alert events
      const dashboardUpdates: any[] = [];
      const alerts: any[] = [];

      dashboardIntegration.on('sync_health_dashboard_updated', (data) => {
        dashboardUpdates.push(data);
      });

      healthReporting.on('health_alert', (alert) => {
        alerts.push(alert);
      });

      // Create agent with high error rate
      mockHeartbeatService.recordHeartbeat(agentId);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Simulate high error rate scenario
      const heartbeat = syncHealthService.getSyncAwareHeartbeat(agentId);
      if (heartbeat) {
        heartbeat.syncMetrics.syncOperationsTotal = 100;
        heartbeat.syncMetrics.syncOperationsFailed = 30;
        heartbeat.syncMetrics.syncErrorRate = 0.3; // 30% error rate
        heartbeat.syncMetrics.syncLatencyMs = 8000; // 8 seconds latency
      }

      // Trigger dashboard update
      await (dashboardIntegration as any).updateDashboardData();

      // Generate health report to trigger alerts
      await healthReporting.generateOnDemandReport();

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify dashboard was updated
      const dashboardData = dashboardIntegration.getDashboardData();
      expect(dashboardData).toBeDefined();
      expect(dashboardData.timestamp).toBeInstanceOf(Date);

      // Verify alerts were generated for high error rate and latency
      expect(alerts.length).toBeGreaterThan(0);
      const errorRateAlert = alerts.find((alert) => alert.type === 'error_rate');
      const latencyAlert = alerts.find((alert) => alert.type === 'latency');

      expect(errorRateAlert).toBeDefined();
      expect(latencyAlert).toBeDefined();
    });

    it('should maintain metrics history and provide trend analysis', async () => {
      const agentId = 'trend-test-agent';

      // Create agent and simulate operations over time
      mockHeartbeatService.recordHeartbeat(agentId);

      // Simulate improving performance over time
      const operations = [
        { duration: 5000, success: false }, // Initial poor performance
        { duration: 4000, success: false },
        { duration: 3000, success: true }, // Performance improving
        { duration: 2000, success: true },
        { duration: 1000, success: true }, // Good performance
      ];

      for (const [index, op] of operations.entries()) {
        if (op.success) {
          mockSyncOrchestrator.emit('sync_operation_completed', {
            agentId,
            operation: { type: 'file_sync' },
            duration: op.duration,
            tenantId: 'trend-tenant',
          });
        } else {
          mockSyncOrchestrator.emit('sync_operation_failed', {
            agentId,
            operation: { type: 'file_sync' },
            error: new Error('Sync failed'),
            tenantId: 'trend-tenant',
          });
        }

        // Small delay between operations
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      // Get metrics history
      const errorRateHistory = dashboardIntegration.getMetricsHistory('sync_error_rate', 60);
      const latencyHistory = dashboardIntegration.getMetricsHistory('sync_latency', 60);

      // Verify history is being tracked
      expect(errorRateHistory).toBeDefined();
      expect(latencyHistory).toBeDefined();

      // Generate report with trends
      const report = await healthReporting.generateOnDemandReport();

      // Verify trends are calculated
      expect(report.trends).toBeDefined();
      expect(report.trends.errorRateTrend).toBeDefined();
      expect(report.trends.latencyTrend).toBeDefined();
      expect(report.trends.throughputTrend).toBeDefined();
      expect(report.trends.conflictTrend).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent agents efficiently', async () => {
      const agentCount = 50;
      const agents = Array.from({ length: agentCount }, (_, i) => `perf-agent-${i}`);

      const startTime = Date.now();

      // Create all agents concurrently
      const heartbeatPromises = agents.map((agentId) => {
        return new Promise<void>((resolve) => {
          mockHeartbeatService.recordHeartbeat(agentId);
          resolve();
        });
      });

      await Promise.all(heartbeatPromises);

      // Simulate concurrent sync operations
      const syncPromises = agents.map((agentId) => {
        return new Promise<void>((resolve) => {
          mockSyncOrchestrator.emit('sync_operation_completed', {
            agentId,
            operation: { type: 'file_sync' },
            duration: Math.random() * 500 + 100,
            tenantId: `tenant-${Math.floor(Math.random() * 10)}`,
          });
          resolve();
        });
      });

      await Promise.all(syncPromises);

      const processingTime = Date.now() - startTime;

      // Generate health report
      const report = await healthReporting.generateOnDemandReport();

      // Verify performance
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(report.systemOverview.totalAgents).toBe(agentCount);

      // Verify all agents are tracked
      const unifiedReport = syncHealthService.getUnifiedHealthReport();
      expect(unifiedReport.agentCount).toBe(agentCount);
    });

    it('should handle high-frequency events without memory leaks', async () => {
      const agentId = 'high-freq-agent';
      mockHeartbeatService.recordHeartbeat(agentId);

      const initialMemory = process.memoryUsage().heapUsed;

      // Generate high-frequency events
      for (let i = 0; i < 1000; i++) {
        mockSyncOrchestrator.emit('sync_operation_completed', {
          agentId,
          operation: { type: 'file_sync' },
          duration: 100,
          tenantId: 'high-freq-tenant',
        });

        if (i % 100 === 0) {
          // Periodic garbage collection hint
          if (global.gc) {
            global.gc();
          }
        }
      }

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB for 1000 operations)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

      // Verify system is still responsive
      const report = await healthReporting.generateOnDemandReport();
      expect(report).toBeDefined();
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from service failures gracefully', async () => {
      const agentId = 'resilience-test-agent';

      // Create normal operation
      mockHeartbeatService.recordHeartbeat(agentId);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Simulate service failure by throwing errors
      const originalMethod = (syncHealthService as any).collectAgentSyncMetrics;
      (syncHealthService as any).collectAgentSyncMetrics = jest
        .fn()
        .mockRejectedValue(new Error('Service failure'));

      // System should continue operating despite the failure
      mockHeartbeatService.recordHeartbeat(agentId);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Restore service
      (syncHealthService as any).collectAgentSyncMetrics = originalMethod;

      // Verify system recovers
      mockHeartbeatService.recordHeartbeat(agentId);
      await new Promise((resolve) => setTimeout(resolve, 50));

      const report = await healthReporting.generateOnDemandReport();
      expect(report).toBeDefined();
      expect(report.systemOverview.health).toBeDefined();
    });

    it('should handle malformed events gracefully', async () => {
      const agentId = 'malformed-test-agent';

      // Create normal agent
      mockHeartbeatService.recordHeartbeat(agentId);

      // Send malformed events
      mockSyncOrchestrator.emit('sync_operation_completed', null);
      mockSyncOrchestrator.emit('sync_operation_completed', { invalid: 'data' });
      mockConflictManager.emit('conflict_detected', undefined);

      // System should continue operating
      await new Promise((resolve) => setTimeout(resolve, 100));

      const report = await healthReporting.generateOnDemandReport();
      expect(report).toBeDefined();
    });
  });
});
