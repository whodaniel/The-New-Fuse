/**
 * Core monitoring system exports
 */

// Interfaces
export * from './interfaces/IMonitoring';

// Base classes
export * from './base/BaseMetricsCollector';
export * from './base/BaseMonitoringSystem';

// Utils
// Re-export simple logger (includes LogEntry/LogLevel)
export * from './utils/Logger';

// Sentry
export * from './sentry/sentry-config';
export * from './sentry/sentry-integrations';

// Logging
// Avoid duplicate type names with Logger.ts by exporting only specific members
export { WinstonLogger, createLogger, type LoggerConfig } from './logging/winston-logger';

// Metrics
export * from './metrics/prometheus-metrics';

// Health checks
// Avoid duplicate HealthStatus name (already exported by IMonitoring)
export {
  HealthCheckService,
  type HealthCheckResult,
  type ServiceHealth,
  type SystemHealthStatus,
  type HealthCheckFunction,
} from './health/health-check';

// Alerts
// Avoid duplicate Alert/AlertRule types (IMonitoring already exports them)
export {
  AlertManager,
  defaultAlertRules,
  type AlertManagerConfig,
  type AlertSeverity,
  type AlertStatus,
  type ComparisonOperator,
} from './alerts/alert-manager';

// Performance monitoring
export * from './performance/index';

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
} from './dashboards/performance-dashboard';

// NestJS integrations
export * from './nestjs/health.controller';
export * from './nestjs/metrics.controller';
export * from './nestjs/monitoring.interceptor';
export * from './nestjs/monitoring.module';
