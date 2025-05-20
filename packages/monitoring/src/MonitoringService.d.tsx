import { PrometheusService } from './PrometheusService.js';
import { RedisService } from './RedisService.js';
export declare class MonitoringService {
    private prometheus;
    private redis;
    constructor(prometheus: PrometheusService, redis: RedisService);
    trackAgentMetrics(): Promise<void>;
}
