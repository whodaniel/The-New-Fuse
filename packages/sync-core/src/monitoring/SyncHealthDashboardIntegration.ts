import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { SyncAwareHeartbeatMonitoringService, SyncHealthMetrics, SyncHealthEscalation } from './SyncAwareHeartbeatMonitoringService.js';
import { DashboardMonitoringIntegration, IExistingMonitoringService, IExistingMetricsService } from '../dashboard/DashboardMonitoringIntegration.js';
import { SyncDashboardService } from '../dashboard/SyncDashboardService.js';

/**
 * Sync health dashboard data structure
 */
export interface SyncHealthDashboardData {
  timestamp: Date;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  agentMetrics: {
    total: number;
    healthy: number;
    degraded: number;
    critical: number;
    offline: number;
  };
  syncMetrics: {
    operationsPerMinute: number;
    errorRate: number;
    avgLatency: number;
    conflictRate: number;
    throughput: number;
  };
  escalations: {
    active: number;
    resolved: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  tenantMetrics: Record<string, {
    agentCount: number;
    errorRate: number;
    conflictRate: number;
    lastSync: Date;
  }>;
}

/**
 * Sync health alert configuration
 */
export interface SyncHealthAlert {
  id: string;
  type: 'sync_error_rate' | 'sync_latency' | 'conflict_rate' | 'agent_health' | 'escalation_rate';
  threshold: number;
  duration: number; // seconds
  severity: 'info' | 'warning' | 'critical';
  message: string;
  enabled: boolean;
  tenantId?: string;
}

/**
 * Sync health dashboard widget configuration
 */
export interface SyncHealthWidget {
  id: string;
  type: 'metric' | 'chart' | 'alert' | 'status';
  title: string;
  config: {
    metric?: string;
    chartType?: 'line' | 'bar' | 'pie' | 'gauge';
    timeRange?: number; // minutes
    refreshInterval?: number; // seconds
    thresholds?: Array<{ value: number; color: string; label: string }>;
  };
  position: { x: number; y: number; width: number; height: number };
}

/**
 * Sync health dashboard integration service
 * Integrates sync health monitoring with existing dashboard systems
 */
@Injectable()
export class SyncHealthDashboardIntegration extends EventEmitter implements OnModuleInit {
  private readonly logger = new Logger(SyncHealthDashboardIntegration.name);
  
  private syncHealthService: SyncAwareHeartbeatMonitoringService;
  private dashboardService: SyncDashboardService;
  private monitoringIntegration: DashboardMonitoringIntegration;
  private monitoringService?: IExistingMonitoringService;
  private metricsService?: IExistingMetricsService;
  
  private dashboardData: SyncHealthDashboardData;
  private alertConfigs = new Map<string, SyncHealthAlert>();
  private widgetConfigs = new Map<string, SyncHealthWidget>();
  private metricsHistory = new Map<string, Array<{ timestamp: Date; value: number }>>();
  
  private updateInterval?: NodeJS.Timeout;
  private alertCheckInterval?: NodeJS.Timeout;
  
  constructor(
    syncHealthService: SyncAwareHeartbeatMonitoringService,
    dashboardService: SyncDashboardService,
    monitoringIntegration: DashboardMonitoringIntegration,
    monitoringService?: IExistingMonitoringService,
    metricsService?: IExistingMetricsService
  ) {
    super();
    this.syncHealthService = syncHealthService;
    this.dashboardService = dashboardService;
    this.monitoringIntegration = monitoringIntegration;
    this.monitoringService = monitoringService;
    this.metricsService = metricsService;
    
    this.dashboardData = this.createDefaultDashboardData();
  }

  async onModuleInit(): Promise<void> {
    await this.setupSyncHealthIntegration();
    await this.setupDashboardIntegration();
    this.setupDefaultAlerts();
    this.setupDefaultWidgets();
    this.startDashboardUpdates();
    this.logger.log('SyncHealthDashboardIntegration initialized');
  }

  /**
   * Setup integration with sync health monitoring service
   */
  private async setupSyncHealthIntegration(): Promise<void> {
    // Listen to sync health events
    this.syncHealthService.on('sync_aware_heartbeat_received', (data) => {
      this.handleSyncHeartbeat(data);
    });

    this.syncHealthService.on('sync_health_escalation_created', (escalation: SyncHealthEscalation) => {
      this.handleSyncEscalation(escalation);
    });

    this.syncHealthService.on('sync_operation_health_updated', (data) => {
      this.handleSyncOperationUpdate(data);
    });

    this.syncHealthService.on('sync_conflict_health_updated', (data) => {
      this.handleSyncConflictUpdate(data);
    });

    this.syncHealthService.on('system_sync_health_checked', (data) => {
      this.handleSystemHealthUpdate(data);
    });

    this.logger.log('Sync health service integration established');
  }

  /**
   * Setup integration with existing dashboard services
   */
  private async setupDashboardIntegration(): Promise<void> {
    // Listen to dashboard events
    this.dashboardService.on('dashboard_update', (update) => {
      this.handleDashboardUpdate(update);
    });

    // Listen to monitoring integration events
    this.monitoringIntegration.on('monitoring_event', (event) => {
      this.handleMonitoringEvent(event);
    });

    this.logger.log('Dashboard service integration established');
  }

  /**
   * Setup default alert configurations
   */
  private setupDefaultAlerts(): void {
    const defaultAlerts: SyncHealthAlert[] = [
      {
        id: 'sync_error_rate_warning',
        type: 'sync_error_rate',
        threshold: 0.1, // 10%
        duration: 300, // 5 minutes
        severity: 'warning',
        message: 'Sync error rate exceeded 10%',
        enabled: true
      },
      {
        id: 'sync_error_rate_critical',
        type: 'sync_error_rate',
        threshold: 0.25, // 25%
        duration: 60, // 1 minute
        severity: 'critical',
        message: 'Sync error rate exceeded 25%',
        enabled: true
      },
      {
        id: 'sync_latency_warning',
        type: 'sync_latency',
        threshold: 5000, // 5 seconds
        duration: 180, // 3 minutes
        severity: 'warning',
        message: 'Sync latency exceeded 5 seconds',
        enabled: true
      },
      {
        id: 'conflict_rate_warning',
        type: 'conflict_rate',
        threshold: 0.05, // 5%
        duration: 600, // 10 minutes
        severity: 'warning',
        message: 'Conflict rate exceeded 5%',
        enabled: true
      },
      {
        id: 'agent_health_critical',
        type: 'agent_health',
        threshold: 0.5, // 50% of agents unhealthy
        duration: 120, // 2 minutes
        severity: 'critical',
        message: 'More than 50% of agents are unhealthy',
        enabled: true
      }
    ];

    for (const alert of defaultAlerts) {
      this.alertConfigs.set(alert.id, alert);
    }

    this.logger.log(`Setup ${defaultAlerts.length} default sync health alerts`);
  }

  /**
   * Setup default dashboard widgets
   */
  private setupDefaultWidgets(): void {
    const defaultWidgets: SyncHealthWidget[] = [
      {
        id: 'system_health_status',
        type: 'status',
        title: 'System Health',
        config: {
          metric: 'system_health',
          thresholds: [
            { value: 0, color: '#22c55e', label: 'Healthy' },
            { value: 1, color: '#f59e0b', label: 'Degraded' },
            { value: 2, color: '#ef4444', label: 'Critical' }
          ]
        },
        position: { x: 0, y: 0, width: 4, height: 2 }
      },
      {
        id: 'sync_error_rate_chart',
        type: 'chart',
        title: 'Sync Error Rate',
        config: {
          metric: 'sync_error_rate',
          chartType: 'line',
          timeRange: 60, // 1 hour
          refreshInterval: 30,
          thresholds: [
            { value: 0.1, color: '#f59e0b', label: 'Warning' },
            { value: 0.25, color: '#ef4444', label: 'Critical' }
          ]
        },
        position: { x: 4, y: 0, width: 8, height: 4 }
      },
      {
        id: 'sync_latency_gauge',
        type: 'metric',
        title: 'Avg Sync Latency',
        config: {
          metric: 'sync_latency',
          chartType: 'gauge',
          thresholds: [
            { value: 1000, color: '#22c55e', label: 'Good' },
            { value: 5000, color: '#f59e0b', label: 'Warning' },
            { value: 10000, color: '#ef4444', label: 'Critical' }
          ]
        },
        position: { x: 0, y: 2, width: 4, height: 3 }
      },
      {
        id: 'agent_health_pie',
        type: 'chart',
        title: 'Agent Health Distribution',
        config: {
          metric: 'agent_health',
          chartType: 'pie',
          refreshInterval: 60
        },
        position: { x: 4, y: 4, width: 4, height: 3 }
      },
      {
        id: 'conflict_rate_chart',
        type: 'chart',
        title: 'Conflict Rate',
        config: {
          metric: 'conflict_rate',
          chartType: 'line',
          timeRange: 120, // 2 hours
          refreshInterval: 60
        },
        position: { x: 8, y: 4, width: 4, height: 3 }
      },
      {
        id: 'active_escalations',
        type: 'alert',
        title: 'Active Escalations',
        config: {
          metric: 'escalations',
          refreshInterval: 30
        },
        position: { x: 0, y: 5, width: 12, height: 2 }
      }
    ];

    for (const widget of defaultWidgets) {
      this.widgetConfigs.set(widget.id, widget);
    }

    this.logger.log(`Setup ${defaultWidgets.length} default dashboard widgets`);
  }

  /**
   * Start dashboard updates
   */
  private startDashboardUpdates(): void {
    // Update dashboard every 30 seconds
    this.updateInterval = setInterval(() => {
      this.updateDashboardData();
    }, 30000);

    // Check alerts every 15 seconds
    this.alertCheckInterval = setInterval(() => {
      this.checkAlerts();
    }, 15000);

    // Initial update
    this.updateDashboardData();

    this.logger.log('Dashboard updates started');
  }

  /**
   * Handle sync heartbeat events
   */
  private handleSyncHeartbeat(data: any): void {
    const { agentId, syncMetrics, syncState, tenantId } = data;
    
    // Update metrics history
    this.updateMetricsHistory('agent_heartbeats', 1);
    this.updateMetricsHistory(`sync_state_${syncState}`, 1);
    
    if (syncMetrics) {
      this.updateMetricsHistory('sync_error_rate', syncMetrics.syncErrorRate);
      this.updateMetricsHistory('sync_latency', syncMetrics.syncLatencyMs);
    }

    // Record metrics to existing services
    this.recordMetric('sync_heartbeat_received', 1, {
      agentId,
      syncState,
      tenantId: tenantId || 'global'
    });
  }

  /**
   * Handle sync escalation events
   */
  private handleSyncEscalation(escalation: SyncHealthEscalation): void {
    // Update escalation metrics
    this.updateMetricsHistory('escalations_total', 1);
    this.updateMetricsHistory(`escalation_${escalation.type}`, 1);
    this.updateMetricsHistory(`escalation_${escalation.severity}`, 1);

    // Create dashboard alert
    this.dashboardService.createAlert({
      level: escalation.severity === 'emergency' ? 'critical' : escalation.severity,
      message: `Sync health escalation: ${escalation.type}`,
      component: 'sync_health_monitor',
      tenantId: escalation.tenantId,
      metadata: {
        escalationType: escalation.type,
        agentId: escalation.agentId,
        syncMetrics: escalation.syncMetrics,
        recommendedActions: escalation.recommendedActions
      }
    });

    // Record to existing monitoring
    this.recordMetric('sync_escalation_created', 1, {
      type: escalation.type,
      severity: escalation.severity,
      agentId: escalation.agentId || 'system',
      tenantId: escalation.tenantId || 'global'
    });

    this.emit('sync_escalation_dashboard_updated', escalation);
  }

  /**
   * Handle sync operation updates
   */
  private handleSyncOperationUpdate(data: any): void {
    const { agentId, success, duration, error, tenantId } = data;
    
    // Update operation metrics
    this.updateMetricsHistory('sync_operations_total', 1);
    
    if (success) {
      this.updateMetricsHistory('sync_operations_success', 1);
      if (duration) {
        this.updateMetricsHistory('sync_duration', duration);
      }
    } else {
      this.updateMetricsHistory('sync_operations_failed', 1);
    }

    // Record to existing services
    this.recordMetric('sync_operation_completed', 1, {
      agentId,
      success: success.toString(),
      tenantId: tenantId || 'global'
    });
  }

  /**
   * Handle sync conflict updates
   */
  private handleSyncConflictUpdate(data: any): void {
    const { agentId, conflict, resolved, tenantId } = data;
    
    if (resolved) {
      this.updateMetricsHistory('conflicts_resolved', 1);
    } else {
      this.updateMetricsHistory('conflicts_detected', 1);
    }

    // Record to existing services
    this.recordMetric('sync_conflict_event', 1, {
      agentId,
      resolved: resolved ? 'true' : 'false',
      tenantId: tenantId || 'global'
    });
  }

  /**
   * Handle system health updates
   */
  private handleSystemHealthUpdate(data: any): void {
    const { totalAgents, systemErrorRate, avgLatency, totalOperations } = data;
    
    // Update system metrics
    this.updateMetricsHistory('total_agents', totalAgents);
    this.updateMetricsHistory('system_error_rate', systemErrorRate);
    this.updateMetricsHistory('system_avg_latency', avgLatency);
    this.updateMetricsHistory('total_operations', totalOperations);

    // Record to existing services
    this.recordMetric('system_health_check', 1, {
      totalAgents: totalAgents.toString(),
      errorRate: systemErrorRate.toString(),
      avgLatency: avgLatency.toString()
    });
  }

  /**
   * Handle dashboard updates
   */
  private handleDashboardUpdate(update: any): void {
    // Process dashboard updates and integrate with sync health data
    if (update.type === 'sync_health_request') {
      this.sendSyncHealthUpdate();
    }
  }

  /**
   * Handle monitoring events
   */
  private handleMonitoringEvent(event: any): void {
    // Integrate monitoring events with sync health dashboard
    if (event.type.startsWith('sync_')) {
      this.updateMetricsHistory(`monitoring_${event.type}`, 1);
    }
  }

  /**
   * Update dashboard data
   */
  private async updateDashboardData(): Promise<void> {
    try {
      const healthReport = this.syncHealthService.getUnifiedHealthReport();
      const now = new Date();
      
      // Update dashboard data structure
      this.dashboardData = {
        timestamp: now,
        systemHealth: healthReport.systemHealth,
        agentMetrics: {
          total: healthReport.agentCount,
          healthy: this.getAgentCountByHealth('healthy'),
          degraded: this.getAgentCountByHealth('degraded'),
          critical: this.getAgentCountByHealth('critical'),
          offline: this.getAgentCountByHealth('offline')
        },
        syncMetrics: {
          operationsPerMinute: this.calculateOperationsPerMinute(),
          errorRate: healthReport.syncMetrics.errorRate,
          avgLatency: healthReport.syncMetrics.avgLatency,
          conflictRate: healthReport.syncMetrics.conflictRate,
          throughput: this.calculateThroughput()
        },
        escalations: {
          active: healthReport.activeEscalations,
          resolved: this.getResolvedEscalationsCount(),
          byType: this.getEscalationsByType(),
          bySeverity: this.getEscalationsBySeverity()
        },
        tenantMetrics: this.getTenantMetrics()
      };

      // Send update to dashboard
      await this.sendSyncHealthUpdate();
      
      // Record dashboard update metric
      this.recordMetric('dashboard_update_sent', 1);
      
    } catch (error) {
      this.logger.error('Error updating dashboard data:', error);
    }
  }

  /**
   * Send sync health update to dashboard
   */
  private async sendSyncHealthUpdate(): Promise<void> {
    try {
      // Send to sync dashboard service
      await this.dashboardService.updateDashboard('sync_health', this.dashboardData);
      
      // Send to existing monitoring service
      if (this.monitoringService) {
        await this.monitoringService.recordMetric('sync_health_dashboard_update', 1, {
          systemHealth: this.dashboardData.systemHealth,
          agentCount: this.dashboardData.agentMetrics.total.toString(),
          errorRate: this.dashboardData.syncMetrics.errorRate.toString()
        });
      }

      this.emit('sync_health_dashboard_updated', this.dashboardData);
      
    } catch (error) {
      this.logger.error('Error sending sync health update:', error);
    }
  }

  /**
   * Check alerts against current metrics
   */
  private checkAlerts(): void {
    for (const [alertId, alert] of this.alertConfigs) {
      if (!alert.enabled) continue;
      
      try {
        this.checkAlert(alertId, alert);
      } catch (error) {
        this.logger.error(`Error checking alert ${alertId}:`, error);
      }
    }
  }

  /**
   * Check individual alert
   */
  private checkAlert(alertId: string, alert: SyncHealthAlert): void {
    const now = new Date();
    const windowStart = new Date(now.getTime() - alert.duration * 1000);
    
    let currentValue: number;
    
    switch (alert.type) {
      case 'sync_error_rate':
        currentValue = this.getAverageMetricValue('sync_error_rate', windowStart);
        break;
      case 'sync_latency':
        currentValue = this.getAverageMetricValue('sync_latency', windowStart);
        break;
      case 'conflict_rate':
        currentValue = this.getAverageMetricValue('conflict_rate', windowStart);
        break;
      case 'agent_health':
        currentValue = this.getUnhealthyAgentRatio();
        break;
      case 'escalation_rate':
        currentValue = this.getEscalationRate(windowStart);
        break;
      default:
        return;
    }

    // Check if threshold is exceeded
    if (currentValue > alert.threshold) {
      this.triggerAlert(alertId, alert, currentValue);
    }
  }

  /**
   * Trigger alert
   */
  private async triggerAlert(alertId: string, alert: SyncHealthAlert, currentValue: number): Promise<void> {
    const alertData = {
      id: alertId,
      level: alert.severity,
      message: `${alert.message} (current: ${currentValue.toFixed(3)}, threshold: ${alert.threshold})`,
      component: 'sync_health_monitor',
      tenantId: alert.tenantId,
      metadata: {
        alertType: alert.type,
        currentValue,
        threshold: alert.threshold,
        duration: alert.duration
      }
    };

    // Create alert in dashboard
    await this.dashboardService.createAlert(alertData);
    
    // Record alert metric
    this.recordMetric('sync_health_alert_triggered', 1, {
      alertId,
      type: alert.type,
      severity: alert.severity,
      tenantId: alert.tenantId || 'global'
    });

    this.emit('sync_health_alert_triggered', { alertId, alert, currentValue });
  }

  /**
   * Utility methods for metrics calculation
   */
  private updateMetricsHistory(metric: string, value: number): void {
    if (!this.metricsHistory.has(metric)) {
      this.metricsHistory.set(metric, []);
    }
    
    const history = this.metricsHistory.get(metric)!;
    history.push({ timestamp: new Date(), value });
    
    // Keep only last 2 hours of data
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const filtered = history.filter(entry => entry.timestamp > twoHoursAgo);
    this.metricsHistory.set(metric, filtered);
  }

  private getAverageMetricValue(metric: string, since: Date): number {
    const history = this.metricsHistory.get(metric) || [];
    const filtered = history.filter(entry => entry.timestamp > since);
    
    if (filtered.length === 0) return 0;
    
    return filtered.reduce((sum, entry) => sum + entry.value, 0) / filtered.length;
  }

  private getAgentCountByHealth(health: string): number {
    // TODO: Implement actual agent health counting
    // This would integrate with the sync health service to get real counts
    return 0;
  }

  private calculateOperationsPerMinute(): number {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const operations = this.metricsHistory.get('sync_operations_total') || [];
    return operations.filter(entry => entry.timestamp > oneMinuteAgo).length;
  }

  private calculateThroughput(): number {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const successful = this.metricsHistory.get('sync_operations_success') || [];
    return successful.filter(entry => entry.timestamp > oneMinuteAgo).length;
  }

  private getResolvedEscalationsCount(): number {
    // TODO: Implement escalation resolution tracking
    return 0;
  }

  private getEscalationsByType(): Record<string, number> {
    // TODO: Implement escalation type counting
    return {};
  }

  private getEscalationsBySeverity(): Record<string, number> {
    // TODO: Implement escalation severity counting
    return {};
  }

  private getTenantMetrics(): Record<string, any> {
    // TODO: Implement tenant-specific metrics collection
    return {};
  }

  private getUnhealthyAgentRatio(): number {
    // TODO: Implement unhealthy agent ratio calculation
    return 0;
  }

  private getEscalationRate(since: Date): number {
    const escalations = this.metricsHistory.get('escalations_total') || [];
    return escalations.filter(entry => entry.timestamp > since).length;
  }

  private async recordMetric(name: string, value: number, tags?: Record<string, string>): Promise<void> {
    try {
      if (this.metricsService) {
        await this.metricsService.collectMetric(name, value, tags);
      }
    } catch (error) {
      this.logger.error('Error recording metric:', error);
    }
  }

  private createDefaultDashboardData(): SyncHealthDashboardData {
    return {
      timestamp: new Date(),
      systemHealth: 'healthy',
      agentMetrics: {
        total: 0,
        healthy: 0,
        degraded: 0,
        critical: 0,
        offline: 0
      },
      syncMetrics: {
        operationsPerMinute: 0,
        errorRate: 0,
        avgLatency: 0,
        conflictRate: 0,
        throughput: 0
      },
      escalations: {
        active: 0,
        resolved: 0,
        byType: {},
        bySeverity: {}
      },
      tenantMetrics: {}
    };
  }

  /**
   * Public API methods
   */

  /**
   * Get current dashboard data
   */
  getDashboardData(): SyncHealthDashboardData {
    return { ...this.dashboardData };
  }

  /**
   * Get widget configuration
   */
  getWidgetConfig(widgetId: string): SyncHealthWidget | undefined {
    return this.widgetConfigs.get(widgetId);
  }

  /**
   * Update widget configuration
   */
  updateWidgetConfig(widgetId: string, config: Partial<SyncHealthWidget>): void {
    const existing = this.widgetConfigs.get(widgetId);
    if (existing) {
      this.widgetConfigs.set(widgetId, { ...existing, ...config });
      this.emit('widget_config_updated', { widgetId, config });
    }
  }

  /**
   * Get alert configuration
   */
  getAlertConfig(alertId: string): SyncHealthAlert | undefined {
    return this.alertConfigs.get(alertId);
  }

  /**
   * Update alert configuration
   */
  updateAlertConfig(alertId: string, config: Partial<SyncHealthAlert>): void {
    const existing = this.alertConfigs.get(alertId);
    if (existing) {
      this.alertConfigs.set(alertId, { ...existing, ...config });
      this.emit('alert_config_updated', { alertId, config });
    }
  }

  /**
   * Get metrics history for a specific metric
   */
  getMetricsHistory(metric: string, timeRange?: number): Array<{ timestamp: Date; value: number }> {
    const history = this.metricsHistory.get(metric) || [];
    
    if (timeRange) {
      const since = new Date(Date.now() - timeRange * 60 * 1000);
      return history.filter(entry => entry.timestamp > since);
    }
    
    return [...history];
  }

  /**
   * Cleanup resources
   */
  async onModuleDestroy(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
    }
    
    this.logger.log('SyncHealthDashboardIntegration destroyed');
  }
}