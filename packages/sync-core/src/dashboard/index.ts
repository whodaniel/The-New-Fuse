/**
 * Dashboard Integration Module
 * 
 * This module provides real-time sync updates for user control panels,
 * integrating with existing AdminDashboard and AgentWebSocketService.
 */

// Core dashboard service
export { SyncDashboardService } from './SyncDashboardService.js';
export type { 
  IAgentWebSocketService,
  IMonitoringService,
  SystemAlert,
  DashboardUpdateType,
  DashboardUpdate,
  SyncDashboardConfig
} from './SyncDashboardService.js';

// React integration
export { useSyncDashboard } from './useSyncDashboard.js';
export { useFilteredAlerts, useRecentOperations, useHealthScore } from './useSyncDashboard.js';
export type {
  UseSyncDashboardConfig,
  UseSyncDashboardReturn,
  DashboardData,
  SyncMetrics,
  SyncHealth,
  SyncOperation
} from './useSyncDashboard.js';

// Enhanced dashboard component
export { SyncAwareAdminDashboard } from './SyncAwareAdminDashboard.js';
export type { SyncAwareAdminDashboardProps } from './SyncAwareAdminDashboard.js';

// WebSocket integration
export { DashboardWebSocketIntegration } from './DashboardWebSocketIntegration.js';

// Monitoring integration
export { DashboardMonitoringIntegration } from './DashboardMonitoringIntegration.js';
export type {
  IExistingMonitoringService,
  IExistingMetricsService,
  IExistingHeartbeatService,
  MonitoringEventType,
  MonitoringEvent,
  AlertThreshold
} from './DashboardMonitoringIntegration.js';

// Re-export types from other modules for convenience
export type {
  SyncMetrics as CoreSyncMetrics,
  SyncHealth as CoreSyncHealth,
  SyncOperation as CoreSyncOperation,
  SystemAlert as CoreSystemAlert
} from '../types/index.js';