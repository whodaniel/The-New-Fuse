/**
 * Core monitoring system exports
 */
export * from './interfaces/IMonitoring.js';
export * from './base/BaseMetricsCollector.js';
export * from './base/BaseMonitoringSystem.js';
export * from './utils/Logger.js';
export * from './sentry/sentry-config.js';
export * from './sentry/sentry-integrations.js';
export { WinstonLogger, createLogger, type LoggerConfig } from './logging/winston-logger.js';
export * from './metrics/prometheus-metrics.js';
export { HealthCheckService, type HealthCheckFunction, type HealthCheckResult, type ServiceHealth, type SystemHealthStatus, } from './health/health-check.js';
export { AlertManager, defaultAlertRules, type AlertManagerConfig, type AlertSeverity, type AlertStatus, type ComparisonOperator, } from './alerts/alert-manager.js';
export * from './performance/index.js';
export { PerformanceDashboard, performanceDashboard, type BackendMetrics, type DashboardMetrics, type DatabaseMetrics, type FrontendMetrics, type InfrastructureMetrics, type MetricValue, type PerformanceAlert, } from './dashboards/performance-dashboard.js';
export * from './nestjs/health.controller.js';
export * from './nestjs/metrics.controller.js';
export * from './nestjs/monitoring.interceptor.js';
export * from './nestjs/monitoring.module.js';
export * from './compat/legacy-monitoring.js';
//# sourceMappingURL=index.d.ts.map