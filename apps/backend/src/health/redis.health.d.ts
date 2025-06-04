import { HealthIndicator, HealthCheckResult } from '@nestjs/terminus';
import { RedisService } from '@core/redis/redis.service.ts';
export declare class RedisHealthIndicator extends HealthIndicator {
    private readonly redis;
    constructor(redis: RedisService);
    isHealthy(): Promise<HealthCheckResult>;
}
