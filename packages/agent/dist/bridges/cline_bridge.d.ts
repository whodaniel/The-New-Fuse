export declare class ClineBridge {
    private client;
    private communication;
    private logger;
    constructor();
    initialize(): Promise<boolean>;
    shutdown(): Promise<void>;
    sendTask(task: unknown): Promise<void>;
    onResult(callback: (result: unknown) => Promise<void>): Promise<void>;
    isHealthy(): Promise<boolean>;
}
//# sourceMappingURL=cline_bridge.d.ts.map