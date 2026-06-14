export interface HealthStatus {
    component: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    details?: string;
    latency?: number;
}
/**
 * Health monitoring service for the TNF ecosystem.
 * Probes key infrastructure components: Redis, WebSocket, Hermes Bridge, and LLM Providers.
 */
export declare class HealthMonitorService {
    private redisHost;
    private redisPort;
    private relayUrl;
    private bridgeUrl;
    constructor(config?: {
        redisHost?: string;
        redisPort?: number;
        relayUrl?: string;
        bridgeUrl?: string;
    });
    /**
     * Run a full health check of the TNF infrastructure.
     */
    runFullCheck(): Promise<HealthStatus[]>;
    private checkRedis;
    private checkWebSocketRelay;
    private checkHermesBridge;
    private checkLLMProviders;
    private probeHttpEndpoint;
}
//# sourceMappingURL=HealthMonitorService.d.ts.map