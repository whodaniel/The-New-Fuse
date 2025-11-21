/**
 * Core monitoring system exports
 */

// Interfaces
export * from './interfaces/IMonitoring.js';

// Base classes
export * from './base/BaseMetricsCollector.js';
export * from './base/BaseMonitoringSystem.js';

// Utils
// Re-export simple logger (includes LogEntry/LogLevel)
export * from './utils/Logger.js';

// Sentry
export * from './sentry/sentry-config.js';
export * from './sentry/sentry-integrations.js';

// Logging
// Avoid duplicate type names with Logger.ts by exporting only specific members
export { WinstonLogger, createLogger, type LoggerConfig } from './logging/winston-logger.js';

// Metrics
export * from './metrics/prometheus-metrics.js';

// Health checks
// Avoid duplicate HealthStatus name (already exported by IMonitoring)
export {
  HealthCheckService,
  type HealthCheckResult,
  type ServiceHealth,
  type SystemHealthStatus,
  type HealthCheckFunction,
} from './health/health-check.js';

// Alerts
// Avoid duplicate Alert/AlertRule types (IMonitoring already exports them)
export {
  AlertManager,
  defaultAlertRules,
  type AlertManagerConfig,
  type AlertSeverity,
  type AlertStatus,
  type ComparisonOperator,
} from './alerts/alert-manager.js';

// Performance monitoring
export * from './performance/index.js';

// Dashboards
// Avoid duplicate QueryPattern type by exporting explicit members
export {
  PerformanceDashboard,
  performanceDashboard,
  type BackendMetrics,
  type DashboardMetrics,
  type DatabaseMetrics,
  type FrontendMetrics,
  type InfrastructureMetrics,
  type MetricValue,
  type PerformanceAlert,
} from './dashboards/performance-dashboard.js';

// NestJS integrations
export * from './nestjs/health.controller.js';
export * from './nestjs/metrics.controller.js';
export * from './nestjs/monitoring.interceptor.js';
export * from './nestjs/monitoring.module.js';
