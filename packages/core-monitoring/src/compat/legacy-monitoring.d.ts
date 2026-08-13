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
/**
 * Backward-compatible facade retained from the legacy monitoring package.
 * It now delegates to the consolidated core-monitoring primitives.
 */
export declare class MonitoringService {
    private readonly deps;
    constructor(deps?: LegacyMonitoringDependencies);
    healthCheck(): Promise<{
        status: string;
    }>;
}
/**
 * Compatibility wrapper for legacy metrics collection entrypoint.
 */
export declare class MetricsCollector {
    private readonly deps;
    constructor(deps?: LegacyMonitoringDependencies);
    getMetrics(): Promise<Record<string, number>>;
}
/**
 * Compatibility wrapper for legacy alert access.
 */
export declare class AlertService {
    private readonly deps;
    constructor(deps?: LegacyMonitoringDependencies);
    getAlerts(): Promise<Alert[]>;
}
/**
 * Compatibility wrapper for legacy dashboard stats retrieval.
 */
export declare class PerformanceMonitoringService {
    private readonly deps;
    constructor(deps?: LegacyMonitoringDependencies);
    getPerformanceStats(): Promise<ReturnType<PerformanceDashboard['getSummary']> | Record<string, never>>;
}
/**
 * Compatibility wrapper for legacy error reporting entrypoint.
 */
export declare class ErrorTrackingService {
    private readonly deps;
    constructor(deps?: LegacyMonitoringDependencies);
    getErrorStats(): Promise<Record<string, unknown>>;
}
/**
 * Compatibility wrapper for legacy health payload entrypoint.
 */
export declare class SystemHealthService {
    private readonly deps;
    constructor(deps?: LegacyMonitoringDependencies);
    getHealth(): Promise<SystemHealthStatus | Record<string, never>>;
}
/**
 * Compatibility wrapper for legacy security log retrieval.
 */
export declare class SecurityLoggingService {
    private readonly deps;
    constructor(deps?: LegacyMonitoringDependencies);
    getSecurityLogs(): Promise<Record<string, unknown>[]>;
}
export {};
//# sourceMappingURL=legacy-monitoring.d.ts.map