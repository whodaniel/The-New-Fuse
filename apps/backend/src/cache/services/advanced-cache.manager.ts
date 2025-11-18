import { Injectable, Logger, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheConfig } from '../config/cache.config';
import { CacheMonitoringService } from './cache-monitoring.service';

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
  compress?: boolean;
  tags?: string[];
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

@Injectable()
export class AdvancedCacheManager implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AdvancedCacheManager.name);
  private redisClient: Redis;
  private readonly keyPrefix: string;
  private readonly defaultTTL: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly monitoringService: CacheMonitoringService,
  ) {
    const cacheConfig = this.configService.get<CacheConfig>('cache');
    this.keyPrefix = cacheConfig?.keyPrefix || 'fuse:';
    this.defaultTTL = cacheConfig?.redis.ttl || 3600;
  }

  async onModuleInit() {
    const cacheConfig = this.configService.get<CacheConfig>('cache');

    this.redisClient = new Redis({
      host: cacheConfig.redis.host,
      port: cacheConfig.redis.port,
      password: cacheConfig.redis.password,
      db: cacheConfig.redis.db,
      maxRetriesPerRequest: cacheConfig.redis.maxRetriesPerRequest,
      enableReadyCheck: cacheConfig.redis.enableReadyCheck,
      retryStrategy: cacheConfig.redis.retryStrategy,
      lazyConnect: false,
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Connected to Redis for caching');
    });

    this.redisClient.on('error', (error) => {
      this.logger.error('Redis cache connection error:', error);
    });

    this.redisClient.on('ready', () => {
      this.logger.log('Redis cache client ready');
    });

    try {
      await this.redisClient.ping();
      this.logger.log('Redis cache health check passed');
    } catch (error) {
      this.logger.error('Redis cache health check failed:', error);
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Redis cache connection closed');
    }
  }

  /**
   * Generate a cache key with prefix
   */
  private generateKey(key: string, prefix?: string): string {
    const finalPrefix = prefix || this.keyPrefix;
    return `${finalPrefix}${key}`;
  }

  /**
   * Cache-aside pattern: Get from cache or compute
   * @param key Cache key
   * @param factory Function to compute value if cache miss
   * @param options Cache options
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = this.generateKey(key, options.prefix);

    try {
      // Try to get from cache
      const cached = await this.get<T>(key, options);

      if (cached !== null && cached !== undefined) {
        this.monitoringService.recordHit(key, Date.now() - startTime);
        return cached;
      }

      // Cache miss - compute value
      this.monitoringService.recordMiss(key, Date.now() - startTime);

      const value = await factory();

      // Store in cache (fire and forget)
      this.set(key, value, options).catch((error) => {
        this.logger.error(`Failed to cache value for key ${cacheKey}:`, error);
      });

      return value;
    } catch (error) {
      this.logger.error(`Cache-aside error for key ${cacheKey}:`, error);
      // Fallback to computing value
      return factory();
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const cacheKey = this.generateKey(key, options.prefix);

    try {
      const value = await this.redisClient.get(cacheKey);

      if (!value) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(value);
      return entry.data;
    } catch (error) {
      this.logger.error(`Failed to get cache for key ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<void> {
    const cacheKey = this.generateKey(key, options.prefix);
    const ttl = options.ttl || this.defaultTTL;

    try {
      const entry: CacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        ttl,
        tags: options.tags,
      };

      const serialized = JSON.stringify(entry);

      await this.redisClient.setex(cacheKey, ttl, serialized);

      // Store tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.addKeyToTags(cacheKey, options.tags, ttl);
      }

      this.logger.debug(`Cached key ${cacheKey} with TTL ${ttl}s`);
    } catch (error) {
      this.logger.error(`Failed to set cache for key ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.generateKey(key, options.prefix);

    try {
      await this.redisClient.del(cacheKey);
      this.logger.debug(`Deleted cache key ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Failed to delete cache for key ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    const fullPattern = this.generateKey(pattern, options.prefix);

    try {
      const keys = await this.redisClient.keys(fullPattern);

      if (keys.length === 0) {
        return 0;
      }

      await this.redisClient.del(...keys);
      this.logger.debug(`Deleted ${keys.length} keys matching pattern ${fullPattern}`);

      return keys.length;
    } catch (error) {
      this.logger.error(`Failed to delete pattern ${fullPattern}:`, error);
      throw error;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const cacheKey = this.generateKey(key, options.prefix);

    try {
      const result = await this.redisClient.exists(cacheKey);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence for key ${cacheKey}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async getTTL(key: string, options: CacheOptions = {}): Promise<number> {
    const cacheKey = this.generateKey(key, options.prefix);

    try {
      return await this.redisClient.ttl(cacheKey);
    } catch (error) {
      this.logger.error(`Failed to get TTL for key ${cacheKey}:`, error);
      return -1;
    }
  }

  /**
   * Refresh TTL for a key
   */
  async refreshTTL(key: string, ttl?: number, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.generateKey(key, options.prefix);
    const newTTL = ttl || this.defaultTTL;

    try {
      await this.redisClient.expire(cacheKey, newTTL);
      this.logger.debug(`Refreshed TTL for key ${cacheKey} to ${newTTL}s`);
    } catch (error) {
      this.logger.error(`Failed to refresh TTL for key ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Add key to tag sets for tag-based invalidation
   */
  private async addKeyToTags(key: string, tags: string[], ttl: number): Promise<void> {
    const pipeline = this.redisClient.pipeline();

    for (const tag of tags) {
      const tagKey = this.generateKey(`tag:${tag}`);
      pipeline.sadd(tagKey, key);
      pipeline.expire(tagKey, ttl + 60); // Keep tags slightly longer
    }

    await pipeline.exec();
  }

  /**
   * Invalidate all keys with a specific tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    const tagKey = this.generateKey(`tag:${tag}`);

    try {
      const keys = await this.redisClient.smembers(tagKey);

      if (keys.length === 0) {
        return 0;
      }

      // Delete all keys and the tag set
      await this.redisClient.del(...keys, tagKey);

      this.logger.debug(`Invalidated ${keys.length} keys with tag ${tag}`);
      return keys.length;
    } catch (error) {
      this.logger.error(`Failed to invalidate tag ${tag}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate multiple tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let totalInvalidated = 0;

    for (const tag of tags) {
      totalInvalidated += await this.invalidateByTag(tag);
    }

    return totalInvalidated;
  }

  /**
   * Get multiple keys at once
   */
  async mget<T>(keys: string[], options: CacheOptions = {}): Promise<Array<T | null>> {
    const cacheKeys = keys.map((key) => this.generateKey(key, options.prefix));

    try {
      const values = await this.redisClient.mget(...cacheKeys);

      return values.map((value) => {
        if (!value) return null;

        try {
          const entry: CacheEntry<T> = JSON.parse(value);
          return entry.data;
        } catch {
          return null;
        }
      });
    } catch (error) {
      this.logger.error('Failed to get multiple cache keys:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple keys at once
   */
  async mset<T>(
    entries: Array<{ key: string; value: T; ttl?: number }>,
    options: CacheOptions = {},
  ): Promise<void> {
    try {
      const pipeline = this.redisClient.pipeline();

      for (const entry of entries) {
        const cacheKey = this.generateKey(entry.key, options.prefix);
        const ttl = entry.ttl || this.defaultTTL;

        const cacheEntry: CacheEntry<T> = {
          data: entry.value,
          timestamp: Date.now(),
          ttl,
          tags: options.tags,
        };

        const serialized = JSON.stringify(cacheEntry);
        pipeline.setex(cacheKey, ttl, serialized);
      }

      await pipeline.exec();
      this.logger.debug(`Cached ${entries.length} keys`);
    } catch (error) {
      this.logger.error('Failed to set multiple cache keys:', error);
      throw error;
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async clear(): Promise<void> {
    try {
      const keys = await this.redisClient.keys(`${this.keyPrefix}*`);

      if (keys.length > 0) {
        await this.redisClient.del(...keys);
        this.logger.warn(`Cleared ${keys.length} cache keys`);
      }
    } catch (error) {
      this.logger.error('Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    dbSize: number;
    memory: string;
    hitRate: number;
    missRate: number;
  }> {
    try {
      const info = await this.redisClient.info('stats');
      const memory = await this.redisClient.info('memory');
      const dbSize = await this.redisClient.dbsize();

      const { hitRate, missRate } = this.monitoringService.getStats();

      return {
        dbSize,
        memory: this.parseMemoryInfo(memory),
        hitRate,
        missRate,
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return {
        dbSize: 0,
        memory: '0B',
        hitRate: 0,
        missRate: 0,
      };
    }
  }

  private parseMemoryInfo(info: string): string {
    const match = info.match(/used_memory_human:([^\r\n]+)/);
    return match ? match[1] : '0B';
  }

  /**
   * Get the underlying Redis client (use with caution)
   */
  getClient(): Redis {
    return this.redisClient;
  }
}
