/**
 * Unified monitoring service for tracking system metrics and events
 */
export declare class UnifiedMonitorService {
    private metrics;
    constructor();
    /**
     * Increment a numeric metric
     */
    incrementMetric(name: string, value?: number): void;
    /**
     * Record a latency value
     */
    recordLatency(operation: string, timeMs: number): void;
    /**
     * Log a system event
     */
    logEvent(eventType: string, data: any): void;
    /**
     * Get all metrics
     */
    getMetrics(): Record<string, any>;
    /**
     * Get a specific metric
     */
    getMetric(name: string): any;
    /**
     * Reset all metrics
     */
    resetMetrics(): void;
}
//# sourceMappingURL=unified-monitor.service.d.ts.map