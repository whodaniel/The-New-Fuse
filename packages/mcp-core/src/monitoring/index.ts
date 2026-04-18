/**
 * MCP Monitoring System Exports
 */

// New unified monitoring system (recommended)
export { MCPMonitoringSystem } from './MCPMonitoringSystem.js';
export { MCPMetricsCollector } from './MCPMetricsCollector.js';

// Legacy monitoring system (deprecated - use MCPMonitoringSystem instead)
export { MonitoringSystem } from './MonitoringSystem.js';

// Core monitoring components
export { MetricsCollector } from './MetricsCollector.js';
export { AlertManager } from './AlertManager.js';
export { DashboardManager } from './DashboardManager.js';
export { PerformanceMonitor } from './PerformanceMonitor.js';
export { LoadTester } from './LoadTester.js';
export { CacheMonitor } from './CacheMonitor.js';
export { ConnectionPoolMonitor } from './ConnectionPoolMonitor.js';
export { SystemHealthMonitor } from './SystemHealthMonitor.js';

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
} from '../interfaces/IMonitoring.js';

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
} from '../types/monitoring.js';