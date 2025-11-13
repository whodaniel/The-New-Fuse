/**
 * @fileoverview Production-ready metrics collection service
 */
import { Metric, MetricSeries } from '../types/monitoring';
import { ServiceState } from '../constants/types';
export declare class MetricsCollector {
    private state;
    private metrics;
    private flushInterval?;
    private readonly maxDataPoints;
    private readonly flushIntervalMs;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    getState(): ServiceState;
    collect(metric: Metric): void;
    recordCounter(name: string, value?: number, tags?: Record<string, string>, source?: string): void;
    recordGauge(name: string, value: number, unit?: string, tags?: Record<string, string>, source?: string): void;
    recordTimer(name: string, duration: number, tags?: Record<string, string>, source?: string): void;
    recordHistogram(name: string, value: number, unit?: string, tags?: Record<string, string>, source?: string): void;
    getMetricSeries(name: string): MetricSeries | undefined;
    getAllMetrics(): MetricSeries[];
    getMetricNames(): string[];
    getMetricsCount(): number;
    getTotalDataPoints(): number;
    clearMetrics(): void;
    clearMetric(name: string): boolean;
    getMetricsSummary(): Record<string, any>;
    private calculatePercentile;
    private flushOldMetrics;
    time<T>(name: string, operation: () => Promise<T>, tags?: Record<string, string>): Promise<T>;
    timeSync<T>(name: string, operation: () => T, tags?: Record<string, string>): T;
}
//# sourceMappingURL=MetricsCollector.d.ts.map