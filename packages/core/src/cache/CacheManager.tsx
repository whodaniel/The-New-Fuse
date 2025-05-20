import { Injectable, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Logger } from '@the-new-fuse/utils';
import * as crypto from 'crypto';

interface CacheConfig {
  ttl: number;
  maxSize: number;
  evictionPolicy: 'LRU' | 'LFU';
}

@Injectable()
export class CacheManager implements OnModuleInit {
  private redis: Redis;
  private logger = new Logger('CacheManager');
  private metrics: Map<string, number> = new Map();
  private warmupKeys: Set<string> = new Set();

  constructor(
    private readonly config: CacheConfig = {
      ttl: 3600,
      maxSize: 1000,
      evictionPolicy: 'LRU'
    }
  ) {}

  async onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      enableReadyCheck: true
    });

    this.redis.on('error', (err) => this.logger.error('Redis error:', err));
    await this.setupMonitoring();
    await this.warmCache();
  }

  private async setupMonitoring() {
    // Monitor cache stats every minute
    setInterval(async () => {
      const stats = await this.getCacheStats();
      this.logger.info('Cache stats:', stats);
    }, 60000);

    // Setup cache event listeners
    this.redis.on('ready', () => this.logger.info('Cache ready'));
    this.redis.on('connect', () => this.logger.info('Cache connected'));
    this.redis.on('close', () => this.logger.warn('Cache connection closed'));
  }

  private async warmCache() {
    for (const key of this.warmupKeys) {
      try {
        await this.redis.get(key);
      } catch (error) {
        this.logger.error(`Error warming cache for key ${key}:`, error);
      }
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const cacheKey = this.generateCacheKey(key);
    try {
      await this.redis.set(
        cacheKey,
        JSON.stringify(value),
        'EX',
        ttl || this.config.ttl
      );
      this.metrics.set(cacheKey, (this.metrics.get(cacheKey) || 0) + 1);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.generateCacheKey(key);
    try {
      const value = await this.redis.get(cacheKey);
      if (value) {
        this.metrics.set(cacheKey, (this.metrics.get(cacheKey) || 0) + 1);
        return JSON.parse(value);
      }
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
    }
    return null;
  }

  async invalidate(key: string): Promise<void> {
    const cacheKey = this.generateCacheKey(key);
    try {
      await this.redis.del(cacheKey);
      this.metrics.delete(cacheKey);
    } catch (error) {
      this.logger.error(`Error invalidating cache key ${key}:`, error);
    }
  }

  async getCacheStats() {
    try {
      const info = await this.redis.info();
      const dbSize = await this.redis.dbsize();
      const hits = Array.from(this.metrics.values()).reduce((a, b) => a + b, 0);

      return {
        size: dbSize,
        hits,
        metrics: Object.fromEntries(this.metrics),
        info: this.parseRedisInfo(info)
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return null;
    }
  }

  private generateCacheKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  private parseRedisInfo(info: string) {
    return info
      .split('\n')
      .filter(line => line && !line.startsWith('#'))
      .reduce((obj, line) => {
        const [key, value] = line.split(':');
        if (key && value) {
          obj[key.trim()] = value.trim();
        }
        return obj;
      }, {} as Record<string, string>);
  }
}