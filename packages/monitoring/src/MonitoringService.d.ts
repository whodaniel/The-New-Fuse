import { PrometheusService } from './PrometheusService';
import { RedisService } from './RedisService';
export declare class MonitoringService {
    private prometheus;
    private redis;
    constructor(prometheus: PrometheusService, redis: RedisService);
    trackAgentMetrics(): Promise<void>;
}
//# sourceMappingURL=MonitoringService.d.ts.map