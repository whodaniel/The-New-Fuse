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
export interface MetricAlert {
    timestamp: number;
    type: system' | 'application' | 'agent';
    severity: info' | 'warning' | 'error' | 'critical';
    metric: string;
    value: number;
    threshold: number;
    message: string;
}
export declare class MetricsProcessor {
    private readonly thresholds;
    private alertHandlers;
    constructor(thresholds: MetricThresholds);
    addAlertHandler(handler: (alert: MetricAlert) => , : any, { this: , alertHandlers, push }: {
        this: any;
        alertHandlers: any;
        push: any;
    }): any;
}
