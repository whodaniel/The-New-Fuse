/**
 * Prometheus Metrics Collection
 * Provides custom metrics for application monitoring
 */
import { EventEmitter } from 'events';
export interface MetricsConfig {
    enabled: boolean;
    prefix?: string;
    defaultLabels?: Record<string, string>;
    collectDefaultMetrics?: boolean;
    collectInterval?: number;
}
export interface CustomMetric {
    name: string;
    help: string;
    type: 'counter' | 'gauge' | 'histogram' | 'summary';
    labelNames?: string[];
    buckets?: number[];
    percentiles?: number[];
}
/**
 * Prometheus Metrics Service
 */
export declare class PrometheusMetrics extends EventEmitter {
    private client;
    private register;
    private metrics;
    private config;
    private initialized;
    httpRequestDuration: any;
    httpRequestTotal: any;
    httpRequestErrors: any;
    activeConnections: any;
    databaseQueryDuration: any;
    databaseConnectionPool: any;
    cacheHits: any;
    cacheMisses: any;
    jobQueueSize: any;
    jobProcessingDuration: any;
    websocketConnections: any;
    agentCount: any;
    workflowExecutions: any;
    constructor(config: MetricsConfig);
    /**
     * Initialize Prometheus client
     */
    initialize(): Promise<void>;
    /**
     * Initialize common application metrics
     */
    private initializeCommonMetrics;
    /**
     * Create custom metric
     */
    createMetric(metric: CustomMetric): any;
    /**
     * Record HTTP request
     */
    recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void;
    /**
     * Record database query
     */
    recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void;
    /**
     * Set database connection pool metrics
     */
    setDatabaseConnectionPool(database: string, idle: number, active: number, total: number): void;
    /**
     * Record cache hit
     */
    recordCacheHit(cacheType: string, keyPattern: string): void;
    /**
     * Record cache miss
     */
    recordCacheMiss(cacheType: string, keyPattern: string): void;
    /**
     * Set job queue size
     */
    setJobQueueSize(queueName: string, pending: number, active: number, completed: number, failed: number): void;
    /**
     * Record job processing
     */
    recordJobProcessing(jobType: string, duration: number, success: boolean): void;
    /**
     * Set WebSocket connections
     */
    setWebSocketConnections(connected: number, disconnected?: number): void;
    /**
     * Set agent count
     */
    setAgentCount(active: number, inactive: number, type?: string): void;
    /**
     * Record workflow execution
     */
    recordWorkflowExecution(workflowType: string, success: boolean): void;
    /**
     * Get metrics in Prometheus format
     */
    getMetrics(): Promise<string>;
    /**
     * Get content type for metrics endpoint
     */
    getContentType(): string;
    /**
     * Reset all metrics
     */
    reset(): void;
    /**
     * Clear all metrics
     */
    clear(): void;
}
//# sourceMappingURL=prometheus-metrics.d.ts.map