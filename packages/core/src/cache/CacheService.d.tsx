import { RedisService } from './redis.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
export declare class CacheService {
    private readonly redis;
    private readonly metrics;
    constructor(redis: RedisService, metrics: MetricsService);
    get<T>(): Promise<void>;
}
