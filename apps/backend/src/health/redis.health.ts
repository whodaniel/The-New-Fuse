import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { RedisService } from '@core/redis/redis.service.ts';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: RedisService) {
    super();
  }

  @HealthCheck()
  async isHealthy(): Promise<HealthCheckResult> {
    try {
      const result = await this.redis.ping();
      return this.getStatus('redis', result === 'PONG');
    } catch (error) {
      return this.getStatus('redis', false, { error: error.message });
    }
  }
}