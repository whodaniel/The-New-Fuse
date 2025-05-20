import { MetricsService } from '../metrics/MetricsService.js';
export declare class PerformanceMonitor {
    private readonly metrics;
    private readonly startTime;
    constructor(metrics: MetricsService);
}
