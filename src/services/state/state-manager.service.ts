import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.ts';
import { LoggingService } from '../LoggingService.ts';
import { MetricsService } from '../MetricsService.ts';

export interface StateManagerConfig {
  prefix?: string;
  ttl?: number;
}

export interface StateEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

export interface StateMetric {
  name: string;
  value: number;
  labels?: Record<string, string>;
}

@Injectable()
export class StateManagerService {
  private readonly logger: LoggingService;
  private readonly prefix: string;
  private readonly defaultTtl: number;

  constructor(
    private readonly redis: RedisService,
    private readonly metrics: MetricsService,
    config: StateManagerConfig = {}
  ) {
    this.logger = new LoggingService('StateManagerService');
    this.prefix = config.prefix || 'state';
    this.defaultTtl = config.ttl || 3600; // 1 hour default TTL
  }

  private createMetric(metric: StateMetric): void {
    try {
      this.metrics.createPerformanceMetric({
        operation: metric.name,
        duration: 0,
        success: metric.value === 1,
        metadata: metric.labels
      });
    } catch (error) {
      this.logger.error('Failed to create metric', { metric, error });
    }
  }

  async setState<T>(key: string, value: T, ttl?: number): Promise<void> {
    const entry: StateEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl
    };

    try {
      const redisKey = this.getRedisKey(key);
      await this.redis.set(redisKey, JSON.stringify(entry), 'EX', entry.ttl);
      
      this.metrics.trackCount('state_set_success');
      this.logger.debug('State set successfully', { key, ttl: entry.ttl });
    } catch (error) {
      this.metrics.trackCount('state_set_error');
      this.logger.error('Failed to set state', { key, error });
      throw error;
    }
  }

  async getState<T>(key: string): Promise<T | null> {
    try {
      const redisKey = this.getRedisKey(key);
      const data = await this.redis.get(redisKey);
      
      if (!data) {
        return null;
      }

      const entry: StateEntry<T> = JSON.parse(data);
      return entry.value;
    } catch (error) {
      this.metrics.trackCount('state_get_error');
      this.logger.error('Failed to get state', { key, error });
      throw error;
    }
  }

  async deleteState(key: string): Promise<void> {
    try {
      const redisKey = this.getRedisKey(key);
      await this.redis.del(redisKey);
      this.metrics.trackCount('state_delete_success');
    } catch (error) {
      this.metrics.trackCount('state_delete_error');
      this.logger.error('Failed to delete state', { key, error });
      throw error;
    }
  }

  async listKeys(pattern?: string): Promise<string[]> {
    try {
      const searchPattern = this.getRedisKey(pattern || '*');
      const keys = await this.redis.keys(searchPattern);
      return keys.map(key => this.stripPrefix(key));
    } catch (error) {
      this.metrics.trackCount('state_list_error');
      this.logger.error('Failed to list state keys', { pattern, error });
      throw error;
    }
  }

  private getRedisKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  private stripPrefix(key: string): string {
    return key.substring(this.prefix.length + 1);
  }
}