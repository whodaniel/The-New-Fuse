export declare class ClineBridge {
    private client;
    private communication;
    private logger;
    constructor();
    initialize(): Promise<boolean>;
    sendTask(task: unknown): Promise<void>;
    onResult(callback: (result: unknown) => Promise<void>): Promise<void>;
}
//# sourceMappingURL=cline_bridge.d.ts.map