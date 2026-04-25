/**
 * Dashboard Integration Module
 *
 * This module provides real-time sync updates for user control panels,
 * integrating with existing AdminDashboard and AgentWebSocketService.
 */

// Core dashboard service
export { SyncDashboardService } from './SyncDashboardService';
export type {
  DashboardUpdate,
  DashboardUpdateType,
  IAgentWebSocketService,
  IMonitoringService,
  SyncDashboardConfig,
  SystemAlert,
} from './SyncDashboardService';

// React integration
export {
  useFilteredAlerts,
  useHealthScore,
  useRecentOperations,
  useSyncDashboard,
} from './useSyncDashboard';
export type {
  DashboardData,
  SyncHealth,
  SyncMetrics,
  SyncOperation,
  UseSyncDashboardConfig,
  UseSyncDashboardReturn,
} from './useSyncDashboard';

// Enhanced dashboard component
export { SyncAwareAdminDashboard } from './SyncAwareAdminDashboard';
export type { SyncAwareAdminDashboardProps } from './SyncAwareAdminDashboard';

// WebSocket integration
export { DashboardWebSocketIntegration } from './DashboardWebSocketIntegration';

// Monitoring integration
export { DashboardMonitoringIntegration } from './DashboardMonitoringIntegration';
export type {
  AlertThreshold,
  IExistingHeartbeatService,
  IExistingMetricsService,
  IExistingMonitoringService,
  MonitoringEvent,
  MonitoringEventType,
} from './DashboardMonitoringIntegration';

// Re-export types from other modules for convenience
export type {
  SyncHealth as CoreSyncHealth,
  SyncMetrics as CoreSyncMetrics,
  SyncOperation as CoreSyncOperation,
  SystemAlert as CoreSystemAlert,
} from '../types';
