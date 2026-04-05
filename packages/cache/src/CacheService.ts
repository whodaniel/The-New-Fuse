import { Injectable, Logger } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { ConfigService } from '@nestjs/config';

interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTTL: number;

  constructor(
    private readonly config: ConfigService,
    private readonly redisService: UnifiedRedisService
  ) {
    this.defaultTTL = config.get('CACHE_TTL', 3600);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisService.get(key);
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
      await this.redisService.set(key, serialized, ttl);

      if (options.tags) {
        await this.tagKey(key, options.tags);
      }
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}: ${(error as Error).message}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redisService.del(key);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}: ${(error as Error).message}`);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redisService.flushdb();
    } catch (error) {
      this.logger.error(`Cache clear error: ${(error as Error).message}`);
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      const keys = await this.redisService.smembers(`tag:${tag}`);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => this.redisService.del(key)));
        await this.redisService.del(`tag:${tag}`);
      }
    } catch (error) {
      this.logger.error(`Cache invalidate by tag error: ${(error as Error).message}`);
    }
  }

  private async tagKey(key: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        await this.redisService.sadd(`tag:${tag}`, key);
      }
    } catch (error) {
      this.logger.error(`Cache tag error: ${(error as Error).message}`);
    }
  }
  }