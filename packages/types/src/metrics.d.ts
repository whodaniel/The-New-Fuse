export interface MetricData {
    name: string;
    value: number;
    timestamp: Date;
    tags?: Record<string, string>;
}
export interface MetricsCollector {
    collect(): Promise<MetricData[]>;
}
//# sourceMappingURL=metrics.d.ts.map