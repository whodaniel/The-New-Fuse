export interface MetricsService {
    recordMetric(name: string, value: number, tags?: Record<string, string>): Promise<void>;
    getMetric(name: string, timeRange?: {
        start: Date;
        end: Date;
    }): Promise<number[]>;
    getMetrics(query: {
        names: string[];
        timeRange?: {
            start: Date;
            end: Date;
        };
    }): Promise<Record<string, number[]>>;
    calculateAggregates(name: string, aggregation: 'avg' | 'sum' | 'min' | 'max'): Promise<number>;
    setThreshold(name: string, threshold: {
        min?: number;
        max?: number;
        warning?: number;
        critical?: number;
    }): void;
    clearThreshold(name: string): void;
    getAlerts(): Promise<Array<{
        id: string;
        metric: string;
        threshold: number;
        value: number;
        timestamp: Date;
    }>>;
}
export declare enum MetricUnits {
    MILLISECONDS = "ms",
    SECONDS = "sec",
    BYTES = "bytes",
    KILOBYTES = "kb",
    MEGABYTES = "mb",
    GIGABYTES = "gb",
    COUNT = "count",
    PERCENTAGE = "%",
    REQUESTS_PER_SECOND = "req/s"
}
//# sourceMappingURL=service.d.d.ts.map