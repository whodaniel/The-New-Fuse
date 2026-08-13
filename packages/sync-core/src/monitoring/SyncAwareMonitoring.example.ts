/**
 * Sync-Aware Monitoring System Usage Examples
 *
 * This file demonstrates how to integrate and use the sync-aware heartbeat monitoring
 * system with existing infrastructure and monitoring services.
 */

import { Injectable, Logger, Module } from '@nestjs/common';
import { HeartbeatMonitoringService } from '@the-new-fuse/relay-core';
import { DashboardMonitoringIntegration } from '../dashboard/DashboardMonitoringIntegration';
import { SyncDashboardService } from '../dashboard/SyncDashboardService';
import { ConflictManager } from '../services/ConflictManager';
import { MasterClockService } from '../services/MasterClockService';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import {
  SyncAwareHeartbeatMonitoringService,
  SyncHealthDashboardIntegration,
  SyncHealthEscalation,
  UnifiedSyncHealthReport,
  UnifiedSyncHealthReporting,
} from './index';

/**
 * Example 1: Basic Setup and Integration
 */
@Injectable()
export class BasicSyncMonitoringExample {
  private readonly logger = new Logger(BasicSyncMonitoringExample.name);

  constructor(
    private readonly syncHealthService: SyncAwareHeartbeatMonitoringService,
    private readonly dashboardIntegration: SyncHealthDashboardIntegration,
    private readonly healthReporting: UnifiedSyncHealthReporting
  ) {}

  async setupBasicMonitoring(): Promise<void> {
    this.logger.log('Setting up basic sync-aware monitoring...');

    // Listen to sync health events
    this.syncHealthService.on('sync_aware_heartbeat_received', (data) => {
      this.logger.log(`Sync-aware heartbeat from agent ${data.agentId}: ${data.syncState}`);

      // Log sync metrics
      if (data.syncMetrics.syncErrorRate > 0.1) {
        this.logger.warn(
          `High error rate detected for agent ${data.agentId}: ${(data.syncMetrics.syncErrorRate * 100).toFixed(1)}%`
        );
      }
    });

    // Listen to escalations
    this.syncHealthService.on(
      'sync_health_escalation_created',
      (escalation: SyncHealthEscalation) => {
        this.logger.error(
          `Sync health escalation: ${escalation.type} (${escalation.severity}) for agent ${escalation.agentId}`
        );

        // Handle different escalation types
        switch (escalation.type) {
          case 'sync_failure':
            this.handleSyncFailureEscalation(escalation);
            break;
          case 'conflict_storm':
            this.handleConflictStormEscalation(escalation);
            break;
          case 'clock_drift':
            this.handleClockDriftEscalation(escalation);
            break;
        }
      }
    );

    // Listen to health reports
    this.healthReporting.on('health_report_generated', (report: UnifiedSyncHealthReport) => {
      this.logger.log(
        `Health report generated: ${report.reportType} - System health: ${report.systemOverview.health}`
      );

      // Check for critical issues
      if (report.systemOverview.health === 'critical') {
        this.handleCriticalSystemHealth(report);
      }
    });

    this.logger.log('Basic sync-aware monitoring setup complete');
  }

  private handleSyncFailureEscalation(escalation: SyncHealthEscalation): void {
    this.logger.warn(`Handling sync failure escalation for agent ${escalation.agentId}`);

    // Example: Send notification to operations team
    // await this.notificationService.sendAlert({
    //   type: 'sync_failure',
    //   agentId: escalation.agentId,
    //   severity: escalation.severity,
    //   recommendedActions: escalation.recommendedActions
    // });
  }

  private handleConflictStormEscalation(escalation: SyncHealthEscalation): void {
    this.logger.warn(`Handling conflict storm escalation for agent ${escalation.agentId}`);

    // Example: Temporarily reduce sync frequency
    // await this.syncOrchestrator.reduceSyncFrequency(escalation.agentId, 0.5);
  }

  private handleClockDriftEscalation(escalation: SyncHealthEscalation): void {
    this.logger.warn('Handling clock drift escalation');

    // Example: Trigger clock synchronization
    // await this.masterClockService.forceSynchronization();
  }

  private handleCriticalSystemHealth(report: UnifiedSyncHealthReport): void {
    this.logger.error('Critical system health detected!');

    // Example: Trigger emergency procedures
    // await this.emergencyResponseService.activateEmergencyMode();

    // Send immediate notifications
    // await this.notificationService.sendCriticalAlert({
    //   message: 'Sync system in critical state',
    //   report: report,
    //   urgency: 'immediate'
    // });
  }
}

/**
 * Example 2: Custom Metrics Integration
 */
@Injectable()
export class CustomMetricsIntegrationExample {
  private readonly logger = new Logger(CustomMetricsIntegrationExample.name);

  constructor(
    private readonly syncHealthService: SyncAwareHeartbeatMonitoringService,
    private readonly healthReporting: UnifiedSyncHealthReporting
  ) {}

  async setupCustomMetricsIntegration(): Promise<void> {
    this.logger.log('Setting up custom metrics integration...');

    // Example: Custom business metrics
    this.syncHealthService.on('sync_operation_health_updated', (data) => {
      this.recordBusinessMetrics(data);
    });

    // Example: Performance tracking
    this.healthReporting.on('health_report_generated', (report) => {
      this.trackPerformanceMetrics(report);
    });

    // Example: Custom alerting thresholds
    this.setupCustomAlerts();

    this.logger.log('Custom metrics integration setup complete');
  }

  private recordBusinessMetrics(data: any): void {
    // Example: Record business-specific metrics
    const businessMetrics = {
      timestamp: new Date(),
      agentId: data.agentId,
      tenantId: data.tenantId,
      operationType: data.operation?.type,
      success: data.success,
      duration: data.duration,
      businessImpact: this.calculateBusinessImpact(data),
    };

    // Send to business metrics system
    // await this.businessMetricsService.record(businessMetrics);

    this.logger.debug(`Business metrics recorded for agent ${data.agentId}`);
  }

  private trackPerformanceMetrics(report: UnifiedSyncHealthReport): void {
    // Example: Track SLA compliance
    const slaCompliance = {
      errorRateCompliance: report.syncPerformance.errorRate < 0.01, // 1% SLA
      latencyCompliance: report.syncPerformance.avgLatency < 2000, // 2s SLA
      availabilityCompliance: report.systemOverview.health !== 'critical',
    };

    // Record SLA metrics
    // await this.slaTrackingService.recordCompliance(slaCompliance);

    this.logger.debug(`SLA compliance tracked: ${JSON.stringify(slaCompliance)}`);
  }

  private setupCustomAlerts(): void {
    // Example: Business-specific alert thresholds
    const customConfig = {
      realTimeInterval: 15, // 15 seconds for high-frequency monitoring
      alertThresholds: {
        errorRate: 0.005, // 0.5% for strict business requirements
        latency: 1500, // 1.5s for premium service tiers
        conflictRate: 0.01, // 1% conflict rate threshold
        escalationRate: 0.005, // 0.5% escalation rate threshold
      },
    };

    this.healthReporting.updateConfig(customConfig);
    this.logger.log('Custom alert thresholds configured');
  }

  private calculateBusinessImpact(data: any): string {
    // Example: Calculate business impact based on operation type and tenant
    if (data.tenantId?.includes('premium')) {
      return data.success ? 'low' : 'high';
    }
    return data.success ? 'none' : 'medium';
  }
}

/**
 * Example 3: Dashboard and Visualization Integration
 */
@Injectable()
export class DashboardVisualizationExample {
  private readonly logger = new Logger(DashboardVisualizationExample.name);

  constructor(
    private readonly dashboardIntegration: SyncHealthDashboardIntegration,
    private readonly healthReporting: UnifiedSyncHealthReporting
  ) {}

  async setupDashboardIntegration(): Promise<void> {
    this.logger.log('Setting up dashboard and visualization integration...');

    // Example: Custom dashboard widgets
    this.setupCustomWidgets();

    // Example: Real-time data streaming
    this.setupRealTimeStreaming();

    // Example: Historical data visualization
    this.setupHistoricalVisualization();

    this.logger.log('Dashboard integration setup complete');
  }

  private setupCustomWidgets(): void {
    // Example: Add custom business metrics widget
    this.dashboardIntegration.updateWidgetConfig('business_metrics', {
      id: 'business_metrics',
      type: 'chart',
      title: 'Business Impact Metrics',
      config: {
        metric: 'business_impact',
        chartType: 'line',
        timeRange: 240, // 4 hours
        refreshInterval: 60,
        thresholds: [
          { value: 0.1, color: '#f59e0b', label: 'Medium Impact' },
          { value: 0.25, color: '#ef4444', label: 'High Impact' },
        ],
      },
      position: { x: 0, y: 7, width: 6, height: 3 },
    });

    // Example: Add tenant-specific health widget
    this.dashboardIntegration.updateWidgetConfig('tenant_health', {
      id: 'tenant_health',
      type: 'status',
      title: 'Tenant Health Overview',
      config: {
        metric: 'tenant_health',
        refreshInterval: 30,
      },
      position: { x: 6, y: 7, width: 6, height: 3 },
    });

    this.logger.log('Custom dashboard widgets configured');
  }

  private setupRealTimeStreaming(): void {
    // Example: Stream real-time data to external dashboards
    this.dashboardIntegration.on('sync_health_dashboard_updated', (data) => {
      this.streamToExternalDashboard(data);
    });

    this.logger.log('Real-time streaming configured');
  }

  private setupHistoricalVisualization(): void {
    // Example: Generate historical reports for visualization
    setInterval(
      async () => {
        const historicalReport = await this.healthReporting.generateOnDemandReport('hourly');
        await this.storeHistoricalData(historicalReport);
      },
      60 * 60 * 1000
    ); // Every hour

    this.logger.log('Historical visualization configured');
  }

  private streamToExternalDashboard(data: any): void {
    // Example: Stream to Grafana, DataDog, or other visualization tools
    const streamData = {
      timestamp: data.timestamp,
      systemHealth: data.systemHealth,
      errorRate: data.syncMetrics.errorRate,
      avgLatency: data.syncMetrics.avgLatency,
      agentCount: data.agentMetrics.total,
      activeEscalations: data.escalations.active,
    };

    // Send to external system
    // await this.externalDashboardService.stream(streamData);

    this.logger.debug('Data streamed to external dashboard');
  }

  private async storeHistoricalData(report: UnifiedSyncHealthReport): Promise<void> {
    // Example: Store in time-series database for historical analysis
    const historicalData = {
      timestamp: report.timestamp,
      reportType: report.reportType,
      systemHealth: report.systemOverview.health,
      metrics: {
        errorRate: report.syncPerformance.errorRate,
        avgLatency: report.syncPerformance.avgLatency,
        throughput: report.syncPerformance.throughputPerMinute,
        conflictRate: report.conflictMetrics.conflictRate,
      },
      trends: report.trends,
    };

    // Store in time-series database
    // await this.timeSeriesDatabase.insert('sync_health_history', historicalData);

    this.logger.debug('Historical data stored');
  }
}

/**
 * Example 4: Automated Recovery and Self-Healing
 */
@Injectable()
export class AutomatedRecoveryExample {
  private readonly logger = new Logger(AutomatedRecoveryExample.name);

  constructor(private readonly syncHealthService: SyncAwareHeartbeatMonitoringService) {}

  async setupAutomatedRecovery(): Promise<void> {
    this.logger.log('Setting up automated recovery and self-healing...');

    // Listen to recovery events
    this.syncHealthService.on('sync_recovery_required', (data) => {
      this.handleSyncRecovery(data);
    });

    this.syncHealthService.on('conflict_resolution_required', (data) => {
      this.handleConflictResolution(data);
    });

    this.syncHealthService.on('manual_intervention_required', (data) => {
      this.handleManualIntervention(data);
    });

    this.logger.log('Automated recovery setup complete');
  }

  private async handleSyncRecovery(data: any): Promise<void> {
    this.logger.log(`Initiating automated sync recovery for agent ${data.agentId}`);

    try {
      // Example: Automated recovery actions
      for (const action of data.recoveryActions) {
        switch (action) {
          case 'restart_sync_operations':
            await this.restartSyncOperations(data.agentId);
            break;
          case 'clear_sync_queue':
            await this.clearSyncQueue(data.agentId);
            break;
          case 'reinitialize_file_watchers':
            await this.reinitializeFileWatchers(data.agentId);
            break;
        }
      }

      this.logger.log(`Automated sync recovery completed for agent ${data.agentId}`);
    } catch (error) {
      this.logger.error(`Automated sync recovery failed for agent ${data.agentId}:`, error);
      // Escalate to manual intervention
      this.escalateToManualIntervention(data.agentId, error);
    }
  }

  private async handleConflictResolution(data: any): Promise<void> {
    this.logger.log(`Initiating automated conflict resolution for agent ${data.agentId}`);

    try {
      // Example: Automated conflict resolution
      switch (data.resolutionStrategy) {
        case 'automated_merge':
          await this.performAutomatedMerge(data.agentId, data.syncContext);
          break;
        case 'latest_wins':
          await this.applyLatestWinsStrategy(data.agentId, data.syncContext);
          break;
        case 'backup_and_retry':
          await this.backupAndRetry(data.agentId, data.syncContext);
          break;
      }

      this.logger.log(`Automated conflict resolution completed for agent ${data.agentId}`);
    } catch (error) {
      this.logger.error(`Automated conflict resolution failed for agent ${data.agentId}:`, error);
      this.escalateToManualIntervention(data.agentId, error);
    }
  }

  private async handleManualIntervention(data: any): Promise<void> {
    this.logger.warn(`Manual intervention required for agent ${data.agentId}`);

    // Example: Create support ticket or notification
    const interventionRequest = {
      agentId: data.agentId,
      tenantId: data.tenantId,
      urgency: data.urgency,
      alert: data.alert,
      recommendedActions: data.recommendedActions,
      timestamp: new Date(),
    };

    // Send to support system
    // await this.supportTicketService.createTicket(interventionRequest);

    // Send immediate notification to on-call engineer
    // await this.notificationService.sendUrgentAlert(interventionRequest);

    this.logger.log(`Manual intervention request created for agent ${data.agentId}`);
  }

  // Example recovery methods
  private async restartSyncOperations(agentId: string): Promise<void> {
    this.logger.log(`Restarting sync operations for agent ${agentId}`);
    // Implementation would restart sync processes
  }

  private async clearSyncQueue(agentId: string): Promise<void> {
    this.logger.log(`Clearing sync queue for agent ${agentId}`);
    // Implementation would clear pending sync operations
  }

  private async reinitializeFileWatchers(agentId: string): Promise<void> {
    this.logger.log(`Reinitializing file watchers for agent ${agentId}`);
    // Implementation would restart file system watchers
  }

  private async performAutomatedMerge(agentId: string, syncContext: any): Promise<void> {
    this.logger.log(`Performing automated merge for agent ${agentId}`);
    // Implementation would attempt automated conflict resolution
  }

  private async applyLatestWinsStrategy(agentId: string, syncContext: any): Promise<void> {
    this.logger.log(`Applying latest-wins strategy for agent ${agentId}`);
    // Implementation would resolve conflicts by using latest version
  }

  private async backupAndRetry(agentId: string, syncContext: any): Promise<void> {
    this.logger.log(`Backing up and retrying for agent ${agentId}`);
    // Implementation would backup current state and retry operation
  }

  private async escalateToManualIntervention(agentId: string, error: any): Promise<void> {
    this.logger.error(`Escalating to manual intervention for agent ${agentId}:`, error);
    // Implementation would create high-priority support ticket
  }
}

/**
 * Example 5: Complete Module Configuration
 */
@Module({
  providers: [
    // Core monitoring services
    SyncAwareHeartbeatMonitoringService,
    SyncHealthDashboardIntegration,
    UnifiedSyncHealthReporting,

    // Example services
    BasicSyncMonitoringExample,
    CustomMetricsIntegrationExample,
    DashboardVisualizationExample,
    AutomatedRecoveryExample,

    // Dependencies (these would be imported from other modules in real usage)
    {
      provide: HeartbeatMonitoringService,
      useClass: HeartbeatMonitoringService,
    },
    {
      provide: MasterClockService,
      useClass: MasterClockService,
    },
    {
      provide: SyncOrchestrator,
      useClass: SyncOrchestrator,
    },
    {
      provide: ConflictManager,
      useClass: ConflictManager,
    },
    {
      provide: SyncDashboardService,
      useClass: SyncDashboardService,
    },
    {
      provide: DashboardMonitoringIntegration,
      useClass: DashboardMonitoringIntegration,
    },
  ],
  exports: [
    SyncAwareHeartbeatMonitoringService,
    SyncHealthDashboardIntegration,
    UnifiedSyncHealthReporting,
  ],
})
export class SyncAwareMonitoringModule {}

/**
 * Example usage in application startup
 */
export async function initializeSyncAwareMonitoring(
  basicExample: BasicSyncMonitoringExample,
  metricsExample: CustomMetricsIntegrationExample,
  dashboardExample: DashboardVisualizationExample,
  recoveryExample: AutomatedRecoveryExample
): Promise<void> {
  console.log('Initializing Sync-Aware Monitoring System...');

  // Setup all monitoring components
  await basicExample.setupBasicMonitoring();
  await metricsExample.setupCustomMetricsIntegration();
  await dashboardExample.setupDashboardIntegration();
  await recoveryExample.setupAutomatedRecovery();

  console.log('Sync-Aware Monitoring System initialized successfully!');
  console.log('');
  console.log('Features enabled:');
  console.log('- Sync-aware heartbeat monitoring with health metrics');
  console.log('- Real-time dashboard integration with existing monitoring');
  console.log('- Unified health reporting with MetricsService integration');
  console.log('- Automated escalation procedures for sync issues');
  console.log('- Custom business metrics and SLA tracking');
  console.log('- Self-healing and automated recovery mechanisms');
  console.log('');
  console.log('The system is now monitoring sync health across all agents and tenants.');
}
