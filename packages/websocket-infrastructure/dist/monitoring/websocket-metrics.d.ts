import { Registry } from 'prom-client';
import { WebSocketMetrics, HealthStatus } from '../types/index.js';
export declare class WebSocketMonitoring {
    private readonly logger;
    private registry;
    private connectionsTotal;
    private activeConnections;
    private messagesTotal;
    private messageLatency;
    private errorsTotal;
    private reconnectionsTotal;
    private queueSize;
    private messageProcessingTime;
    constructor(registry?: Registry);
    private initializeMetrics;
    recordConnection(success?: boolean): void;
    recordDisconnection(): void;
    recordMessage(direction: 'inbound' | 'outbound', channel?: string): void;
    recordMessageLatency(latencyMs: number, channel?: string): void;
    recordError(type?: string): void;
    recordReconnection(): void;
    updateQueueSize(size: number): void;
    recordProcessingTime(timeMs: number, channel?: string): void;
    getMetrics(): Promise<string>;
    getMetricsJSON(): Promise<WebSocketMetrics>;
    getHealthStatus(additionalChecks?: {
        redis?: boolean;
        queueSize?: number;
        errors?: string[];
    }): Promise<HealthStatus>;
    reset(): void;
    getRegistry(): Registry;
}
//# sourceMappingURL=websocket-metrics.d.ts.map