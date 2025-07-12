export declare class MetricsService {
    collectMetric(name: string, value: number, tags?: Record<string, string>): Promise<void>;
    getMetrics(name: string, timeRange?: {
        start: Date;
        end: Date;
    }): Promise<any>;
    getSystemMetrics(): Promise<any>;
    getApplicationMetrics(): Promise<any>;
    generateReport(timeRange: {
        start: Date;
        end: Date;
    }): Promise<any>;
}
//# sourceMappingURL=MetricsService.d.ts.map