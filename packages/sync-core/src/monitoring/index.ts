/**
 * Sync-Aware Monitoring Module
 * 
 * Extends existing HeartbeatMonitoringService with sync health metrics,
 * dashboard integration, and unified health reporting using existing MetricsService
 */

// Core sync-aware monitoring service
export { SyncAwareHeartbeatMonitoringService } from './SyncAwareHeartbeatMonitoringService';
export type {
  SyncHealthMetrics,
  SyncAwareAgentHeartbeat,
  SyncAwareStagnationAlert,
  SyncHealthEscalation
} from './SyncAwareHeartbeatMonitoringService';

// Dashboard integration
export { SyncHealthDashboardIntegration } from './SyncHealthDashboardIntegration';
export type {
  SyncHealthDashboardData,
  SyncHealthAlert,
  SyncHealthWidget
} from './SyncHealthDashboardIntegration';

// Unified health reporting
export { UnifiedSyncHealthReporting } from './UnifiedSyncHealthReporting';
export type {
  UnifiedSyncHealthReport,
  HealthReportConfig,
  IExistingMetricsService
} from './UnifiedSyncHealthReporting';

// Re-export types from dashboard monitoring integration for convenience
export type {
  IExistingMonitoringService,
  IExistingMetricsService as IDashboardMetricsService,
  IExistingHeartbeatService,
  MonitoringEventType,
  MonitoringEvent,
  AlertThreshold
} from '../dashboard/DashboardMonitoringIntegration';