interface MetricEvent {
    type: 'system' | 'application' | 'agent' | 'task';
    severity: 'info' | 'warning' | 'error';
    metric: string;
    value: number;
    timestamp?: Date;
    metadata?: Record<string, unknown>;
}
export declare class MetricsProcessor {
    private readonly logger;
    private readonly metricsBuffer;
    private readonly maxBufferSize;
    constructor();
    trackEvent(eventType: string, data: Record<string, unknown>): Promise<void>;
    processSystemMetrics(): Promise<void>;
    processApplicationMetrics(): Promise<void>;
    processAgentMetrics(): Promise<void>;
    processTaskMetrics(): Promise<void>;
    private addToBuffer;
    private startPeriodicProcessing;
    private flushMetrics;
    private getSystemMetrics;
    private getApplicationMetrics;
    private getAgentMetrics;
    getMetricsBuffer(): MetricEvent[];
    clearBuffer(): void;
}
export {};
//# sourceMappingURL=metricsProcessor.d.ts.map