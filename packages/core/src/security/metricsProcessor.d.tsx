export interface MetricThresholds {
    system: {
        cpuUsage: number;
        memoryUsage: number;
        diskUsage: number;
        networkLatency: number;
    };
    application: {
        errorRate: number;
        responseTime: number;
        queueLength: number;
        connectionLimit: number;
    };
    agent: {
        errorRate: number;
        processingTime: number;
        queueLength: number;
        resourceUsage: number;
    };
}
export declare class MetricsProcessor {
    private readonly thresholds;
    private alertHandlers;
    constructor(thresholds: MetricThresholds);
    processSystemMetrics(): Promise<void>;
}
