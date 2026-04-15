/**
 * Dashboard Integration Module
 * 
 * This module provides real-time sync updates for user control panels,
 * integrating with existing AdminDashboard and AgentWebSocketService.
 */

// Core dashboard service
export { SyncDashboardService } from './SyncDashboardService';
export type { 
  IAgentWebSocketService,
  IMonitoringService,
  SystemAlert,
  DashboardUpdateType,
  DashboardUpdate,
  SyncDashboardConfig
} from './SyncDashboardService';

// React integration
export { useSyncDashboard } from './useSyncDashboard';
export { useFilteredAlerts, useRecentOperations, useHealthScore } from './useSyncDashboard';
export type {
  UseSyncDashboardConfig,
  UseSyncDashboardReturn,
  DashboardData,
  SyncMetrics,
  SyncHealth,
  SyncOperation
} from './useSyncDashboard';

// Enhanced dashboard component
export { SyncAwareAdminDashboard } from './SyncAwareAdminDashboard';
export type { SyncAwareAdminDashboardProps } from './SyncAwareAdminDashboard';

// WebSocket integration
export { DashboardWebSocketIntegration } from './DashboardWebSocketIntegration';

// Monitoring integration
export { DashboardMonitoringIntegration } from './DashboardMonitoringIntegration';
export type {
  IExistingMonitoringService,
  IExistingMetricsService,
  IExistingHeartbeatService,
  MonitoringEventType,
  MonitoringEvent,
  AlertThreshold
} from './DashboardMonitoringIntegration';

// Re-export types from other modules for convenience
export type {
  SyncMetrics as CoreSyncMetrics,
  SyncHealth as CoreSyncHealth,
  SyncOperation as CoreSyncOperation,
  SystemAlert as CoreSystemAlert
} from '../types';