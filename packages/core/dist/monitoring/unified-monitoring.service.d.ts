export declare class UnifiedMonitoringService {
    private readonly logger;
    constructor();
    trackEvent(name: string, properties?: Record<string, any>): void;
    observeMetric(name: string, value: number, tags?: Record<string, string>): void;
}
//# sourceMappingURL=unified-monitoring.service.d.ts.map