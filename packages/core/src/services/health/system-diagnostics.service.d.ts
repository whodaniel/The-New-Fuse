import { MetricsService } from '../metrics/metrics.service.js';
import { SystemHealthMonitor } from '../managers/system-health-monitor.js';
export declare class SystemDiagnosticsService {
    private metrics;
    private healthMonitor;
    constructor(metrics: MetricsService, healthMonitor: SystemHealthMonitor);
    performSystemCheck(): Promise<void>;
}
