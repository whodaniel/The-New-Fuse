import { MetricsService } from '../metrics/MetricsService.tsx';
export declare class PerformanceMonitor {
    private readonly metrics;
    private readonly startTime;
    constructor(metrics: MetricsService);
}
