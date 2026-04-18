/**
 * Sync-Aware Monitoring Module
 * 
 * Extends existing HeartbeatMonitoringService with sync health metrics,
 * dashboard integration, and unified health reporting using existing MetricsService
 */

// Core sync-aware monitoring service
export { SyncAwareHeartbeatMonitoringService } from './SyncAwareHeartbeatMonitoringService.js';
export type {
  SyncHealthMetrics,
  SyncAwareAgentHeartbeat,
  SyncAwareStagnationAlert,
  SyncHealthEscalation
} from './SyncAwareHeartbeatMonitoringService.js';

// Dashboard integration
// Temporarily disabled due to Chakra UI v3 breaking changes
// export { SyncHealthDashboardIntegration } from './SyncHealthDashboardIntegration.js';
// export type {
//   SyncHealthDashboardData,
//   SyncHealthAlert,
//   SyncHealthWidget
// } from './SyncHealthDashboardIntegration.js';

// Unified health reporting
// Temporarily disabled (depends on SyncHealthDashboardIntegration)
// export { UnifiedSyncHealthReporting } from './UnifiedSyncHealthReporting.js';
// export type {
//   UnifiedSyncHealthReport,
//   HealthReportConfig,
//   IExistingMetricsService
// } from './UnifiedSyncHealthReporting.js';

// Re-export types from dashboard monitoring integration for convenience
// Temporarily disabled due to Chakra UI v3 breaking changes
// export type {
//   IExistingMonitoringService,
//   IExistingMetricsService as IDashboardMetricsService,
//   IExistingHeartbeatService,
//   MonitoringEventType,
//   MonitoringEvent,
//   AlertThreshold
// } from '../dashboard/DashboardMonitoringIntegration.js';