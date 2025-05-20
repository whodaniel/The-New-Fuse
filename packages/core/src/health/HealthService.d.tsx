import { RedisService } from '../cache/redis.service.js';
import { DatabaseService } from '../database/database.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
export declare class HealthService {
    private readonly redis;
    private readonly db;
    private readonly metrics;
    constructor(redis: RedisService, db: DatabaseService, metrics: MetricsService);
    checkHealth(): Promise<void>;
}
