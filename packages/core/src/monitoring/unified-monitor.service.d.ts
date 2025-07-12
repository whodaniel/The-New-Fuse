export declare class UnifiedMonitorService {
    private metrics;
    private readonly logger;
    constructor();
    private initializeMetrics;
    incrementMetric(name: string, value?: number): void;
    recordLatency(operation: string, timeMs: number): void;
    logEvent(eventType: string, data: any): void;
    recordMetric(name: string, value: number, tags?: Record<string, string>): void;
    captureError(error: Error | string, context?: Record<string, any>): void;
    getMetrics(): Record<string, any>;
    getMetric(name: string): any;
    resetMetrics(): void;
}
//# sourceMappingURL=unified-monitor.service.d.ts.map