import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import {
  SyncAwareHeartbeatMonitoringService,
  SyncHealthEscalation,
} from './SyncAwareHeartbeatMonitoringService';
import {
  SyncHealthDashboardData,
  SyncHealthDashboardIntegration,
} from './SyncHealthDashboardIntegration';

/**
 * Interface for existing MetricsService integration
 */
export interface IExistingMetricsService {
  createPerformanceMetric(data: any): Promise<any>;
  createErrorMetric(data: any): Promise<any>;
  createUsageMetric(data: any): Promise<any>;
  getPerformanceStats(startTime: Date, endTime: Date): Promise<any>;
  findMetricsByTimeRange(timeRange: any): Promise<any>;
}

/**
 * Unified health report structure
 */
export interface UnifiedSyncHealthReport {
  reportId: string;
  timestamp: Date;
  reportType: 'real_time' | 'hourly' | 'daily' | 'weekly';

  // System overview
  systemOverview: {
    health: 'healthy' | 'degraded' | 'critical';
    uptime: number; // seconds
    totalAgents: number;
    activeAgents: number;
    totalTenants: number;
    activeTenants: number;
  };

  // Sync performance metrics
  syncPerformance: {
    operationsTotal: number;
    operationsSuccess: number;
    operationsFailed: number;
    errorRate: number;
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
    throughputPerSecond: number;
    throughputPerMinute: number;
  };

  // Conflict management metrics
  conflictMetrics: {
    conflictsDetected: number;
    conflictsResolved: number;
    conflictRate: number;
    avgResolutionTime: number;
    conflictsByType: Record<string, number>;
    conflictsByTenant: Record<string, number>;
  };

  // Agent health metrics
  agentHealth: {
    healthyCount: number;
    degradedCount: number;
    criticalCount: number;
    offlineCount: number;
    healthDistribution: Record<string, number>;
    avgResponseTime: number;
    stagnationEvents: number;
  };

  // Escalation metrics
  escalationMetrics: {
    totalEscalations: number;
    activeEscalations: number;
    resolvedEscalations: number;
    escalationsByType: Record<string, number>;
    escalationsBySeverity: Record<string, number>;
    avgResolutionTime: number;
    escalationRate: number;
  };

  // Tenant-specific metrics
  tenantMetrics: Record<
    string,
    {
      agentCount: number;
      syncOperations: number;
      errorRate: number;
      conflictRate: number;
      avgLatency: number;
      lastActivity: Date;
      health: 'healthy' | 'degraded' | 'critical';
    }
  >;

  // Infrastructure health
  infrastructureHealth: {
    clockSyncHealth: 'synchronized' | 'drift_detected' | 'failed';
    fileWatcherHealth: 'healthy' | 'degraded' | 'failed';
    redisHealth: 'healthy' | 'degraded' | 'failed';
    databaseHealth: 'healthy' | 'degraded' | 'failed';
    webSocketHealth: 'healthy' | 'degraded' | 'failed';
  };

  // Recommendations and alerts
  recommendations: Array<{
    type: 'performance' | 'reliability' | 'security' | 'maintenance';
    priority: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    actions: string[];
    estimatedImpact: string;
  }>;

  // Historical trends
  trends: {
    errorRateTrend: 'improving' | 'stable' | 'degrading';
    latencyTrend: 'improving' | 'stable' | 'degrading';
    throughputTrend: 'improving' | 'stable' | 'degrading';
    conflictTrend: 'improving' | 'stable' | 'degrading';
  };
}

/**
 * Health report configuration
 */
export interface HealthReportConfig {
  realTimeInterval: number; // seconds
  hourlyReportEnabled: boolean;
  dailyReportEnabled: boolean;
  weeklyReportEnabled: boolean;
  retentionDays: number;
  alertThresholds: {
    errorRate: number;
    latency: number;
    conflictRate: number;
    escalationRate: number;
  };
}

/**
 * Unified sync health reporting service
 * Integrates with existing MetricsService to provide comprehensive health reporting
 */
@Injectable()
export class UnifiedSyncHealthReporting extends EventEmitter implements OnModuleInit {
  private readonly logger = new Logger(UnifiedSyncHealthReporting.name);

  private syncHealthService: SyncAwareHeartbeatMonitoringService;
  private dashboardIntegration: SyncHealthDashboardIntegration;
  private metricsService?: IExistingMetricsService;

  private config: HealthReportConfig;
  private reportHistory = new Map<string, UnifiedSyncHealthReport>();
  private metricsBuffer = new Map<
    string,
    Array<{ timestamp: Date; value: number; metadata?: any }>
  >();

  private realTimeInterval?: NodeJS.Timeout;
  private hourlyInterval?: NodeJS.Timeout;
  private dailyInterval?: NodeJS.Timeout;
  private weeklyInterval?: NodeJS.Timeout;

  private systemStartTime = new Date();

  constructor(
    syncHealthService: SyncAwareHeartbeatMonitoringService,
    dashboardIntegration: SyncHealthDashboardIntegration,
    metricsService?: IExistingMetricsService,
    config?: Partial<HealthReportConfig>
  ) {
    super();
    this.syncHealthService = syncHealthService;
    this.dashboardIntegration = dashboardIntegration;
    this.metricsService = metricsService;

    this.config = {
      realTimeInterval: 30, // 30 seconds
      hourlyReportEnabled: true,
      dailyReportEnabled: true,
      weeklyReportEnabled: true,
      retentionDays: 30,
      alertThresholds: {
        errorRate: 0.1,
        latency: 5000,
        conflictRate: 0.05,
        escalationRate: 0.02,
      },
      ...config,
    };
  }

  async onModuleInit(): Promise<void> {
    await this.setupHealthReporting();
    this.startReportingSchedules();
    this.logger.log('UnifiedSyncHealthReporting initialized');
  }

  /**
   * Setup health reporting integration
   */
  private async setupHealthReporting(): Promise<void> {
    // Listen to sync health events
    this.syncHealthService.on('sync_aware_heartbeat_received', (data) => {
      this.recordHealthMetric('heartbeat_received', 1, data);
    });

    this.syncHealthService.on(
      'sync_health_escalation_created',
      (escalation: SyncHealthEscalation) => {
        this.recordHealthMetric('escalation_created', 1, escalation);
      }
    );

    this.syncHealthService.on('sync_operation_health_updated', (data) => {
      this.recordHealthMetric('sync_operation', data.success ? 1 : 0, data);
    });

    // Listen to dashboard events
    this.dashboardIntegration.on(
      'sync_health_dashboard_updated',
      (data: SyncHealthDashboardData) => {
        this.processDashboardData(data);
      }
    );

    this.logger.log('Health reporting integration established');
  }

  /**
   * Start reporting schedules
   */
  private startReportingSchedules(): void {
    // Real-time reporting
    this.realTimeInterval = setInterval(() => {
      this.generateRealTimeReport();
    }, this.config.realTimeInterval * 1000);

    // Hourly reporting
    if (this.config.hourlyReportEnabled) {
      this.hourlyInterval = setInterval(
        () => {
          this.generateHourlyReport();
        },
        60 * 60 * 1000
      ); // 1 hour
    }

    // Daily reporting
    if (this.config.dailyReportEnabled) {
      this.dailyInterval = setInterval(
        () => {
          this.generateDailyReport();
        },
        24 * 60 * 60 * 1000
      ); // 24 hours
    }

    // Weekly reporting
    if (this.config.weeklyReportEnabled) {
      this.weeklyInterval = setInterval(
        () => {
          this.generateWeeklyReport();
        },
        7 * 24 * 60 * 60 * 1000
      ); // 7 days
    }

    this.logger.log('Reporting schedules started');
  }

  /**
   * Generate real-time health report
   */
  private async generateRealTimeReport(): Promise<UnifiedSyncHealthReport> {
    try {
      const report = await this.createHealthReport('real_time');

      // Store report
      this.reportHistory.set(report.reportId, report);

      // Send to existing metrics service
      await this.sendToMetricsService(report);

      // Emit report event
      this.emit('health_report_generated', report);

      // Check for alerts
      this.checkHealthAlerts(report);

      return report;
    } catch (error) {
      this.logger.error('Error generating real-time health report:', error);
      throw error;
    }
  }

  /**
   * Generate hourly health report
   */
  private async generateHourlyReport(): Promise<UnifiedSyncHealthReport> {
    const report = await this.createHealthReport('hourly');
    this.reportHistory.set(report.reportId, report);

    await this.sendToMetricsService(report);
    this.emit('hourly_health_report_generated', report);

    return report;
  }

  /**
   * Generate daily health report
   */
  private async generateDailyReport(): Promise<UnifiedSyncHealthReport> {
    const report = await this.createHealthReport('daily');
    this.reportHistory.set(report.reportId, report);

    await this.sendToMetricsService(report);
    this.emit('daily_health_report_generated', report);

    return report;
  }

  /**
   * Generate weekly health report
   */
  private async generateWeeklyReport(): Promise<UnifiedSyncHealthReport> {
    const report = await this.createHealthReport('weekly');
    this.reportHistory.set(report.reportId, report);

    await this.sendToMetricsService(report);
    this.emit('weekly_health_report_generated', report);

    return report;
  }

  /**
   * Create comprehensive health report
   */
  private async createHealthReport(
    reportType: UnifiedSyncHealthReport['reportType']
  ): Promise<UnifiedSyncHealthReport> {
    const now = new Date();
    const reportId = `${reportType}_${now.getTime()}`;

    // Get data from sync health service
    const unifiedHealthReport = this.syncHealthService.getUnifiedHealthReport();
    const dashboardData = this.dashboardIntegration.getDashboardData();

    // Calculate time range for metrics
    const timeRange = this.getTimeRangeForReportType(reportType);
    const startTime = new Date(now.getTime() - timeRange);

    // Collect metrics from buffer
    const syncMetrics = this.calculateSyncMetrics(startTime, now);
    const conflictMetrics = this.calculateConflictMetrics(startTime, now);
    const escalationMetrics = this.calculateEscalationMetrics(startTime, now);
    const agentMetrics = this.calculateAgentMetrics(startTime, now);

    const report: UnifiedSyncHealthReport = {
      reportId,
      timestamp: now,
      reportType,

      systemOverview: {
        health: unifiedHealthReport.systemHealth,
        uptime: Math.floor((now.getTime() - this.systemStartTime.getTime()) / 1000),
        totalAgents: unifiedHealthReport.agentCount,
        activeAgents: dashboardData.agentMetrics.healthy + dashboardData.agentMetrics.degraded,
        totalTenants: Object.keys(dashboardData.tenantMetrics).length,
        activeTenants: Object.keys(dashboardData.tenantMetrics).filter(
          (tenantId) => dashboardData.tenantMetrics[tenantId].agentCount > 0
        ).length,
      },

      syncPerformance: {
        operationsTotal: syncMetrics.operationsTotal,
        operationsSuccess: syncMetrics.operationsSuccess,
        operationsFailed: syncMetrics.operationsFailed,
        errorRate: unifiedHealthReport.syncMetrics.errorRate,
        avgLatency: unifiedHealthReport.syncMetrics.avgLatency,
        p95Latency: syncMetrics.p95Latency,
        p99Latency: syncMetrics.p99Latency,
        throughputPerSecond: syncMetrics.throughputPerSecond,
        throughputPerMinute: dashboardData.syncMetrics.operationsPerMinute,
      },

      conflictMetrics: {
        conflictsDetected: conflictMetrics.detected,
        conflictsResolved: conflictMetrics.resolved,
        conflictRate: unifiedHealthReport.syncMetrics.conflictRate,
        avgResolutionTime: conflictMetrics.avgResolutionTime,
        conflictsByType: conflictMetrics.byType,
        conflictsByTenant: conflictMetrics.byTenant,
      },

      agentHealth: {
        healthyCount: dashboardData.agentMetrics.healthy,
        degradedCount: dashboardData.agentMetrics.degraded,
        criticalCount: dashboardData.agentMetrics.critical,
        offlineCount: dashboardData.agentMetrics.offline,
        healthDistribution: this.calculateHealthDistribution(dashboardData.agentMetrics),
        avgResponseTime: agentMetrics.avgResponseTime,
        stagnationEvents: agentMetrics.stagnationEvents,
      },

      escalationMetrics: {
        totalEscalations: escalationMetrics.total,
        activeEscalations: dashboardData.escalations.active,
        resolvedEscalations: dashboardData.escalations.resolved,
        escalationsByType: dashboardData.escalations.byType,
        escalationsBySeverity: dashboardData.escalations.bySeverity,
        avgResolutionTime: escalationMetrics.avgResolutionTime,
        escalationRate: escalationMetrics.rate,
      },

      tenantMetrics: this.calculateTenantMetrics(dashboardData.tenantMetrics),

      infrastructureHealth: {
        clockSyncHealth: 'synchronized', // TODO: Get from master clock service
        fileWatcherHealth: 'healthy', // TODO: Get from file watcher service
        redisHealth: 'healthy', // TODO: Get from Redis service
        databaseHealth: 'healthy', // TODO: Get from database service
        webSocketHealth: 'healthy', // TODO: Get from WebSocket service
      },

      recommendations: this.generateRecommendations(unifiedHealthReport, dashboardData),

      trends: this.calculateTrends(reportType, startTime, now),
    };

    return report;
  }

  /**
   * Record health metric to buffer
   */
  private recordHealthMetric(metric: string, value: number, metadata?: any): void {
    if (!this.metricsBuffer.has(metric)) {
      this.metricsBuffer.set(metric, []);
    }

    const buffer = this.metricsBuffer.get(metric)!;
    buffer.push({ timestamp: new Date(), value, metadata });

    // Keep only data within retention period
    const retentionTime = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
    const filtered = buffer.filter((entry) => entry.timestamp > retentionTime);
    this.metricsBuffer.set(metric, filtered);
  }

  /**
   * Process dashboard data for health reporting
   */
  private processDashboardData(data: SyncHealthDashboardData): void {
    // Record dashboard metrics to buffer
    this.recordHealthMetric('system_health', this.healthToNumber(data.systemHealth));
    this.recordHealthMetric('total_agents', data.agentMetrics.total);
    this.recordHealthMetric('error_rate', data.syncMetrics.errorRate);
    this.recordHealthMetric('avg_latency', data.syncMetrics.avgLatency);
    this.recordHealthMetric('conflict_rate', data.syncMetrics.conflictRate);
    this.recordHealthMetric('active_escalations', data.escalations.active);
  }

  /**
   * Send report to existing metrics service
   */
  private async sendToMetricsService(report: UnifiedSyncHealthReport): Promise<void> {
    if (!this.metricsService) return;

    try {
      // Send performance metrics
      await this.metricsService.createPerformanceMetric({
        operation: `sync_health_report_${report.reportType}`,
        duration: 0, // Report generation time could be tracked
        success: true,
        metadata: {
          reportId: report.reportId,
          systemHealth: report.systemOverview.health,
          errorRate: report.syncPerformance.errorRate,
          avgLatency: report.syncPerformance.avgLatency,
          totalAgents: report.systemOverview.totalAgents,
        },
      });

      // Send usage metrics
      await this.metricsService.createUsageMetric({
        endpoint: 'sync_health_reporting',
        responseTime: 0,
        statusCode: 200,
        metadata: {
          reportType: report.reportType,
          agentCount: report.systemOverview.totalAgents,
          tenantCount: report.systemOverview.totalTenants,
        },
      });

      // Send error metrics if there are issues
      if (report.syncPerformance.errorRate > this.config.alertThresholds.errorRate) {
        await this.metricsService.createErrorMetric({
          error: 'High sync error rate detected',
          context: {
            errorRate: report.syncPerformance.errorRate,
            threshold: this.config.alertThresholds.errorRate,
            reportId: report.reportId,
          },
        });
      }
    } catch (error) {
      this.logger.error('Error sending report to metrics service:', error);
    }
  }

  /**
   * Check health alerts based on report
   */
  private checkHealthAlerts(report: UnifiedSyncHealthReport): void {
    const alerts: Array<{ type: string; message: string; severity: string }> = [];

    // Check error rate
    if (report.syncPerformance.errorRate > this.config.alertThresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        message: `Sync error rate (${(report.syncPerformance.errorRate * 100).toFixed(1)}%) exceeds threshold (${(this.config.alertThresholds.errorRate * 100).toFixed(1)}%)`,
        severity: report.syncPerformance.errorRate > 0.25 ? 'critical' : 'warning',
      });
    }

    // Check latency
    if (report.syncPerformance.avgLatency > this.config.alertThresholds.latency) {
      alerts.push({
        type: 'latency',
        message: `Average sync latency (${report.syncPerformance.avgLatency}ms) exceeds threshold (${this.config.alertThresholds.latency}ms)`,
        severity: report.syncPerformance.avgLatency > 10000 ? 'critical' : 'warning',
      });
    }

    // Check conflict rate
    if (report.conflictMetrics.conflictRate > this.config.alertThresholds.conflictRate) {
      alerts.push({
        type: 'conflict_rate',
        message: `Conflict rate (${(report.conflictMetrics.conflictRate * 100).toFixed(1)}%) exceeds threshold (${(this.config.alertThresholds.conflictRate * 100).toFixed(1)}%)`,
        severity: 'warning',
      });
    }

    // Check escalation rate
    if (report.escalationMetrics.escalationRate > this.config.alertThresholds.escalationRate) {
      alerts.push({
        type: 'escalation_rate',
        message: `Escalation rate (${(report.escalationMetrics.escalationRate * 100).toFixed(1)}%) exceeds threshold (${(this.config.alertThresholds.escalationRate * 100).toFixed(1)}%)`,
        severity: 'warning',
      });
    }

    // Emit alerts
    for (const alert of alerts) {
      this.emit('health_alert', {
        ...alert,
        reportId: report.reportId,
        timestamp: report.timestamp,
      });
    }
  }

  /**
   * Utility methods for calculations
   */
  private getTimeRangeForReportType(reportType: string): number {
    switch (reportType) {
      case 'real_time':
        return 5 * 60 * 1000; // 5 minutes
      case 'hourly':
        return 60 * 60 * 1000; // 1 hour
      case 'daily':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000; // 7 days
      default:
        return 60 * 60 * 1000; // 1 hour default
    }
  }

  private calculateSyncMetrics(startTime: Date, endTime: Date): any {
    // TODO: Implement actual sync metrics calculation from buffer
    return {
      operationsTotal: 0,
      operationsSuccess: 0,
      operationsFailed: 0,
      p95Latency: 0,
      p99Latency: 0,
      throughputPerSecond: 0,
    };
  }

  private calculateConflictMetrics(startTime: Date, endTime: Date): any {
    // TODO: Implement actual conflict metrics calculation
    return {
      detected: 0,
      resolved: 0,
      avgResolutionTime: 0,
      byType: {},
      byTenant: {},
    };
  }

  private calculateEscalationMetrics(startTime: Date, endTime: Date): any {
    // TODO: Implement actual escalation metrics calculation
    return {
      total: 0,
      avgResolutionTime: 0,
      rate: 0,
    };
  }

  private calculateAgentMetrics(startTime: Date, endTime: Date): any {
    // TODO: Implement actual agent metrics calculation
    return {
      avgResponseTime: 0,
      stagnationEvents: 0,
    };
  }

  private calculateHealthDistribution(agentMetrics: any): Record<string, number> {
    const total = agentMetrics.total || 1;
    return {
      healthy: (agentMetrics.healthy / total) * 100,
      degraded: (agentMetrics.degraded / total) * 100,
      critical: (agentMetrics.critical / total) * 100,
      offline: (agentMetrics.offline / total) * 100,
    };
  }

  private calculateTenantMetrics(tenantMetrics: any): Record<string, any> {
    // TODO: Enhance tenant metrics calculation
    return tenantMetrics;
  }

  private generateRecommendations(healthReport: any, dashboardData: any): any[] {
    const recommendations: any[] = [];

    // Performance recommendations
    if (healthReport.syncMetrics.errorRate > 0.1) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'High sync error rate detected',
        actions: [
          'Check network connectivity',
          'Review sync service logs',
          'Verify system resources',
          'Consider scaling sync infrastructure',
        ],
        estimatedImpact: 'Reduce error rate by 50-80%',
      });
    }

    if (healthReport.syncMetrics.avgLatency > 5000) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'High sync latency detected',
        actions: [
          'Optimize sync operations',
          'Check system load',
          'Review network performance',
          'Consider caching strategies',
        ],
        estimatedImpact: 'Reduce latency by 30-60%',
      });
    }

    // Reliability recommendations
    if (dashboardData.escalations.active > 5) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: 'High number of active escalations',
        actions: [
          'Review escalation procedures',
          'Increase monitoring frequency',
          'Add automated recovery mechanisms',
          'Improve alert thresholds',
        ],
        estimatedImpact: 'Reduce escalations by 40-70%',
      });
    }

    return recommendations;
  }

  private calculateTrends(reportType: string, startTime: Date, endTime: Date): any {
    // TODO: Implement trend calculation based on historical data
    return {
      errorRateTrend: 'stable',
      latencyTrend: 'stable',
      throughputTrend: 'stable',
      conflictTrend: 'stable',
    };
  }

  private healthToNumber(health: string): number {
    switch (health) {
      case 'healthy':
        return 0;
      case 'degraded':
        return 1;
      case 'critical':
        return 2;
      default:
        return 1;
    }
  }

  /**
   * Public API methods
   */

  /**
   * Get latest health report
   */
  getLatestHealthReport(reportType?: string): UnifiedSyncHealthReport | undefined {
    const reports = Array.from(this.reportHistory.values());

    if (reportType) {
      return reports
        .filter((report) => report.reportType === reportType)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    }

    return reports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }

  /**
   * Get health report by ID
   */
  getHealthReport(reportId: string): UnifiedSyncHealthReport | undefined {
    return this.reportHistory.get(reportId);
  }

  /**
   * Get health reports within time range
   */
  getHealthReports(startTime: Date, endTime: Date, reportType?: string): UnifiedSyncHealthReport[] {
    return Array.from(this.reportHistory.values())
      .filter((report) => {
        const inTimeRange = report.timestamp >= startTime && report.timestamp <= endTime;
        const matchesType = !reportType || report.reportType === reportType;
        return inTimeRange && matchesType;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate on-demand health report
   */
  async generateOnDemandReport(
    reportType: UnifiedSyncHealthReport['reportType'] = 'real_time'
  ): Promise<UnifiedSyncHealthReport> {
    return await this.createHealthReport(reportType);
  }

  /**
   * Update report configuration
   */
  updateConfig(newConfig: Partial<HealthReportConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config_updated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): HealthReportConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  async onModuleDestroy(): Promise<void> {
    if (this.realTimeInterval) clearInterval(this.realTimeInterval);
    if (this.hourlyInterval) clearInterval(this.hourlyInterval);
    if (this.dailyInterval) clearInterval(this.dailyInterval);
    if (this.weeklyInterval) clearInterval(this.weeklyInterval);

    this.logger.log('UnifiedSyncHealthReporting destroyed');
  }
}
