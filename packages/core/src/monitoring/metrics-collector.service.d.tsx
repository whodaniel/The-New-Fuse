export interface MetricsConfig {
    enabled: boolean;
    interval: number;
    prefix: string;
}
export interface MetricSnapshot {
    timestamp: Date;
    values: Record<string, number>;
}
export declare class MetricsCollector {
    private logger;
    private metrics;
    private config;
    private startTime;
    private metricsHistory;
    constructor();
    setValue(metric: string, value: number): void;
    reset(): void;
}
