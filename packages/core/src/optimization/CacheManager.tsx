import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/RedisService.js';
import { Logger } from '../logging/LoggingService.js';

export interface CacheConfig {
  defaultTTL: number;
  maxKeys?: number;
  compressionThreshold?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memoryUsage: number;
}

@Injectable()
export class CacheManager {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    keys: 0,
    memoryUsage: 0
  };
  private logger: Logger;

  constructor(
    private readonly redisService: RedisService,
    private readonly config: CacheConfig,
    logger: Logger
  ) {
    this.logger = logger.createChild('CacheManager');
  }

  async initialize(): Promise<void> {
    try {
      const redis = await this.redisService.getClient();

      // Configure Redis for LRU eviction if maxmemory is set
      if (this.config.maxKeys) {
        await redis.config('SET', 'maxmemory-policy', 'allkeys-lru');
      }

      this.logger.info('Cache initialized', { config: this.config });
    } catch (error) {
      this.logger.error('Failed to initialize cache', { error });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = await this.redisService.getClient();
      const value = await redis.get(key);

      if (!value) {
        this.stats.misses++;
        this.logger.debug('Cache miss', { key });
        return null;
      }

      this.stats.hits++;
      const parsed = this.deserialize<T>(value);
      this.logger.debug('Cache hit', { key });

      return parsed;
    } catch (error) {
      this.logger.error('Error getting cache value', { key, error });
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options: {
      ttl?: number;
      tags?: string[];
    } = {}
  ): Promise<boolean> {
    try {
      const redis = await this.redisService.getClient();
      const serialized = this.serialize(value);

      const ttl = options.ttl || this.config.defaultTTL;

      // Store the value with TTL
      await redis.set(key, serialized, 'EX', ttl);

      // If tags are provided, store the key-tag associations
      if (options.tags?.length) {
        await this.associateKeyWithTags(key, options.tags);
      }

      this.stats.keys = await this.getKeyCount();
      this.logger.debug('Cache value set', { key, ttl, tags: options.tags });

      return true;
    } catch (error) {
      this.logger.error('Error setting cache value', { key, error });
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const redis = await this.redisService.getClient();
      const result = await redis.del(key);

      if (result > 0) {
        this.stats.keys = await this.getKeyCount();
        this.logger.debug('Cache value deleted', { key });
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Error deleting cache value', { key, error });
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const redis = await this.redisService.getClient();
      await redis.flushDb();
      this.stats.keys = 0;
      this.logger.info('Cache cleared');
    } catch (error) {
      this.logger.error('Error clearing cache', { error });
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    try {
      const redis = await this.redisService.getClient();
      const keys = await redis.smembers(`tag:${tag}`);

      if (keys.length > 0) {
        await redis.del(...keys, `tag:${tag}`);
      }

      this.stats.keys = await this.getKeyCount();
      this.logger.info('Cache entries invalidated by tag', { tag, count: keys.length });

      return keys.length;
    } catch (error) {
      this.logger.error('Error invalidating cache by tag', { tag, error });
      return 0;
    }
  }

  private async associateKeyWithTags(key: string, tags: string[]): Promise<void> {
    if (!tags || tags.length === 0) return;

    const redis = await this.redisService.getClient();
    const pipeline = redis.pipeline();

    for (const tag of tags) {
      pipeline.sadd(`tag:${tag}`, key);
    }

    await pipeline.exec();
  }

  private serialize(value: unknown): string {
    const serialized = JSON.stringify(value);

    if (this.shouldCompress(serialized)) {
      return this.compress(serialized);
    }

    return serialized;
  }

  private deserialize<T>(value: string): T {
    if (this.isCompressed(value)) {
      value = this.decompress(value);
    }

    return JSON.parse(value) as T;
  }

  private shouldCompress(value: string): boolean {
    return this.config.compressionThreshold !== undefined &&
           value.length > this.config.compressionThreshold;
  }

  private isCompressed(value: string): boolean {
    return value.startsWith('COMPRESSED:');
  }

  private compress(value: string): string {
    // Implement compression logic here (e.g., using zlib)
    // This is a placeholder implementation
    return `COMPRESSED:${value}`;
  }

  private decompress(value: string): string {
    // Implement decompression logic here
    // This is a placeholder implementation
    return value.substring('COMPRESSED:'.length);
  }

  async getKeyCount(): Promise<number> {
    try {
      const redis = await this.redisService.getClient();
      return await redis.dbSize();
    } catch (error) {
      this.logger.error('Error getting key count', { error });
      return 0;
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const redis = await this.redisService.getClient();
      const info = await redis.info('memory');

      const memoryMatch = info.match(/used_memory:(\d+)/);
      if (memoryMatch) {
        this.stats.memoryUsage = parseInt(memoryMatch[1]);
      }

      this.stats.keys = await this.getKeyCount();

      return { ...this.stats };
    } catch (error) {
      this.logger.error('Error getting cache stats', { error });
      return { ...this.stats };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const redis = await this.redisService.getClient();
      await redis.ping();
      return true;
    } catch (error) {
      this.logger.error('Cache health check failed', { error });
      return false;
    }
  }
}
