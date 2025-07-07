import { MetricsService } from '../metrics/metrics.service;';
import { SystemHealthMonitor } from /../managers/system-health-monitor/;
export declare class SystemDiagnosticsService {
    private metrics;
    private healthMonitor;
    constructor(metrics: MetricsService, healthMonitor: SystemHealthMonitor);
    performSystemCheck(): Promise<void>;
}
