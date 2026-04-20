/**
 * Example: Integrating Sync Dashboard with Existing AdminDashboard
 * 
 * This example demonstrates how to integrate the sync-aware dashboard
 * with existing AdminDashboard and AgentWebSocketService infrastructure.
 */

import { Module, Injectable } from '@nestjs/common';
import { 
  SyncDashboardService, 
  DashboardWebSocketIntegration,
  DashboardMonitoringIntegration,
  IAgentWebSocketService,
  IMonitoringService 
} from './index.js';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { SyncRedisConfig } from '../config/SyncRedisConfig.js';

// Example: Existing AgentWebSocketService adapter
@Injectable()
class ExistingAgentWebSocketServiceAdapter implements IAgentWebSocketService {
  constructor(private readonly existingWsService: any) {}

  async broadcastToTenant(tenantId: string, message: any): Promise<number> {
    // Integrate with existing WebSocket service
    const clients = await this.existingWsService.getClientsByTenant(tenantId);
    let sentCount = 0;
    
    for (const client of clients) {
      try {
        client.emit('dashboard_update', message);
        sentCount++;
      } catch (error) {
        console.error('Failed to send to client:', error);
      }
    }
    
    return sentCount;
  }

  async broadcastToAll(message: any): Promise<number> {
    // Broadcast to all connected dashboard clients
    return this.existingWsService.broadcast('dashboard_update', message);
  }

  async sendToUser(userId: string, message: any): Promise<boolean> {
    // Send to specific user's sessions
    return this.existingWsService.sendToUser(userId, 'dashboard_update', message);
  }
}

// Example: Existing monitoring service adapter
@Injectable()
class ExistingMonitoringServiceAdapter implements IMonitoringService {
  constructor(private readonly existingMonitoring: any) {}

  async recordMetric(name: string, value: number, tags?: Record<string, string>): Promise<void> {
    // Integrate with existing metrics collection
    await this.existingMonitoring.recordMetric(name, value, tags);
  }

  async getSystemHealth(): Promise<any> {
    // Get health from existing monitoring system
    return this.existingMonitoring.getSystemHealth();
  }

  async createAlert(alert: any): Promise<void> {
    // Create alert in existing monitoring system
    await this.existingMonitoring.createAlert(alert);
  }
}

// Example: Module configuration
@Module({
  providers: [
    SyncDashboardService,
    DashboardWebSocketIntegration,
    DashboardMonitoringIntegration,
    {
      provide: 'IAgentWebSocketService',
      useClass: ExistingAgentWebSocketServiceAdapter
    },
    {
      provide: 'IMonitoringService',
      useClass: ExistingMonitoringServiceAdapter
    },
    // Existing services
    UnifiedRedisService,
    SyncRedisConfig
  ],
  exports: [
    SyncDashboardService,
    DashboardWebSocketIntegration,
    DashboardMonitoringIntegration
  ]
})
export class SyncDashboardModule {}

// Example: React component integration
export const ExampleReactIntegration = `
import React from 'react';
import { SyncAwareAdminDashboard } from '@the-new-fuse/sync-core/dashboard';

// Replace existing AdminDashboard with sync-aware version
export const EnhancedAdminDashboard: React.FC = () => {
  return (
    <SyncAwareAdminDashboard
      tenantId="current-tenant-id"
      userId="current-user-id"
      showSyncMetrics={true}
      showHealthStatus={true}
      showAlerts={true}
      showOperations={true}
      autoRefresh={true}
      refreshInterval={30000}
    />
  );
};

// Or use the hook for custom integration
import { useSyncDashboard } from '@the-new-fuse/sync-core/dashboard';

export const CustomDashboard: React.FC = () => {
  const {
    data,
    isConnected,
    isLoading,
    error,
    refresh,
    clearAlerts,
    acknowledgeAlert
  } = useSyncDashboard({
    tenantId: 'current-tenant-id',
    userId: 'current-user-id',
    autoConnect: true
  });

  if (isLoading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Custom Dashboard</h1>
      <div>Connection: {isConnected ? 'Connected' : 'Disconnected'}</div>
      
      {data.metrics && (
        <div>
          <h2>Sync Metrics</h2>
          <p>Operations: {data.metrics.operations.sync}</p>
          <p>Conflicts: {data.metrics.operations.conflicts}</p>
          <p>Success Rate: {data.metrics.performance.successRate}%</p>
        </div>
      )}
      
      {data.alerts.length > 0 && (
        <div>
          <h2>Alerts ({data.alerts.length})</h2>
          {data.alerts.map(alert => (
            <div key={alert.id}>
              <strong>{alert.level}:</strong> {alert.message}
              <button onClick={() => acknowledgeAlert(alert.id)}>
                Acknowledge
              </button>
            </div>
          ))}
        </div>
      )}
      
      <button onClick={refresh}>Refresh</button>
      <button onClick={clearAlerts}>Clear All Alerts</button>
    </div>
  );
};
`;

// Example: Backend service integration
@Injectable()
export class ExampleBackendIntegration {
  constructor(
    private readonly dashboardService: SyncDashboardService,
    private readonly monitoringIntegration: DashboardMonitoringIntegration
  ) {}

  async handleAgentStatusChange(agentId: string, status: string, tenantId?: string): Promise<void> {
    // When agent status changes, update dashboard
    const update = {
      type: 'agent_status' as const,
      tenantId,
      data: { agentId, status, timestamp: new Date() },
      timestamp: new Date()
    };

    // This will automatically broadcast to relevant dashboard clients
    await this.dashboardService['processDashboardUpdate'](update);
  }

  async handleTaskProgress(taskId: string, progress: number, userId?: string, tenantId?: string): Promise<void> {
    // When task progress updates, notify user dashboards
    const update = {
      type: 'task_progress' as const,
      userId,
      tenantId,
      data: { taskId, progress, timestamp: new Date() },
      timestamp: new Date()
    };

    await this.dashboardService['processDashboardUpdate'](update);
  }

  async handleFileChange(filePath: string, changeType: string, tenantId?: string): Promise<void> {
    // When files change, update dashboard
    const update = {
      type: 'file_change' as const,
      tenantId,
      data: { filePath, changeType, timestamp: new Date() },
      timestamp: new Date()
    };

    await this.dashboardService['processDashboardUpdate'](update);
  }

  async createSystemAlert(level: 'info' | 'warning' | 'error' | 'critical', message: string, component: string, tenantId?: string): Promise<void> {
    // Create system alert that will appear in dashboards
    await this.dashboardService.createAlert({
      level,
      message,
      component,
      tenantId,
      metadata: { source: 'backend_service' }
    });
  }
}

// Example: WebSocket client integration (frontend)
export const ExampleWebSocketClient = `
// Frontend WebSocket client for dashboard updates
import { io } from 'socket.io-client';

class DashboardWebSocketClient {
  private socket: Socket | null = null;
  private callbacks: Map<string, Function[]> = new Map();

  connect(tenantId?: string, userId?: string) {
    this.socket = io('/dashboard', {
      query: {
        tenantId: tenantId || 'global',
        userId: userId || 'anonymous',
        capabilities: JSON.stringify(['dashboard'])
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to dashboard service');
      this.socket?.emit('get_dashboard_data', { tenantId });
    });

    this.socket.on('sync_dashboard_update', (update) => {
      this.handleUpdate(update);
    });

    this.socket.on('dashboard_data', (data) => {
      this.handleDashboardData(data);
    });

    this.socket.on('error', (error) => {
      console.error('Dashboard WebSocket error:', error);
    });
  }

  private handleUpdate(update: any) {
    const callbacks = this.callbacks.get(update.type) || [];
    callbacks.forEach(callback => callback(update));
  }

  private handleDashboardData(data: any) {
    const callbacks = this.callbacks.get('dashboard_data') || [];
    callbacks.forEach(callback => callback(data));
  }

  onUpdate(type: string, callback: Function) {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, []);
    }
    this.callbacks.get(type)!.push(callback);
  }

  refresh(tenantId?: string) {
    this.socket?.emit('refresh_dashboard', { tenantId });
  }

  acknowledgeAlert(alertId: string) {
    this.socket?.emit('acknowledge_alert', { alertId });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

// Usage
const dashboardClient = new DashboardWebSocketClient();
dashboardClient.connect('my-tenant', 'my-user');

dashboardClient.onUpdate('sync_metrics', (update) => {
  console.log('Metrics updated:', update.data);
});

dashboardClient.onUpdate('system_alert', (update) => {
  console.log('New alert:', update.data);
});
`;

// Example: Testing integration
export const ExampleTestSetup = `
// Example test setup for dashboard integration
import { Test } from '@nestjs/testing';
import { SyncDashboardService } from './SyncDashboardService.js';

describe('Dashboard Integration Test', () => {
  let dashboardService: SyncDashboardService;
  let mockWebSocketService: any;

  beforeEach(async () => {
    mockWebSocketService = {
      broadcastToTenant: jest.fn().mockResolvedValue(1),
      broadcastToAll: jest.fn().mockResolvedValue(5),
      sendToUser: jest.fn().mockResolvedValue(true)
    };

    const module = await Test.createTestingModule({
      providers: [
        SyncDashboardService,
        {
          provide: 'IAgentWebSocketService',
          useValue: mockWebSocketService
        },
        // ... other providers
      ]
    }).compile();

    dashboardService = module.get<SyncDashboardService>(SyncDashboardService);
  });

  it('should integrate with existing WebSocket service', async () => {
    await dashboardService.createAlert({
      level: 'warning',
      message: 'Test alert',
      component: 'test'
    });

    expect(mockWebSocketService.broadcastToAll).toHaveBeenCalled();
  });
});
`;

// Example: Configuration
export const ExampleConfiguration = {
  // Environment variables for dashboard configuration
  SYNC_DASHBOARD_UPDATE_INTERVAL: '1000', // 1 second
  SYNC_DASHBOARD_METRICS_RETENTION: '86400000', // 24 hours
  SYNC_DASHBOARD_ALERTS_RETENTION: '604800000', // 7 days
  SYNC_DASHBOARD_ENABLE_MULTI_SESSION: 'true',
  SYNC_DASHBOARD_ENABLE_CROSS_TENANT: 'false',

  // Redis configuration
  REDIS_SYNC_DASHBOARD_PREFIX: 'sync:dashboard',
  REDIS_SYNC_METRICS_PREFIX: 'sync:metrics',
  REDIS_SYNC_HEALTH_PREFIX: 'sync:health',

  // WebSocket configuration
  WEBSOCKET_DASHBOARD_NAMESPACE: '/dashboard',
  WEBSOCKET_AGENTS_NAMESPACE: '/agents',

  // Monitoring thresholds
  ALERT_THRESHOLD_SYNC_ERROR_RATE: '0.1', // 10%
  ALERT_THRESHOLD_SYNC_LATENCY: '5000', // 5 seconds
  ALERT_THRESHOLD_AGENT_DISCONNECT_RATE: '0.2' // 20%
};

console.log('Sync Dashboard integration examples loaded');
console.log('Use these examples to integrate with your existing AdminDashboard and monitoring systems');