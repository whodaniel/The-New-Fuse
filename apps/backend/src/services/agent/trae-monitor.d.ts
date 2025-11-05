interface MetricData {
    messageType: string;
    processingTime: number;
    success: boolean;
    errorDetails?: string;
}
export declare class TraeMonitor {
    private readonly logger;
    private readonly redis;
    private heartbeatInterval;
    private metricsCollectionInterval;
    private readonly metrics;
    constructor();
    initialize(): Promise<void>;
    startHeartbeat(agentId: string): Promise<void>;
    private sendHeartbeat;
    enableMetrics(options: {
        collectInterval: number;
        reportInterval: number;
    }): void;
    recordMetric(data: MetricData): void;
    private reportMetrics;
    private calculateMessageFlow;
    private calculateErrorRate;
    private calculateAverageProcessingTime;
    private calculateQueueLength;
    onAlert(callback: (alert: any) => void): void;
    cleanup(): Promise<void>;
}
export {};
//# sourceMappingURL=trae-monitor.d.ts.map