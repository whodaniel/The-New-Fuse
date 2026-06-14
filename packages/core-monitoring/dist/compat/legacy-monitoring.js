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
export class MonitoringService {
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
/**
 * Compatibility wrapper for legacy metrics collection entrypoint.
 */
export class MetricsCollector {
    constructor(deps = {}) {
        this.deps = deps;
    }
    async getMetrics() {
        return resolveProviderValue(this.deps.metricsProvider, {});
    }
}
/**
 * Compatibility wrapper for legacy alert access.
 */
export class AlertService {
    constructor(deps = {}) {
        this.deps = deps;
    }
    async getAlerts() {
        return this.deps.alertManager?.getActiveAlerts() ?? [];
    }
}
/**
 * Compatibility wrapper for legacy dashboard stats retrieval.
 */
export class PerformanceMonitoringService {
    constructor(deps = {}) {
        this.deps = deps;
    }
    async getPerformanceStats() {
        const dashboard = this.deps.performanceDashboard;
        return dashboard ? dashboard.getSummary() : {};
    }
}
/**
 * Compatibility wrapper for legacy error reporting entrypoint.
 */
export class ErrorTrackingService {
    constructor(deps = {}) {
        this.deps = deps;
    }
    async getErrorStats() {
        return resolveProviderValue(this.deps.errorStatsProvider, {});
    }
}
/**
 * Compatibility wrapper for legacy health payload entrypoint.
 */
export class SystemHealthService {
    constructor(deps = {}) {
        this.deps = deps;
    }
    async getHealth() {
        const healthCheckService = this.deps.healthCheckService;
        return healthCheckService ? healthCheckService.check() : {};
    }
}
/**
 * Compatibility wrapper for legacy security log retrieval.
 */
export class SecurityLoggingService {
    constructor(deps = {}) {
        this.deps = deps;
    }
    async getSecurityLogs() {
        return resolveProviderValue(this.deps.securityLogsProvider, []);
    }
}
//# sourceMappingURL=legacy-monitoring.js.map