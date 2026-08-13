/**
 * Base metrics collector implementation
 * Provides common functionality for all metrics collectors
 */
import { EventEmitter } from 'events';
import { IMetricsCollector, TimeSeries } from '../interfaces/IMonitoring.js';
import { Logger } from '../utils/Logger.js';
/**
 * Base metrics collector configuration
 */
export interface BaseMetricsCollectorConfig {
    interval: number;
    retentionPeriod: number;
    storage: {
        type: 'memory' | 'file' | 'database';
        options?: Record<string, any>;
    };
}
/**
 * Base metrics collector that can be extended
 */
export declare abstract class BaseMetricsCollector<TMetrics = any> extends EventEmitter implements IMetricsCollector<TMetrics> {
    protected readonly config: BaseMetricsCollectorConfig;
    protected readonly logger: Logger;
    protected running: boolean;
    protected collectionTimer?: NodeJS.Timeout;
    protected readonly metrics: Map<string, TimeSeries<number>>;
    protected readonly counters: Map<string, number>;
    protected readonly histograms: Map<string, number[]>;
    protected readonly gauges: Map<string, number>;
    constructor(config: BaseMetricsCollectorConfig, logger?: Logger);
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
     * Get metrics history
     */
    getMetricsHistory(hours: number): TimeSeries[];
    /**
     * Get specific metric
     */
    getMetric(name: string): TimeSeries | null;
    /**
     * Abstract method to get current metrics
     * Must be implemented by subclasses
     */
    abstract getCurrentMetrics(): TMetrics;
    /**
     * Abstract method to collect metrics
     * Must be implemented by subclasses
     */
    protected abstract collectMetrics(): void;
    /**
     * Calculate percentile from array of values
     */
    protected calculatePercentile(values: number[], percentile: number): number;
    /**
     * Clean up old data points from time series
     */
    protected cleanupTimeSeries(timeSeries: TimeSeries): void;
    /**
     * Generate metric key with labels
     */
    protected getMetricKey(name: string, labels?: Record<string, string>): string;
    /**
     * Get counter value
     */
    protected getCounterValue(name: string, labels?: Record<string, string>): number;
    /**
     * Get gauge value
     */
    protected getGaugeValue(name: string, labels?: Record<string, string>): number;
    /**
     * Get histogram values
     */
    protected getHistogramValues(name: string, labels?: Record<string, string>): number[];
}
//# sourceMappingURL=BaseMetricsCollector.d.ts.map