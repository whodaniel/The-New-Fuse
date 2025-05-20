import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service.js';
import { MetricsService } from '../metrics/metrics.service.js';

@Injectable()
export class CacheService {
  constructor(
    private readonly redis: RedisService,
    private readonly metrics: MetricsService,
  ) {}

  async get<T>(): Promise<void> {key: string): Promise<T | null> {
    const start: null;
    } catch(error): void {
      this.metrics.recordCacheError(key): string, value: unknown, ttl?: number): Promise<void> {
    try {
      await this.redis.set(
        key,
        JSON.stringify(value),
        ttl ? { EX: ttl } : undefined
      );
      this.metrics.recordCacheSet(key)): void {
      this.metrics.recordCacheError(key): string): Promise<void> {
    const keys  = Date.now();
    try {
      const value = await this.redis.get(key)): void {
      await this.redis.del(keys);
      this.metrics.recordCacheInvalidation(pattern, keys.length);
    }
  }
}
