import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

@Injectable()
export class CacheService {
  private readonly redis: Redis;
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTTL: number;

  constructor(private readonly config: ConfigService) {
    this.redis = new (Redis as any)({
      host: config.get('REDIS_HOST', 'localhost'),
      port: config.get('REDIS_PORT', 6379),
      password: config.get('REDIS_PASSWORD'),
    });

    this.defaultTTL = config.get('CACHE_TTL', 3600);
    this.setupErrorHandling();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}: ${(error as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: unknown, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || this.defaultTTL;
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);

      if (options.tags) {
        await this.tagKey(key, options.tags);
      }
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}: ${(error as Error).message}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}: ${(error as Error).message}`);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      this.logger.error(`Cache clear error: ${(error as Error).message}`);
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      const keys = await this.redis.smembers(`tag:${tag}`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        await this.redis.del(`tag:${tag}`);
      }
    } catch (error) {
      this.logger.error(`Cache invalidate by tag error: ${(error as Error).message}`);
    }
  }

  private async tagKey(key: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        await this.redis.sadd(`tag:${tag}`, key);
      }
    } catch (error) {
      this.logger.error(`Cache tag error: ${(error as Error).message}`);
    }
  }

  private setupErrorHandling(): void {
    this.redis.on('error', (error) => {
      this.logger.error(`Redis connection error: ${error.message}`);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });
  }
}
