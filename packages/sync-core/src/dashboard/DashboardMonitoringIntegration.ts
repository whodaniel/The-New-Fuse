import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { SyncDashboardService, SystemAlert } from './SyncDashboardService';

/**
 * Interface for existing monitoring service integration
 */
export interface IExistingMonitoringService {
  recordMetric(name: string, value: number, tags?: Record<string, string>): Promise<void>;
  getSystemHealth(): Promise<any>;
  createAlert(alert: any): Promise<void>;
  on(event: string, callback: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): boolean;
}

/**
 * Interface for existing metrics service
 */
export interface IExistingMetricsService {
  collectMetric(...args: any[]): Promise<any>;
  getMetrics(): Promise<any>;
  recordAgentConnection(agentId: string): void;
  recordAgentDisconnection(agentId: string): void;
  recordMessageDelivery(message: any): Promise<void>;
  recordStatusChange(agentId: string, status: string): void;
}

/**
 * Interface for existing heartbeat monitoring service
 */
export interface IExistingHeartbeatService {
  on(event: string, callback: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): boolean;
  getAgentStatus(agentId: string): Promise<string>;
  getConnectedAgents(): Promise<string[]>;
}

/**
 * Monitoring event types
 */
export type MonitoringEventType =
  | 'agent_connected'
  | 'agent_disconnected'
  | 'agent_heartbeat_timeout'
  | 'system_health_change'
  | 'performance_threshold_exceeded'
  | 'error_rate_high'
  | 'sync_operation_failed'
  | 'conflict_detected'
  | 'file_change_error';

/**
 * Monitoring event payload
 */
export interface MonitoringEvent {
  type: MonitoringEventType;
  source: string;
  data: any;
  timestamp: Date;
  tenantId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Alert threshold configuration
 */
export interface AlertThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  duration?: number; // seconds
  severity: SystemAlert['level'];
  message: string;
}

/**
 * Dashboard monitoring integration service
 * Connects existing monitoring systems with the sync dashboard
 */
@Injectable()
export class DashboardMonitoringIntegration extends EventEmitter implements OnModuleInit {
  private readonly logger = new Logger(DashboardMonitoringIntegration.name);

  private readonly alertThresholds: AlertThreshold[] = [
    {
      metric: 'sync_error_rate',
      operator: 'gt',
      value: 0.1, // 10% error rate
      duration: 300, // 5 minutes
      severity: 'warning',
      message: 'High sync error rate detected',
    },
    {
      metric: 'sync_error_rate',
      operator: 'gt',
      value: 0.25, // 25% error rate
      duration: 60, // 1 minute
      severity: 'critical',
      message: 'Critical sync error rate detected',
    },
    {
      metric: 'agent_disconnect_rate',
      operator: 'gt',
      value: 0.2, // 20% disconnect rate
      duration: 180, // 3 minutes
      severity: 'warning',
      message: 'High agent disconnect rate detected',
    },
    {
      metric: 'sync_latency',
      operator: 'gt',
      value: 5000, // 5 seconds
      duration: 120, // 2 minutes
      severity: 'warning',
      message: 'High sync latency detected',
    },
    {
      metric: 'conflict_rate',
      operator: 'gt',
      value: 0.05, // 5% conflict rate
      duration: 600, // 10 minutes
      severity: 'info',
      message: 'Elevated conflict rate detected',
    },
  ];

  private metricsBuffer = new Map<string, Array<{ value: number; timestamp: Date }>>();
  private alertStates = new Map<string, { triggered: boolean; firstSeen: Date }>();

  constructor(
    private readonly dashboardService: SyncDashboardService,
    private readonly monitoringService?: IExistingMonitoringService,
    private readonly metricsService?: IExistingMetricsService,
    private readonly heartbeatService?: IExistingHeartbeatService
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.setupMonitoringIntegration();
    this.startThresholdMonitoring();
    this.logger.log('DashboardMonitoringIntegration initialized');
  }

  /**
   * Setup integration with existing monitoring services
   */
  private async setupMonitoringIntegration(): Promise<void> {
    // Integrate with existing monitoring service
    if (this.monitoringService) {
      this.monitoringService.on('system_health_change', (data) => {
        this.handleMonitoringEvent({
          type: 'system_health_change',
          source: 'monitoring_service',
          data,
          timestamp: new Date(),
          severity: this.determineSeverity(data),
        });
      });
    }

    // Integrate with existing heartbeat service
    if (this.heartbeatService) {
      this.heartbeatService.on('agent_connected', (agentId) => {
        this.handleMonitoringEvent({
          type: 'agent_connected',
          source: 'heartbeat_service',
          data: { agentId },
          timestamp: new Date(),
          severity: 'low',
        });
      });

      this.heartbeatService.on('agent_disconnected', (agentId) => {
        this.handleMonitoringEvent({
          type: 'agent_disconnected',
          source: 'heartbeat_service',
          data: { agentId },
          timestamp: new Date(),
          severity: 'medium',
        });
      });

      this.heartbeatService.on('agent_heartbeat_timeout', (agentId) => {
        this.handleMonitoringEvent({
          type: 'agent_heartbeat_timeout',
          source: 'heartbeat_service',
          data: { agentId },
          timestamp: new Date(),
          severity: 'high',
        });
      });
    }

    // Listen for sync dashboard events
    this.dashboardService.on('dashboard_update', (update) => {
      this.processDashboardUpdate(update);
    });
  }

  /**
   * Handle monitoring events from existing services
   */
  private async handleMonitoringEvent(event: MonitoringEvent): Promise<void> {
    try {
      // Record the event
      this.recordMetric(`monitoring_event_${event.type}`, 1, {
        source: event.source,
        severity: event.severity,
        tenant: event.tenantId || 'global',
      });

      // Create alert if severity is high enough
      if (event.severity === 'high' || event.severity === 'critical') {
        await this.createAlert({
          level: event.severity === 'critical' ? 'critical' : 'warning',
          message: this.formatEventMessage(event),
          component: event.source,
          tenantId: event.tenantId,
          metadata: {
            eventType: event.type,
            originalData: event.data,
          },
        });
      }

      // Emit for other services
      this.emit('monitoring_event', event);
    } catch (error) {
      this.logger.error('Error handling monitoring event:', error);
    }
  }

  /**
   * Process dashboard updates for monitoring
   */
  private processDashboardUpdate(update: any): void {
    try {
      // Extract metrics from dashboard updates
      if (update.type === 'sync_metrics' && update.data) {
        this.processMetricsUpdate(update.data, update.tenantId);
      }

      if (update.type === 'sync_operation' && update.data) {
        this.processSyncOperation(update.data, update.tenantId);
      }

      if (update.type === 'conflict_detected' && update.data) {
        this.processConflictDetection(update.data, update.tenantId);
      }
    } catch (error) {
      this.logger.error('Error processing dashboard update for monitoring:', error);
    }
  }

  /**
   * Process metrics update for threshold monitoring
   */
  private processMetricsUpdate(metrics: any, tenantId?: string): void {
    const now = new Date();
    const tenantKey = tenantId || 'global';

    // Calculate error rate
    if (metrics.operations && metrics.errors) {
      const totalOps = Object.values(metrics.operations).reduce(
        (sum: number, val: any) => sum + (val || 0),
        0
      );
      const totalErrors = Object.values(metrics.errors).reduce(
        (sum: number, val: any) => sum + (val || 0),
        0
      );
      const errorRate = totalOps > 0 ? totalErrors / totalOps : 0;

      this.addMetricValue(`sync_error_rate:${tenantKey}`, errorRate, now);
    }

    // Record sync latency
    if (metrics.performance?.avgSyncTime) {
      this.addMetricValue(`sync_latency:${tenantKey}`, metrics.performance.avgSyncTime, now);
    }

    // Record conflict rate
    if (metrics.operations?.conflicts && metrics.operations?.sync) {
      const conflictRate =
        metrics.operations.sync > 0 ? metrics.operations.conflicts / metrics.operations.sync : 0;
      this.addMetricValue(`conflict_rate:${tenantKey}`, conflictRate, now);
    }
  }

  /**
   * Process sync operation for monitoring
   */
  private processSyncOperation(operation: any, tenantId?: string): void {
    if (operation.status === 'failed') {
      this.handleMonitoringEvent({
        type: 'sync_operation_failed',
        source: 'sync_orchestrator',
        data: operation,
        timestamp: new Date(),
        tenantId,
        severity: 'medium',
      });
    }
  }

  /**
   * Process conflict detection for monitoring
   */
  private processConflictDetection(conflict: any, tenantId?: string): void {
    this.handleMonitoringEvent({
      type: 'conflict_detected',
      source: 'conflict_manager',
      data: conflict,
      timestamp: new Date(),
      tenantId,
      severity: 'low',
    });
  }

  /**
   * Add metric value to buffer for threshold monitoring
   */
  private addMetricValue(metricKey: string, value: number, timestamp: Date): void {
    if (!this.metricsBuffer.has(metricKey)) {
      this.metricsBuffer.set(metricKey, []);
    }

    const buffer = this.metricsBuffer.get(metricKey)!;
    buffer.push({ value, timestamp });

    // Keep only last hour of data
    const oneHourAgo = new Date(timestamp.getTime() - 60 * 60 * 1000);
    const filtered = buffer.filter((entry) => entry.timestamp > oneHourAgo);
    this.metricsBuffer.set(metricKey, filtered);
  }

  /**
   * Start threshold monitoring
   */
  private startThresholdMonitoring(): void {
    setInterval(() => {
      this.checkThresholds();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check all alert thresholds
   */
  private checkThresholds(): void {
    for (const threshold of this.alertThresholds) {
      this.checkThreshold(threshold);
    }
  }

  /**
   * Check individual threshold
   */
  private checkThreshold(threshold: AlertThreshold): void {
    try {
      const now = new Date();
      const thresholdKey = `${threshold.metric}:${threshold.operator}:${threshold.value}`;

      // Get metrics for all tenants
      const tenantKeys = Array.from(this.metricsBuffer.keys()).filter((key) =>
        key.startsWith(threshold.metric + ':')
      );

      for (const metricKey of tenantKeys) {
        const buffer = this.metricsBuffer.get(metricKey);
        if (!buffer || buffer.length === 0) continue;

        const tenantId = metricKey.split(':')[1];
        const alertKey = `${thresholdKey}:${tenantId}`;

        // Filter to duration window
        const windowStart = new Date(now.getTime() - (threshold.duration || 300) * 1000);
        const windowData = buffer.filter((entry) => entry.timestamp > windowStart);

        if (windowData.length === 0) continue;

        // Calculate average value in window
        const avgValue =
          windowData.reduce((sum, entry) => sum + entry.value, 0) / windowData.length;

        // Check threshold
        const triggered = this.evaluateThreshold(avgValue, threshold.operator, threshold.value);
        const alertState = this.alertStates.get(alertKey);

        if (triggered && (!alertState || !alertState.triggered)) {
          // Threshold exceeded, create alert
          this.createAlert({
            level: threshold.severity,
            message: `${threshold.message} (${avgValue.toFixed(3)} ${threshold.operator} ${threshold.value})`,
            component: 'threshold_monitor',
            tenantId: tenantId !== 'global' ? tenantId : undefined,
            metadata: {
              metric: threshold.metric,
              value: avgValue,
              threshold: threshold.value,
              operator: threshold.operator,
            },
          });

          this.alertStates.set(alertKey, { triggered: true, firstSeen: now });
        } else if (!triggered && alertState?.triggered) {
          // Threshold no longer exceeded
          this.alertStates.set(alertKey, { triggered: false, firstSeen: now });
        }
      }
    } catch (error) {
      this.logger.error('Error checking threshold:', error);
    }
  }

  /**
   * Evaluate threshold condition
   */
  private evaluateThreshold(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'gte':
        return value >= threshold;
      case 'lt':
        return value < threshold;
      case 'lte':
        return value <= threshold;
      case 'eq':
        return value === threshold;
      default:
        return false;
    }
  }

  /**
   * Create alert via dashboard service
   */
  private async createAlert(alert: Omit<SystemAlert, 'id' | 'timestamp'>): Promise<void> {
    await this.dashboardService.createAlert(alert);
  }

  /**
   * Record metric via existing services
   */
  private async recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>
  ): Promise<void> {
    try {
      if (this.monitoringService) {
        await this.monitoringService.recordMetric(name, value, tags);
      }

      if (this.metricsService) {
        await this.metricsService.collectMetric(name, value, tags);
      }
    } catch (error) {
      this.logger.error('Error recording metric:', error);
    }
  }

  /**
   * Determine severity from monitoring data
   */
  private determineSeverity(data: any): MonitoringEvent['severity'] {
    if (data.status === 'critical' || data.level === 'critical') return 'critical';
    if (data.status === 'error' || data.level === 'error') return 'high';
    if (data.status === 'warning' || data.level === 'warning') return 'medium';
    return 'low';
  }

  /**
   * Format monitoring event message
   */
  private formatEventMessage(event: MonitoringEvent): string {
    switch (event.type) {
      case 'agent_connected':
        return `Agent ${event.data.agentId} connected`;
      case 'agent_disconnected':
        return `Agent ${event.data.agentId} disconnected`;
      case 'agent_heartbeat_timeout':
        return `Agent ${event.data.agentId} heartbeat timeout`;
      case 'system_health_change':
        return `System health changed to ${event.data.status}`;
      case 'sync_operation_failed':
        return `Sync operation failed: ${event.data.error || 'Unknown error'}`;
      case 'conflict_detected':
        return `Sync conflict detected for ${event.data.resourceType}:${event.data.resourceId}`;
      default:
        return `Monitoring event: ${event.type}`;
    }
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): Record<string, any> {
    const summary: Record<string, any> = {};

    for (const [key, buffer] of this.metricsBuffer) {
      if (buffer.length > 0) {
        const values = buffer.map((entry) => entry.value);
        summary[key] = {
          count: values.length,
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          latest: values[values.length - 1],
        };
      }
    }

    return summary;
  }

  /**
   * Get active alerts count
   */
  getActiveAlertsCount(): number {
    return Array.from(this.alertStates.values()).filter((state) => state.triggered).length;
  }
}
