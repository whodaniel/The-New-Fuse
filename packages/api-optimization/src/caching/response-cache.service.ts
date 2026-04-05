import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LRUCache } from 'lru-cache';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';

export interface CacheOptions {
  ttl?: number;              // Time to live in seconds
  tags?: string[];           // Cache tags for invalidation
  compress?: boolean;        // Enable compression
  namespace?: string;        // Cache namespace
  skipCache?: boolean;       // Skip caching for this request
  refreshThreshold?: number; // Refresh cache if TTL < threshold
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
  etag?: string;
}

/**
 * Advanced response caching service with:
 * - Redis backend for distributed caching
 * - LRU in-memory cache for frequently accessed data
 * - Cache warming and prefetching
 * - Tag-based invalidation
 * - ETags for conditional requests
 * - Cache statistics and monitoring
 */
@Injectable()
export class ResponseCacheService {
  private readonly logger = new Logger(ResponseCacheService.name);
  private memoryCache!: LRUCache<string, CacheEntry>;

  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
    memoryHits: 0,
    redisHits: 0
  };

  constructor(
    private configService: ConfigService,
    private redisService: UnifiedRedisService
  ) {
    this.initializeMemoryCache();
  }

  private initializeMemoryCache(): void {
    // LRU cache for frequently accessed data
    this.memoryCache = new LRUCache<string, CacheEntry>({
      max: 500, // Maximum 500 items in memory
      maxSize: 50 * 1024 * 1024, // 50MB max size
      sizeCalculation: (entry) => {
        return JSON.stringify(entry.data).length;
      },
      ttl: 60000, // 1 minute TTL for memory cache
      allowStale: false,
      updateAgeOnGet: true,
      updateAgeOnHas: false
    });

    this.logger.log('Memory cache initialized');
  }

  /**
   * Get cached data with fallback to Redis
   */
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const namespace = options.namespace || 'cache';
    const cacheKey = `${namespace}:${key}`;

    try {
      // Check memory cache first (L1 cache)
      const memoryEntry = this.memoryCache.get(cacheKey);
      if (memoryEntry && !this.isExpired(memoryEntry)) {
        this.stats.hits++;
        this.stats.memoryHits++;
        this.logger.debug(`Memory cache hit for key: ${cacheKey}`);

        // Refresh if close to expiry
        if (options.refreshThreshold && this.shouldRefresh(memoryEntry, options.refreshThreshold)) {
          this.logger.debug(`Cache refresh threshold reached for key: ${cacheKey}`);
          // Return stale data while refreshing in background
          // The caller should implement refresh logic
        }

        return memoryEntry.data as T;
      }

      // Check Redis (L2 cache)
      const redisData = await this.redisService.get(cacheKey);
      if (redisData) {
        const entry: CacheEntry<T> = JSON.parse(redisData);

        if (!this.isExpired(entry)) {
          this.stats.hits++;
          this.stats.redisHits++;
          this.logger.debug(`Redis cache hit for key: ${cacheKey}`);

          // Populate memory cache
          this.memoryCache.set(cacheKey, entry);

          return entry.data;
        } else {
          // Remove expired entry
          await this.redisService.del(cacheKey);
        }
      }

      this.stats.misses++;
      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      return null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${cacheKey}:`, error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set<T = any>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    const namespace = options.namespace || 'cache';
    const cacheKey = `${namespace}:${key}`;
    const ttl = options.ttl || 300; // Default 5 minutes

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        tags: options.tags,
        etag: this.generateETag(data)
      };

      // Store in Redis
      await this.redisService.set(cacheKey, JSON.stringify(entry), ttl);

      // Store in memory cache
      this.memoryCache.set(cacheKey, entry, { ttl: ttl * 1000 });

      // Handle tags for invalidation
      if (options.tags?.length) {
        await this.tagKey(cacheKey, options.tags, ttl);
      }

      this.stats.sets++;
      this.logger.debug(`Cache set for key: ${cacheKey}, TTL: ${ttl}s`);
      return true;
    } catch (error) {
      this.logger.error(`Cache set error for key ${cacheKey}:`, error);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string, namespace = 'cache'): Promise<boolean> {
    const cacheKey = `${namespace}:${key}`;

    try {
      // Remove from both caches
      this.memoryCache.delete(cacheKey);
      const deleted = await this.redisService.del(cacheKey);

      this.logger.debug(`Cache deleted for key: ${cacheKey}`);
      return deleted > 0;
    } catch (error) {
      this.logger.error(`Cache delete error for key ${cacheKey}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTag(tag: string): Promise<number> {
    try {
      const tagKey = `tag:${tag}`;
      const keys = await this.redisService.smembers(tagKey);

      if (keys.length === 0) {
        return 0;
      }

      // Delete all keys associated with the tag
      await Promise.all(
        keys.map((key) => {
          this.memoryCache.delete(key);
          return this.redisService.del(key);
        })
      );
      await this.redisService.del(tagKey);

      this.stats.invalidations += keys.length;
      this.logger.log(`Invalidated ${keys.length} cache entries for tag: ${tag}`);

      return keys.length;
    } catch (error) {
      this.logger.error(`Cache invalidation error for tag ${tag}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      let cursor = '0';
      const keys: string[] = [];

      // Scan for matching keys
      do {
        const [nextCursor, foundKeys] = await this.redisService.scan(cursor, pattern, 100);
        cursor = nextCursor;
        keys.push(...foundKeys);
      } while (cursor !== '0');

      if (keys.length === 0) {
        return 0;
      }

      // Delete all matching keys
      await Promise.all(
        keys.map((key) => {
          this.memoryCache.delete(key);
          return this.redisService.del(key);
        })
      );

      this.stats.invalidations += keys.length;
      this.logger.log(`Invalidated ${keys.length} cache entries for pattern: ${pattern}`);

      return keys.length;
    } catch (error) {
      this.logger.error(`Cache invalidation error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Batch get multiple keys
   */
  async mget<T = any>(keys: string[], namespace = 'cache'): Promise<Array<T | null>> {
    const cacheKeys = keys.map(k => `${namespace}:${k}`);

    try {
      const redisValues = await this.redisService.mget(...cacheKeys);

      return redisValues.map((value, index) => {
        if (!value) {
          this.stats.misses++;
          return null;
        }

        try {
          const entry: CacheEntry<T> = JSON.parse(value);
          if (!this.isExpired(entry)) {
            this.stats.hits++;
            return entry.data;
          }
          this.stats.misses++;
          return null;
        } catch {
          this.stats.misses++;
          return null;
        }
      });
    } catch (error) {
      this.logger.error('Batch get error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryCacheSize: this.memoryCache.size,
      memoryCacheMax: this.memoryCache.max
    };
  }

  /**
   * Clear all caches
   */
  async clearAll(namespace?: string): Promise<void> {
    try {
      if (namespace) {
        await this.invalidateByPattern(`${namespace}:*`);
      } else {
        // Clear memory cache
        this.memoryCache.clear();

        // Clear Redis cache
        await this.redisService.flushdb();
      }

      this.logger.log('Cache cleared');
    } catch (error) {
      this.logger.error('Cache clear error:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; latency: number }> {
    const startTime = Date.now();

    try {
      await this.redisService.ping();
      return {
        status: 'healthy',
        latency: Date.now() - startTime
      };
    } catch (error) {
      this.logger.error('Cache health check failed:', error);
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime
      };
    }
  }

  // Private helper methods

  private async tagKey(key: string, tags: string[], ttl: number): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        await this.redisService.sadd(tagKey, key);
        await this.redisService.expire(tagKey, ttl + 60); // Keep tag slightly longer
      }
    } catch (error) {
      this.logger.error('Error tagging key:', error);
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    const age = (Date.now() - entry.timestamp) / 1000;
    return age > entry.ttl;
  }

  private shouldRefresh(entry: CacheEntry, threshold: number): boolean {
    const age = (Date.now() - entry.timestamp) / 1000;
    const remainingTtl = entry.ttl - age;
    return remainingTtl < threshold;
  }

  private generateETag(data: any): string {
    // Simple hash for ETag generation
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `"${Math.abs(hash).toString(36)}"`;
  }

  async onModuleDestroy(): Promise<void> {
    this.memoryCache.clear();
    this.logger.log('Response cache service destroyed');
  }
}
