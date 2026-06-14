import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export interface MetricEvent {
    type: 'system' | 'application' | 'agent' | 'task';
    severity: 'info' | 'warning' | 'error';
    metric: string;
    value: number;
    timestamp?: Date;
    metadata?: Record<string, unknown>;
}
export interface SystemMetrics {
    cpuUsage: number;
    memoryUsage: number;
}
export interface ApplicationMetrics {
    responseTime: number;
    errorRate: number;
}
export interface AgentMetrics {
    activeAgents: number;
}
export declare class MetricsProcessor implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private metricsBuffer;
    private readonly maxBufferSize;
    private processingInterval;
    onModuleInit(): void;
    onModuleDestroy(): void;
    trackEvent(eventType: string, data?: any): Promise<void>;
    processSystemMetrics(): Promise<void>;
    private addToBuffer;
    private startPeriodicProcessing;
    private flushMetrics;
    private getSystemMetrics;
    getMetricsBuffer(): MetricEvent[];
    clearBuffer(): void;
}
//# sourceMappingURL=metricsProcessor.d.ts.map