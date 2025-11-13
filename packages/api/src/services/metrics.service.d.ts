export interface MetricRecord {
    name: string;
    value: number;
    timestamp: Date;
    tags?: Record<string, string>;
}
export declare class MetricsService {
    private readonly logger;
    private metrics;
    recordQuery(operation: string, duration: number): void;
    recordError(operation: string, error: any): void;
    recordCacheHit(key: string): void;
    recordCacheMiss(key: string): void;
    recordWorkflowExecution(workflowId: string, duration: number, success: boolean): void;
    recordUserAction(userId: string, action: string): void;
    private recordMetric;
    getMetrics(name?: string): MetricRecord[];
    getMetricSummary(name: string, timeRangeMinutes?: number): {
        count: number;
        sum: number;
        avg: number;
        min: number;
        max: number;
    } | null;
    clearMetrics(name?: string): void;
}
//# sourceMappingURL=metrics.service.d.ts.map