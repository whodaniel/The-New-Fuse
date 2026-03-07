import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { RedisService } from '../services/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: RedisService) {
    super();
  }

  @HealthCheck()
  async isHealthy(): Promise<HealthCheckResult> {
    try {
      const result = await this.redis.ping();
      return { status: 'ok', details: { redis: { status: 'up' } } };
    } catch (error) {
      return { status: 'error', details: { redis: { status: 'down', message: (error as Error).message } } };
    }
  }
}