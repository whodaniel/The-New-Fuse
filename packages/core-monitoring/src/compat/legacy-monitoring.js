'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.SecurityLoggingService =
  exports.SystemHealthService =
  exports.ErrorTrackingService =
  exports.PerformanceMonitoringService =
  exports.AlertService =
  exports.MetricsCollector =
  exports.MonitoringService =
    void 0;
async function resolveProviderValue(provider = undefined, fallback) {
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
class MonitoringService {
  deps;
  constructor(deps = {}) {
    this.deps = deps;
  }
  async healthCheck() {
    const healthCheckService = this.deps.healthCheckService;
    if (!healthCheckService) {
      return { status: 'ok' };
    }
    const status = await healthCheckService.check();
    return { status: status.status };
  }
}
exports.MonitoringService = MonitoringService;
/**
 * Compatibility wrapper for legacy metrics collection entrypoint.
 */
class MetricsCollector {
  deps;
  constructor(deps = {}) {
    this.deps = deps;
  }
  async getMetrics() {
    return resolveProviderValue(this.deps.metricsProvider, {});
  }
}
exports.MetricsCollector = MetricsCollector;
/**
 * Compatibility wrapper for legacy alert access.
 */
class AlertService {
  deps;
  constructor(deps = {}) {
    this.deps = deps;
  }
  async getAlerts() {
    return this.deps.alertManager?.getActiveAlerts() ?? [];
  }
}
exports.AlertService = AlertService;
/**
 * Compatibility wrapper for legacy dashboard stats retrieval.
 */
class PerformanceMonitoringService {
  deps;
  constructor(deps = {}) {
    this.deps = deps;
  }
  async getPerformanceStats() {
    const dashboard = this.deps.performanceDashboard;
    return dashboard ? dashboard.getSummary() : {};
  }
}
exports.PerformanceMonitoringService = PerformanceMonitoringService;
/**
 * Compatibility wrapper for legacy error reporting entrypoint.
 */
class ErrorTrackingService {
  deps;
  constructor(deps = {}) {
    this.deps = deps;
  }
  async getErrorStats() {
    return resolveProviderValue(this.deps.errorStatsProvider, {});
  }
}
exports.ErrorTrackingService = ErrorTrackingService;
/**
 * Compatibility wrapper for legacy health payload entrypoint.
 */
class SystemHealthService {
  deps;
  constructor(deps = {}) {
    this.deps = deps;
  }
  async getHealth() {
    const healthCheckService = this.deps.healthCheckService;
    return healthCheckService ? healthCheckService.check() : {};
  }
}
exports.SystemHealthService = SystemHealthService;
/**
 * Compatibility wrapper for legacy security log retrieval.
 */
class SecurityLoggingService {
  deps;
  constructor(deps = {}) {
    this.deps = deps;
  }
  async getSecurityLogs() {
    return resolveProviderValue(this.deps.securityLogsProvider, []);
  }
}
exports.SecurityLoggingService = SecurityLoggingService;
//# sourceMappingURL=legacy-monitoring.js.map
