import { Metric } from '../database/entities/Metric';
export interface PerformanceMetric extends Metric {
    duration: number;
    operation: string;
    success: boolean;
    metadata?: Record<string, unknown>;
}
export interface ErrorMetric extends Metric {
    error: string;
    stack?: string;
    context?: Record<string, unknown>;
}
export interface UsageMetric extends Metric {
    endpoint: string;
    userId?: string;
    responseTime: number;
    statusCode: number;
    metadata?: Record<string, unknown>;
}
export interface MetricTimeRange {
    startTime: Date;
    endTime: Date;
    type?: string;
}
export interface MetricAggregation {
    startTime: Date;
    endTime: Date;
    type: string;
    aggregation: 'avg' | 'sum' | 'count';
    groupBy?: 'hour' | 'day' | 'month';
}
export interface AggregatedMetricResult {
    timestamp: Date;
    value: number;
    groupKey?: string;
}
export interface PerformanceStats {
    totalOperations: number;
    averageDuration: number;
    successRate: number;
    errorRate: number;
}
export declare class MetricsService {
    private readonly metricRepository;
    constructor();
    createPerformanceMetric(data: PerformanceMetric): Promise<Metric>;
    createErrorMetric(data: ErrorMetric): Promise<Metric>;
    createUsageMetric(data: UsageMetric): Promise<Metric>;
    findMetricsByTimeRange(timeRange: MetricTimeRange): Promise<Metric[]>;
    getAggregatedMetrics(options: MetricAggregation): Promise<AggregatedMetricResult[]>;
    getPerformanceStats(startTime: Date, endTime: Date): Promise<PerformanceStats>;
}
