/**
 * Monitoring and metrics type definitions
 */
/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
    /** Request metrics */
    requests: {
        /** Total requests processed */
        total: number;
        /** Successful requests */
        successful: number;
        /** Failed requests */
        failed: number;
        /** Requests per second */
        rps: number;
        /** Average response time (ms) */
        avgResponseTime: number;
        /** P95 response time (ms) */
        p95ResponseTime: number;
        /** P99 response time (ms) */
        p99ResponseTime: number;
    };
    /** Connection metrics */
    connections: {
        /** Active connections */
        active: number;
        /** Total connections established */
        total: number;
        /** Failed connections */
        failed: number;
        /** Average connection time (ms) */
        avgConnectionTime: number;
    };
    /** Resource metrics */
    resources: {
        /** Total resources registered */
        total: number;
        /** Resource access count */
        accessCount: number;
        /** Cache hit rate */
        cacheHitRate: number;
        /** Average resource read time (ms) */
        avgReadTime: number;
    };
    /** Tool metrics */
    tools: {
        /** Total tools registered */
        total: number;
        /** Tool execution count */
        executionCount: number;
        /** Average execution time (ms) */
        avgExecutionTime: number;
        /** Tool success rate */
        successRate: number;
    };
    /** System metrics */
    system: {
        /** Memory usage (bytes) */
        memoryUsage: number;
        /** CPU usage percentage */
        cpuUsage: number;
        /** Uptime (ms) */
        uptime: number;
        /** Health score (0-100) */
        healthScore: number;
    };
}
/**
 * Alert severity levels
 */
export declare enum AlertSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Alert status
 */
export declare enum AlertStatus {
    ACTIVE = "active",
    RESOLVED = "resolved",
    ACKNOWLEDGED = "acknowledged",
    SUPPRESSED = "suppressed"
}
/**
 * Alert interface
 */
export interface Alert {
    /** Alert ID */
    id: string;
    /** Alert name */
    name: string;
    /** Alert description */
    description: string;
    /** Alert severity */
    severity: AlertSeverity;
    /** Alert status */
    status: AlertStatus;
    /** Alert category */
    category: string;
    /** Alert source */
    source: string;
    /** Alert timestamp */
    timestamp: Date;
    /** Alert data */
    data?: Record<string, any>;
    /** Resolution timestamp */
    resolvedAt?: Date;
    /** Acknowledgment timestamp */
    acknowledgedAt?: Date;
    /** Acknowledgment user */
    acknowledgedBy?: string;
}
/**
 * Metric data point
 */
export interface MetricDataPoint {
    /** Timestamp */
    timestamp: Date;
    /** Metric value */
    value: number;
    /** Metric labels */
    labels?: Record<string, string>;
}
/**
 * Time series data
 */
export interface TimeSeries {
    /** Metric name */
    name: string;
    /** Data points */
    dataPoints: MetricDataPoint[];
    /** Metric metadata */
    metadata?: Record<string, any>;
}
/**
 * Dashboard configuration
 */
export interface DashboardConfig {
    /** Dashboard ID */
    id: string;
    /** Dashboard name */
    name: string;
    /** Dashboard description */
    description?: string;
    /** Dashboard panels */
    panels: DashboardPanel[];
    /** Refresh interval (ms) */
    refreshInterval: number;
    /** Auto-refresh enabled */
    autoRefresh: boolean;
}
/**
 * Dashboard panel
 */
export interface DashboardPanel {
    /** Panel ID */
    id: string;
    /** Panel title */
    title: string;
    /** Panel type */
    type: 'line' | 'bar' | 'gauge' | 'stat' | 'table' | 'heatmap';
    /** Panel position */
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /** Panel configuration */
    config: {
        /** Metrics to display */
        metrics: string[];
        /** Time range */
        timeRange: string;
        /** Thresholds */
        thresholds?: Array<{
            value: number;
            color: string;
            label?: string;
        }>;
        /** Display options */
        display?: Record<string, any>;
    };
}
/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
    /** Enable monitoring */
    enabled: boolean;
    /** Metrics collection interval (ms) */
    metricsInterval: number;
    /** Metrics retention period (ms) */
    retentionPeriod: number;
    /** Enable alerting */
    enableAlerting: boolean;
    /** Alert check interval (ms) */
    alertInterval: number;
    /** Enable dashboards */
    enableDashboards: boolean;
    /** Dashboard refresh interval (ms) */
    dashboardRefreshInterval: number;
    /** Storage configuration */
    storage: {
        /** Storage type */
        type: 'memory' | 'file' | 'database';
        /** Storage options */
        options?: Record<string, any>;
    };
    /** Export configuration */
    export?: {
        /** Enable Prometheus export */
        prometheus?: boolean;
        /** Prometheus port */
        prometheusPort?: number;
        /** Enable JSON export */
        json?: boolean;
        /** JSON export path */
        jsonPath?: string;
    };
}
/**
 * Load test configuration
 */
export interface LoadTestConfig {
    /** Test name */
    name: string;
    /** Test description */
    description?: string;
    /** Target endpoint */
    endpoint: string;
    /** Number of concurrent users */
    concurrency: number;
    /** Test duration (ms) */
    duration: number;
    /** Request rate (requests per second) */
    requestRate?: number;
    /** Request configuration */
    request: {
        /** Request method */
        method: string;
        /** Request parameters */
        params?: any;
        /** Request headers */
        headers?: Record<string, string>;
    };
    /** Performance thresholds */
    thresholds: {
        /** Maximum average response time (ms) */
        maxAvgResponseTime: number;
        /** Maximum P95 response time (ms) */
        maxP95ResponseTime: number;
        /** Minimum success rate */
        minSuccessRate: number;
        /** Maximum error rate */
        maxErrorRate: number;
    };
}
/**
 * Load test result
 */
export interface LoadTestResult {
    /** Test configuration */
    config: LoadTestConfig;
    /** Test start time */
    startTime: Date;
    /** Test end time */
    endTime: Date;
    /** Test duration (ms) */
    duration: number;
    /** Total requests sent */
    totalRequests: number;
    /** Successful requests */
    successfulRequests: number;
    /** Failed requests */
    failedRequests: number;
    /** Success rate */
    successRate: number;
    /** Error rate */
    errorRate: number;
    /** Average response time (ms) */
    avgResponseTime: number;
    /** P95 response time (ms) */
    p95ResponseTime: number;
    /** P99 response time (ms) */
    p99ResponseTime: number;
    /** Requests per second */
    requestsPerSecond: number;
    /** Errors by type */
    errorsByType: Record<string, number>;
    /** Performance over time */
    performanceTimeline: Array<{
        timestamp: Date;
        responseTime: number;
        requestsPerSecond: number;
        errorRate: number;
    }>;
    /** Test passed */
    passed: boolean;
    /** Threshold violations */
    violations: string[];
}
/**
 * Cache metrics
 */
export interface CacheMetrics {
    /** Total cache size */
    size: number;
    /** Cache hit count */
    hits: number;
    /** Cache miss count */
    misses: number;
    /** Cache hit rate */
    hitRate: number;
    /** Cache eviction count */
    evictions: number;
    /** Average cache access time (ms) */
    avgAccessTime: number;
}
/**
 * Connection pool metrics
 */
export interface ConnectionPoolMetrics {
    /** Pool size */
    poolSize: number;
    /** Active connections */
    activeConnections: number;
    /** Idle connections */
    idleConnections: number;
    /** Pending requests */
    pendingRequests: number;
    /** Connection creation count */
    createdConnections: number;
    /** Connection destruction count */
    destroyedConnections: number;
    /** Average connection lifetime (ms) */
    avgConnectionLifetime: number;
}
//# sourceMappingURL=monitoring.d.ts.map