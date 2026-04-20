import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { 
  SyncAwareHeartbeatMonitoringService,
  SyncHealthMetrics,
  SyncAwareAgentHeartbeat,
  SyncAwareStagnationAlert,
  SyncHealthEscalation
} from './SyncAwareHeartbeatMonitoringService.js';
import { 
  HeartbeatMonitoringService, 
  HeartbeatConfig, 
  StagnationAlert 
} from '@the-new-fuse/relay-core';
import { MasterClockService } from '../services/MasterClockService.js';
import { SyncOrchestrator } from '../services/SyncOrchestrator.js';
import { ConflictManager } from '../services/ConflictManager.js';

// Mock implementations
class MockHeartbeatMonitoringService extends EventEmitter {
  private heartbeats = new Map();
  
  registerAgent(agentId: string, expectedResponseTime?: number): void {
    this.heartbeats.set(agentId, { agentId, status: 'active' });
  }
  
  recordHeartbeat(agentId: string, taskId?: string): void {
    this.emit('heartbeat_received', { agentId, taskId });
  }
  
  getAgentHeartbeat(agentId: string) {
    return this.heartbeats.get(agentId);
  }
  
  getMonitoringStatus() {
    return {
      activeAgents: this.heartbeats.size,
      stalledAgents: 0,
      failedAgents: 0,
      activeAlerts: 0,
      humanNotificationsPending: 0
    };
  }
}

class MockMasterClockService extends EventEmitter {
  async now(): Promise<Date> {
    return new Date();
  }
  
  async syncTime(instanceId: string): Promise<void> {
    // Mock implementation
  }
  
  getClockMetrics() {
    return {
      drift: 0,
      lastSync: new Date(),
      syncCount: 1
    };
  }
}

class MockSyncOrchestrator extends EventEmitter {
  async syncTenantData(tenantId: string, dataType: string, data: any): Promise<void> {
    this.emit('sync_operation_completed', {
      agentId: 'test-agent',
      operation: { type: dataType },
      duration: 100,
      tenantId
    });
  }
}

class MockConflictManager extends EventEmitter {
  async resolveConflict(conflict: any): Promise<any> {
    this.emit('conflict_resolved', {
      agentId: 'test-agent',
      conflict,
      tenantId: 'test-tenant'
    });
    return { resolved: true };
  }
}

describe('SyncAwareHeartbeatMonitoringService', () => {
  let service: SyncAwareHeartbeatMonitoringService;
  let module: TestingModule;
  let mockHeartbeatService: MockHeartbeatMonitoringService;
  let mockMasterClockService: MockMasterClockService;
  let mockSyncOrchestrator: MockSyncOrchestrator;
  let mockConflictManager: MockConflictManager;

  beforeEach(async () => {
    mockHeartbeatService = new MockHeartbeatMonitoringService();
    mockMasterClockService = new MockMasterClockService();
    mockSyncOrchestrator = new MockSyncOrchestrator();
    mockConflictManager = new MockConflictManager();

    module = await Test.createTestingModule({
      providers: [
        {
          provide: SyncAwareHeartbeatMonitoringService,
          useFactory: () => new SyncAwareHeartbeatMonitoringService(
            mockHeartbeatService as any,
            mockMasterClockService as any,
            mockSyncOrchestrator as any,
            mockConflictManager as any
          )
        }
      ],
    }).compile();

    service = module.get<SyncAwareHeartbeatMonitoringService>(SyncAwareHeartbeatMonitoringService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
    await module.close();
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should setup heartbeat integration on init', async () => {
      const setupSpy = jest.spyOn(service as any, 'setupHeartbeatIntegration');
      await service.onModuleInit();
      expect(setupSpy).toHaveBeenCalled();
    });

    it('should setup sync integration on init', async () => {
      const setupSpy = jest.spyOn(service as any, 'setupSyncIntegration');
      await service.onModuleInit();
      expect(setupSpy).toHaveBeenCalled();
    });
  });

  describe('Heartbeat Integration', () => {
    it('should handle heartbeat received events', (done) => {
      const agentId = 'test-agent-1';
      
      service.on('sync_aware_heartbeat_received', (data) => {
        expect(data.agentId).toBe(agentId);
        expect(data.syncMetrics).toBeDefined();
        expect(data.syncState).toBeDefined();
        done();
      });

      mockHeartbeatService.recordHeartbeat(agentId, 'test-task');
    });

    it('should create sync-aware heartbeat on first heartbeat', (done) => {
      const agentId = 'test-agent-2';
      
      service.on('sync_aware_heartbeat_received', (data) => {
        const heartbeat = service.getSyncAwareHeartbeat(agentId);
        expect(heartbeat).toBeDefined();
        expect(heartbeat?.agentId).toBe(agentId);
        expect(heartbeat?.syncMetrics).toBeDefined();
        expect(heartbeat?.syncState).toBe('synchronized');
        done();
      });

      mockHeartbeatService.recordHeartbeat(agentId);
    });

    it('should handle stagnation detected events', (done) => {
      const agentId = 'test-agent-3';
      const stagnationAlert: StagnationAlert = {
        agentId,
        taskId: 'test-task',
        stagnationType: 'no_heartbeat',
        detectedAt: new Date(),
        duration: 30000,
        severity: 'warning'
      };

      service.on('sync_aware_stagnation_detected', (alert: SyncAwareStagnationAlert) => {
        expect(alert.agentId).toBe(agentId);
        expect(alert.syncContext).toBeDefined();
        expect(alert.escalationPath).toBeDefined();
        done();
      });

      // First create a heartbeat so we have sync-aware data
      mockHeartbeatService.recordHeartbeat(agentId);
      
      setTimeout(() => {
        mockHeartbeatService.emit('stagnation_detected', stagnationAlert);
      }, 100);
    });

    it('should handle agent status changes', (done) => {
      const agentId = 'test-agent-4';
      
      service.on('sync_aware_agent_status_changed', (data) => {
        expect(data.agentId).toBe(agentId);
        expect(data.newStatus).toBe('failed');
        expect(data.syncState).toBeDefined();
        done();
      });

      // Create heartbeat first
      mockHeartbeatService.recordHeartbeat(agentId);
      
      setTimeout(() => {
        mockHeartbeatService.emit('agent_status_changed', {
          agentId,
          oldStatus: 'active',
          newStatus: 'failed'
        });
      }, 100);
    });
  });

  describe('Sync Integration', () => {
    it('should handle sync operation completed events', (done) => {
      const agentId = 'test-agent-5';
      
      service.on('sync_operation_health_updated', (data) => {
        expect(data.agentId).toBe(agentId);
        expect(data.success).toBe(true);
        expect(data.duration).toBeDefined();
        done();
      });

      // Create heartbeat first
      mockHeartbeatService.recordHeartbeat(agentId);
      
      setTimeout(() => {
        mockSyncOrchestrator.emit('sync_operation_completed', {
          agentId,
          operation: { type: 'file_sync' },
          duration: 150,
          tenantId: 'test-tenant'
        });
      }, 100);
    });

    it('should handle sync operation failed events', (done) => {
      const agentId = 'test-agent-6';
      
      service.on('sync_operation_health_updated', (data) => {
        expect(data.agentId).toBe(agentId);
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
        done();
      });

      // Create heartbeat first
      mockHeartbeatService.recordHeartbeat(agentId);
      
      setTimeout(() => {
        mockSyncOrchestrator.emit('sync_operation_failed', {
          agentId,
          operation: { type: 'file_sync' },
          error: new Error('Sync failed'),
          tenantId: 'test-tenant'
        });
      }, 100);
    });

    it('should handle conflict detected events', (done) => {
      const agentId = 'test-agent-7';
      
      service.on('sync_conflict_health_updated', (data) => {
        expect(data.agentId).toBe(agentId);
        expect(data.conflict).toBeDefined();
        done();
      });

      // Create heartbeat first
      mockHeartbeatService.recordHeartbeat(agentId);
      
      setTimeout(() => {
        mockConflictManager.emit('conflict_detected', {
          agentId,
          conflict: { type: 'file_conflict', resourceId: 'test-file' },
          tenantId: 'test-tenant'
        });
      }, 100);
    });

    it('should handle conflict resolved events', (done) => {
      const agentId = 'test-agent-8';
      
      service.on('sync_conflict_health_updated', (data) => {
        expect(data.agentId).toBe(agentId);
        expect(data.resolved).toBe(true);
        done();
      });

      // Create heartbeat first
      mockHeartbeatService.recordHeartbeat(agentId);
      
      setTimeout(() => {
        mockConflictManager.emit('conflict_resolved', {
          agentId,
          conflict: { type: 'file_conflict', resourceId: 'test-file' },
          tenantId: 'test-tenant'
        });
      }, 100);
    });

    it('should handle clock drift detected events', (done) => {
      service.on('clock_sync_health_updated', (data) => {
        expect(data.instances).toBeDefined();
        expect(data.maxDrift).toBeGreaterThan(0);
        done();
      });

      mockMasterClockService.emit('clock_drift_detected', {
        instances: [{ instanceId: 'test-instance', drift: 1500 }],
        maxDrift: 1500
      });
    });
  });

  describe('Health Monitoring', () => {
    it('should perform sync health checks', async () => {
      const agentId = 'test-agent-9';
      
      // Create heartbeat with high error rate
      mockHeartbeatService.recordHeartbeat(agentId);
      
      const heartbeat = service.getSyncAwareHeartbeat(agentId);
      if (heartbeat) {
        heartbeat.syncMetrics.syncErrorRate = 0.15; // 15% error rate
      }
      
      const escalationPromise = new Promise((resolve) => {
        service.on('sync_health_escalation_created', (escalation: SyncHealthEscalation) => {
          expect(escalation.type).toBe('sync_failure');
          expect(escalation.severity).toBe('warning');
          resolve(escalation);
        });
      });
      
      // Trigger health check
      await (service as any).performSyncHealthCheck();
      
      await escalationPromise;
    });

    it('should generate unified health report', () => {
      const agentId = 'test-agent-10';
      mockHeartbeatService.recordHeartbeat(agentId);
      
      const report = service.getUnifiedHealthReport();
      
      expect(report).toBeDefined();
      expect(report.systemHealth).toBeDefined();
      expect(report.agentCount).toBeGreaterThanOrEqual(0);
      expect(report.syncMetrics).toBeDefined();
      expect(report.activeEscalations).toBeGreaterThanOrEqual(0);
      expect(report.lastHealthCheck).toBeInstanceOf(Date);
    });

    it('should collect sync metrics', async () => {
      const agentId = 'test-agent-11';
      mockHeartbeatService.recordHeartbeat(agentId);
      
      const metricsPromise = new Promise((resolve) => {
        service.on('sync_metrics_collected', (data) => {
          expect(data.timestamp).toBeInstanceOf(Date);
          expect(data.agentCount).toBeGreaterThanOrEqual(0);
          resolve(data);
        });
      });
      
      // Trigger metrics collection
      await (service as any).collectSyncMetrics();
      
      await metricsPromise;
    });
  });

  describe('Escalation Procedures', () => {
    it('should create sync health escalations', async () => {
      const escalation: SyncHealthEscalation = {
        type: 'sync_failure',
        severity: 'critical',
        agentId: 'test-agent-12',
        tenantId: 'test-tenant',
        syncMetrics: {
          syncOperationsTotal: 100,
          syncOperationsFailed: 25,
          syncOperationsSuccess: 75,
          syncErrorRate: 0.25,
          syncLatencyMs: 2000,
          conflictsDetected: 5,
          conflictsResolved: 3,
          fileWatcherHealth: 'healthy',
          clockSyncHealth: 'synchronized',
          lastSyncTimestamp: new Date(),
          avgSyncDuration: 2000
        },
        recommendedActions: ['Check network', 'Restart service'],
        autoRecoveryAttempted: false,
        escalatedAt: new Date()
      };
      
      const escalationPromise = new Promise((resolve) => {
        service.on('sync_health_escalation_created', (createdEscalation) => {
          expect(createdEscalation.type).toBe(escalation.type);
          expect(createdEscalation.severity).toBe(escalation.severity);
          resolve(createdEscalation);
        });
      });
      
      await (service as any).createSyncHealthEscalation(escalation);
      
      await escalationPromise;
    });

    it('should trigger sync recovery procedures', (done) => {
      const agentId = 'test-agent-13';
      
      service.on('sync_recovery_required', (data) => {
        expect(data.agentId).toBe(agentId);
        expect(data.recoveryActions).toBeDefined();
        done();
      });

      const alert: SyncAwareStagnationAlert = {
        agentId,
        taskId: 'test-task',
        stagnationType: 'no_progress',
        detectedAt: new Date(),
        duration: 60000,
        severity: 'warning',
        syncContext: {
          syncState: 'error',
          pendingOperations: 5,
          conflictCount: 0,
          errorRate: 0.1
        },
        escalationPath: 'sync_recovery'
      };

      (service as any).executeSyncRecovery(alert);
    });

    it('should trigger conflict resolution procedures', (done) => {
      const agentId = 'test-agent-14';
      
      service.on('conflict_resolution_required', (data) => {
        expect(data.agentId).toBe(agentId);
        expect(data.resolutionStrategy).toBeDefined();
        done();
      });

      const alert: SyncAwareStagnationAlert = {
        agentId,
        taskId: 'test-task',
        stagnationType: 'no_progress',
        detectedAt: new Date(),
        duration: 60000,
        severity: 'warning',
        syncContext: {
          syncState: 'conflict',
          pendingOperations: 2,
          conflictCount: 3,
          errorRate: 0.05
        },
        escalationPath: 'conflict_resolution'
      };

      (service as any).executeConflictResolution(alert);
    });

    it('should trigger manual intervention procedures', (done) => {
      const agentId = 'test-agent-15';
      
      service.on('manual_intervention_required', (data) => {
        expect(data.agentId).toBe(agentId);
        expect(data.urgency).toBe('high');
        expect(data.recommendedActions).toBeDefined();
        done();
      });

      const alert: SyncAwareStagnationAlert = {
        agentId,
        taskId: 'test-task',
        stagnationType: 'circular_communication',
        detectedAt: new Date(),
        duration: 300000,
        severity: 'critical',
        syncContext: {
          syncState: 'error',
          pendingOperations: 10,
          conflictCount: 5,
          errorRate: 0.5
        },
        escalationPath: 'manual_intervention'
      };

      (service as any).executeManualIntervention(alert);
    });
  });

  describe('API Methods', () => {
    it('should get sync-aware heartbeat for agent', () => {
      const agentId = 'test-agent-16';
      mockHeartbeatService.recordHeartbeat(agentId);
      
      const heartbeat = service.getSyncAwareHeartbeat(agentId);
      expect(heartbeat).toBeDefined();
      expect(heartbeat?.agentId).toBe(agentId);
    });

    it('should get sync health metrics for agent', () => {
      const agentId = 'test-agent-17';
      mockHeartbeatService.recordHeartbeat(agentId);
      
      const metrics = service.getSyncHealthMetrics(agentId);
      expect(metrics).toBeDefined();
    });

    it('should get escalation history', async () => {
      const agentId = 'test-agent-18';
      
      const escalation: SyncHealthEscalation = {
        type: 'sync_failure',
        severity: 'warning',
        agentId,
        syncMetrics: {
          syncOperationsTotal: 10,
          syncOperationsFailed: 2,
          syncOperationsSuccess: 8,
          syncErrorRate: 0.2,
          syncLatencyMs: 1000,
          conflictsDetected: 0,
          conflictsResolved: 0,
          fileWatcherHealth: 'healthy',
          clockSyncHealth: 'synchronized',
          lastSyncTimestamp: new Date(),
          avgSyncDuration: 1000
        },
        recommendedActions: ['Check logs'],
        autoRecoveryAttempted: false,
        escalatedAt: new Date()
      };
      
      await (service as any).createSyncHealthEscalation(escalation);
      
      const history = service.getEscalationHistory(agentId);
      expect(history).toBeDefined();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].agentId).toBe(agentId);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in heartbeat processing gracefully', async () => {
      const agentId = 'test-agent-error';
      
      // Mock an error in sync metrics collection
      jest.spyOn(service as any, 'collectAgentSyncMetrics').mockRejectedValue(new Error('Metrics error'));
      
      // Should not throw
      await expect((service as any).handleHeartbeatReceived(agentId)).resolves.not.toThrow();
    });

    it('should handle errors in health checks gracefully', async () => {
      // Mock an error in health check
      jest.spyOn(service as any, 'checkSyncHealth').mockRejectedValue(new Error('Health check error'));
      
      // Should not throw
      await expect((service as any).performSyncHealthCheck()).resolves.not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      await service.onModuleDestroy();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});