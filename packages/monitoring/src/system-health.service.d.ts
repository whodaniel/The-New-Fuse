import { PrometheusService } from './prometheus.service';
import { HealthStatus } from '@the-new-fuse/types';
export declare class SystemHealthService {
    private readonly prometheus;
    constructor(prometheus: PrometheusService);
    checkSystemHealth(): Promise<HealthStatus>;
    private getSystemMetrics;
    private getActiveAgentCount;
    private getMessageProcessingRate;
    private getErrorRate;
    private getAverageLatency;
}
//# sourceMappingURL=system-health.service.d.ts.map