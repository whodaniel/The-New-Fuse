/**
 * MCP Monitoring System Exports
 */

// New unified monitoring system (recommended)
export { MCPMonitoringSystem } from './MCPMonitoringSystem';
export { MCPMetricsCollector } from './MCPMetricsCollector';

// Legacy monitoring system (deprecated - use MCPMonitoringSystem instead)
export { MonitoringSystem } from './MonitoringSystem';

// Core monitoring components
export { MetricsCollector } from './MetricsCollector';
export { AlertManager } from './AlertManager';
export { DashboardManager } from './DashboardManager';
export { PerformanceMonitor } from './PerformanceMonitor';
export { LoadTester } from './LoadTester';
export { CacheMonitor } from './CacheMonitor';
export { ConnectionPoolMonitor } from './ConnectionPoolMonitor';
export { SystemHealthMonitor } from './SystemHealthMonitor';

// Re-export interfaces
export type {
  IMonitoringSystem,
  IMetricsCollector,
  IAlertManager,
  IDashboardManager,
  IPerformanceMonitor,
  ILoadTester,
  ICacheMonitor,
  IConnectionPoolMonitor,
  ISystemHealthMonitor,
  AlertRule,
  PerformanceReport,
  SystemHealthStatus,
  HealthCheck,
  HealthCheckResult
} from '../interfaces/IMonitoring';

// Re-export types
export type {
  PerformanceMetrics,
  Alert,
  AlertSeverity,
  AlertStatus,
  TimeSeries,
  MetricDataPoint,
  DashboardConfig,
  DashboardPanel,
  MonitoringConfig,
  LoadTestConfig,
  LoadTestResult,
  CacheMetrics,
  ConnectionPoolMetrics
} from '../types/monitoring';