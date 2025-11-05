import { HealthIndicator, HealthCheckResult } from '@nestjs/terminus';
import { RedisService } from '../services/redis.service';
export declare class RedisHealthIndicator extends HealthIndicator {
    private readonly redis;
    constructor(redis: RedisService);
    isHealthy(): Promise<HealthCheckResult>;
}
//# sourceMappingURL=redis.health.d.ts.map