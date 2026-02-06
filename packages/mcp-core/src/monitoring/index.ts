/**
 * MCP Monitoring System Exports
 */

// New unified monitoring system (recommended)
export { MCPMetricsCollector } from './MCPMetricsCollector';
export { MCPMonitoringSystem } from './MCPMonitoringSystem';

// Legacy monitoring system (deprecated - use MCPMonitoringSystem instead)
export { MonitoringSystem } from './MonitoringSystem';

// Core monitoring components
export { AlertManager } from './AlertManager';
export { CacheMonitor } from './CacheMonitor';
export { ConnectionPoolMonitor } from './ConnectionPoolMonitor';
export { DashboardManager } from './DashboardManager';
export { LoadTester } from './LoadTester';
export { MetricsCollector } from './MetricsCollector';
export { PerformanceMonitor } from './PerformanceMonitor';
export { SystemHealthMonitor } from './SystemHealthMonitor';

// Re-export interfaces
export type {
  AlertRule,
  HealthCheck,
  HealthCheckResult,
  IAlertManager,
  ICacheMonitor,
  IConnectionPoolMonitor,
  IDashboardManager,
  ILoadTester,
  IMetricsCollector,
  IMonitoringSystem,
  IPerformanceMonitor,
  ISystemHealthMonitor,
  PerformanceReport,
  SystemHealthStatus,
} from '../interfaces/IMonitoring';

// Re-export types
export type {
  Alert,
  AlertSeverity,
  AlertStatus,
  CacheMetrics,
  ConnectionPoolMetrics,
  DashboardConfig,
  DashboardPanel,
  LoadTestConfig,
  LoadTestResult,
  MetricDataPoint,
  MonitoringConfig,
  PerformanceMetrics,
  TimeSeries,
} from '../types/monitoring';
