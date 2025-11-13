/**
 * Metrics Collection System
 */
import { EventEmitter } from 'events';
import { IMetricsCollector } from '../interfaces/IMonitoring';
import { PerformanceMetrics, TimeSeries } from '../types/monitoring';
import { Logger } from '../utils/Logger';
export interface MetricsCollectorConfig {
    /** Collection interval (ms) */
    interval: number;
    /** Retention period (ms) */
    retentionPeriod: number;
    /** Storage configuration */
    storage: {
        type: 'memory' | 'file' | 'database';
        options?: Record<string, any>;
    };
}
/**
 * Metrics collector implementation
 */
export declare class MetricsCollector extends EventEmitter implements IMetricsCollector {
    private readonly config;
    private readonly logger;
    private running;
    private collectionTimer?;
    private readonly metrics;
    private readonly counters;
    private readonly histograms;
    private readonly gauges;
    private readonly requestTimes;
    private requestCount;
    private successfulRequests;
    private failedRequests;
    private connectionCount;
    private activeConnections;
    private resourceAccessCount;
    private cacheHits;
    private cacheMisses;
    private toolExecutionCount;
    private toolSuccessCount;
    private startTime;
    constructor(config: MetricsCollectorConfig, logger?: Logger);
    /**
     * Start collecting metrics
     */
    start(): Promise<void>;
    /**
     * Stop collecting metrics
     */
    stop(): Promise<void>;
    /**
     * Record a metric value
     */
    recordMetric(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Increment a counter metric
     */
    incrementCounter(name: string, labels?: Record<string, string>): void;
    /**
     * Record a histogram value
     */
    recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Record a gauge value
     */
    recordGauge(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Get current metrics
     */
    getCurrentMetrics(): PerformanceMetrics;
    /**
     * Get metrics history
     */
    getMetricsHistory(hours: number): TimeSeries[];
    /**
     * Get specific metric
     */
    getMetric(name: string): TimeSeries | null;
    /**
     * Record request start
     */
    recordRequestStart(requestId: string): void;
    /**
     * Record request end
     */
    recordRequestEnd(requestId: string, success: boolean): void;
    /**
     * Record connection event
     */
    recordConnectionEvent(event: 'connect' | 'disconnect' | 'error'): void;
    /**
     * Record resource access
     */
    recordResourceAccess(uri: string, duration: number, cached: boolean): void;
    /**
     * Record tool execution
     */
    recordToolExecution(name: string, duration: number, success: boolean): void;
    /**
     * Collect current metrics
     */
    private collectMetrics;
    /**
     * Clean up old data points from time series
     */
    private cleanupTimeSeries;
    /**
     * Generate metric key with labels
     */
    private getMetricKey;
    /**
     * Calculate percentile from array of values
     */
    private calculatePercentile;
    /**
     * Calculate system health score
     */
    private calculateHealthScore;
    /**
     * Get resource count (placeholder - would be injected from resource manager)
     */
    private getResourceCount;
    /**
     * Get tool count (placeholder - would be injected from tool manager)
     */
    private getToolCount;
}
//# sourceMappingURL=MetricsCollector.d.ts.map