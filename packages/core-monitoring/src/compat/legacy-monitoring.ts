import { AlertManager, type Alert } from '../alerts/alert-manager.js';
import { HealthCheckService, type SystemHealthStatus } from '../health/health-check.js';
import { PerformanceDashboard } from '../dashboards/performance-dashboard.js';

type MetricsProvider = () => Promise<Record<string, number>> | Record<string, number>;
type ErrorStatsProvider = () => Promise<Record<string, unknown>> | Record<string, unknown>;
type SecurityLogsProvider = () => Promise<Record<string, unknown>[]> | Record<string, unknown>[];

export interface LegacyMonitoringDependencies {
  alertManager?: AlertManager;
  healthCheckService?: HealthCheckService;
  performanceDashboard?: PerformanceDashboard;
  metricsProvider?: MetricsProvider;
  errorStatsProvider?: ErrorStatsProvider;
  securityLogsProvider?: SecurityLogsProvider;
}

async function resolveProviderValue<T>(provider: (() => Promise<T> | T) | undefined = undefined, fallback: T): Promise<T> {
  if (!provider) {
    return fallback;
  }

  const result = provider();
  return result instanceof Promise ? result : result;
}

/**
 * Backward-compatible facade retained from the legacy monitoring package.
 * It now delegates to the consolidated core-monitoring primitives.
 */
export class MonitoringService {
  constructor(private readonly deps: LegacyMonitoringDependencies = {}) {}

  async healthCheck(): Promise<{ status: string }> {
    const healthCheckService = this.deps.healthCheckService;
    if (!healthCheckService) {
      return { status: 'ok' };
    }

    const status = await healthCheckService.check();
    return { status: status.status };
  }
}

/**
 * Compatibility wrapper for legacy metrics collection entrypoint.
 */
export class MetricsCollector {
  constructor(private readonly deps: LegacyMonitoringDependencies = {}) {}

  async getMetrics(): Promise<Record<string, number>> {
    return resolveProviderValue(this.deps.metricsProvider, {});
  }
}

/**
 * Compatibility wrapper for legacy alert access.
 */
export class AlertService {
  constructor(private readonly deps: LegacyMonitoringDependencies = {}) {}

  async getAlerts(): Promise<Alert[]> {
    return this.deps.alertManager?.getActiveAlerts() ?? [];
  }
}

/**
 * Compatibility wrapper for legacy dashboard stats retrieval.
 */
export class PerformanceMonitoringService {
  constructor(private readonly deps: LegacyMonitoringDependencies = {}) {}

  async getPerformanceStats(): Promise<ReturnType<PerformanceDashboard['getSummary']> | Record<string, never>> {
    const dashboard = this.deps.performanceDashboard;
    return dashboard ? dashboard.getSummary() : {};
  }
}

/**
 * Compatibility wrapper for legacy error reporting entrypoint.
 */
export class ErrorTrackingService {
  constructor(private readonly deps: LegacyMonitoringDependencies = {}) {}

  async getErrorStats(): Promise<Record<string, unknown>> {
    return resolveProviderValue(this.deps.errorStatsProvider, {});
  }
}

/**
 * Compatibility wrapper for legacy health payload entrypoint.
 */
export class SystemHealthService {
  constructor(private readonly deps: LegacyMonitoringDependencies = {}) {}

  async getHealth(): Promise<SystemHealthStatus | Record<string, never>> {
    const healthCheckService = this.deps.healthCheckService;
    return healthCheckService ? healthCheckService.check() : {};
  }
}

/**
 * Compatibility wrapper for legacy security log retrieval.
 */
export class SecurityLoggingService {
  constructor(private readonly deps: LegacyMonitoringDependencies = {}) {}

  async getSecurityLogs(): Promise<Record<string, unknown>[]> {
    return resolveProviderValue(this.deps.securityLogsProvider, []);
  }
}
