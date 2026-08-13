/**
 * Performance Dashboard
 * Real-time performance monitoring dashboard data provider
 */
export interface DashboardMetrics {
    timestamp: number;
    frontend: FrontendMetrics;
    backend: BackendMetrics;
    database: DatabaseMetrics;
    infrastructure: InfrastructureMetrics;
}
export interface FrontendMetrics {
    webVitals: {
        fcp: MetricValue;
        lcp: MetricValue;
        fid: MetricValue;
        cls: MetricValue;
        ttfb: MetricValue;
        inp: MetricValue;
    };
    bundleSize: {
        total: number;
        js: number;
        css: number;
        images: number;
    };
    loadTime: {
        total: number;
        domInteractive: number;
        domComplete: number;
    };
    resourceCount: {
        total: number;
        scripts: number;
        stylesheets: number;
        images: number;
    };
}
export interface BackendMetrics {
    requests: {
        total: number;
        successful: number;
        failed: number;
        rate: number;
    };
    latency: {
        avg: number;
        p50: number;
        p95: number;
        p99: number;
    };
    activeTransactions: number;
    errors: {
        total: number;
        rate: number;
    };
}
export interface DatabaseMetrics {
    queries: {
        total: number;
        slow: number;
        failed: number;
        avgDuration: number;
    };
    connectionPool: {
        total: number;
        active: number;
        idle: number;
        utilization: number;
    };
    topQueries: QueryPattern[];
}
export interface InfrastructureMetrics {
    cpu: {
        usage: number;
        cores: number;
    };
    memory: {
        used: number;
        total: number;
        utilization: number;
    };
    disk: {
        used: number;
        total: number;
        utilization: number;
    };
}
export interface MetricValue {
    current: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    trend: 'up' | 'down' | 'stable';
    change: number;
}
export interface QueryPattern {
    pattern: string;
    count: number;
    avgDuration: number;
}
export interface PerformanceAlert {
    id: string;
    severity: 'info' | 'warning' | 'critical';
    category: 'frontend' | 'backend' | 'database' | 'infrastructure';
    message: string;
    metric: string;
    value: number;
    threshold: number;
    timestamp: number;
}
export declare class PerformanceDashboard {
    private metricsHistory;
    private alerts;
    private maxHistorySize;
    /**
     * Add metrics to dashboard
     */
    addMetrics(metrics: DashboardMetrics): void;
    /**
     * Get current metrics
     */
    getCurrentMetrics(): DashboardMetrics | null;
    /**
     * Get metrics history
     */
    getMetricsHistory(duration?: number): DashboardMetrics[];
    /**
     * Get time series data for a metric
     */
    getTimeSeries(category: keyof DashboardMetrics, metric: string, duration?: number): Array<{
        timestamp: number;
        value: number;
    }>;
    /**
     * Get active alerts
     */
    getAlerts(severity?: PerformanceAlert['severity']): PerformanceAlert[];
    /**
     * Get performance summary
     */
    getSummary(): {
        overall: 'good' | 'degraded' | 'poor';
        frontend: 'good' | 'degraded' | 'poor';
        backend: 'good' | 'degraded' | 'poor';
        database: 'good' | 'degraded' | 'poor';
        criticalAlerts: number;
        warningAlerts: number;
    };
    /**
     * Check for performance alerts
     */
    private checkAlerts;
    /**
     * Check Web Vitals alerts
     */
    private checkWebVitalsAlerts;
    /**
     * Check backend alerts
     */
    private checkBackendAlerts;
    /**
     * Check database alerts
     */
    private checkDatabaseAlerts;
    /**
     * Check infrastructure alerts
     */
    private checkInfrastructureAlerts;
    /**
     * Add alert
     */
    private addAlert;
    /**
     * Evaluate frontend health
     */
    private evaluateFrontendHealth;
    /**
     * Evaluate backend health
     */
    private evaluateBackendHealth;
    /**
     * Evaluate database health
     */
    private evaluateDatabaseHealth;
    /**
     * Get worst health status
     */
    private getWorstHealth;
    /**
     * Get nested value from object
     */
    private getNestedValue;
    /**
     * Generate unique ID
     */
    private generateId;
}
export declare const performanceDashboard: PerformanceDashboard;
//# sourceMappingURL=performance-dashboard.d.ts.map