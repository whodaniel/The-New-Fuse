import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service.js';
import { MetricsService } from '../metrics/metrics.service.js';

@Injectable()
export class CacheService {
  constructor(
    private readonly redis: RedisService,
    private readonly metrics: MetricsService,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const start = Date.now();
    try {
      const value = await this.redis.get(key);
      this.metrics.recordCacheHit(key, Date.now() - start);
      return value ? JSON.parse(value) : null;
    } catch (error: unknown) {
      this.metrics.recordCacheError(key);
      throw error;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      await this.redis.set(
        key,
        JSON.stringify(value),
        ttl ? { EX: ttl } : undefined
      );
      this.metrics.recordCacheSet(key);
    } catch (error: unknown) {
      this.metrics.recordCacheError(key);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.metrics.recordCacheDelete(key);
    } catch (error: unknown) {
      this.metrics.recordCacheError(key);
      throw error;
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(keys);
      this.metrics.recordCacheInvalidation(pattern, keys.length);
    }
  }
}
