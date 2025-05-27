interface LangfuseConfig {
    publicKey: string;
    secretKey: string;
    baseUrl?: string;
}
export declare class FuseMonitoringClient {
    private config;
    private logger;
    private events;
    private enabled;
    private activeTraces;
    constructor(config: LangfuseConfig);
    isEnabled(): boolean;
    startTrace(traceId: string): void;
    endTrace(traceId: string): void;
    scoreGeneration(data: {
        generationId: string;
        name: string;
        value: number;
        comment?: string;
        provider?: string;
    }): void;
    getSessionMetrics(): Promise<any>;
    openDashboard(): void;
    flush(): Promise<void>;
}
export {};
//# sourceMappingURL=FuseMonitoringClient.d.ts.map