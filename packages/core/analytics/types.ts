import { DashboardPerformanceMetrics as DashboardPerformanceMetricsType } from '../../features/dashboard/analytics/types.tsx';

// Re-export types from dashboard analytics
export type { UserAction, DashboardMetrics, UserMetrics } from '../../features/dashboard/analytics/types.tsx';

// Alias DashboardPerformanceMetrics as PerformanceMetrics for backward compatibility
export type PerformanceMetrics = DashboardPerformanceMetricsType;