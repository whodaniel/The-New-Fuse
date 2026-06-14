export interface Metric {
    name: string;
    value: number;
    timestamp: Date;
    tags?: Record<string, string>;
}
export interface MetricsSnapshot {
    timestamp: Date;
    metrics: Metric[];
    summary: {
        total: number;
        average: number;
        min: number;
        max: number;
    };
}
export declare class MetricsService {
    private metrics;
    private readonly maxMetricsPerKey;
    recordMetric(name: string, value: number, tags?: Record<string, string>): void;
    getMetrics(name: string): Metric[];
    getAllMetrics(): Map<string, Metric[]>;
    getSnapshot(): MetricsSnapshot;
    clearMetrics(name?: string): void;
    getMetricsSummary(name: string): {
        count: number;
        latest: number;
        average: number;
    };
}
//# sourceMappingURL=MetricsService.d.ts.map