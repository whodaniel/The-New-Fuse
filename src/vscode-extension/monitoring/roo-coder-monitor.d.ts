export declare class RooCoderMonitor {
    private static instance;
    private metrics;
    private logger;
    private telemetry;
    private constructor();
    static getInstance(): RooCoderMonitor;
    trackToolUsage(toolId: string, executionTime: number): void;
    trackError(error: Error): void;
    updateActiveAgents(agents: string[]): void;
    getMetricsReport(): Promise<string>;
}
//# sourceMappingURL=roo-coder-monitor.d.ts.map