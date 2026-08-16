/**
 * TNF Redis Cache Service
 * Provides distributed caching layer for million-user scale deployments
 * Addresses: ResourceExhausted worker total request limit issues
 */

import type { Redis } from 'ioredis';

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  tls?: boolean;
  sentinel?: {
    master: string;
    nodes: string[];
  };
}

interface CacheEntry<T = unknown> {
  data: T;
  ttl: number;
  createdAt: number;
  key: string;
}

class RedisCacheService {
  private client: Redis | null = null;
  private config: CacheConfig;
  private ready: boolean = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_TLS === 'true',
      ...config,
    };
  }

  async connect(): Promise<void> {
    try {
      const IORedis = await import('ioredis');

      const redisUrl = this.config.password
        ? `rediss://${this.config.password}@${this.config.host}:${this.config.port}`
        : `redis://${this.config.host}:${this.config.port}`;

      this.client = new IORedis.default(redisUrl, {
        tls: this.config.tls ? {} : undefined,
        sentinel: this.config.sentinel
          ? {
              name: 'tnf-sentinel',
              sentinels: this.config.sentinel.nodes.map((node) => ({
                host: node.split(':')[0],
                port: parseInt(node.split(':')[1] || '26379', 10),
              })),
            }
          : undefined,
      });

      await this.client.connect();
      this.ready = true;
      console.log('[RedisCache] Connected successfully');
    } catch (error) {
      console.error('[RedisCache] Connection failed:', error);
      this.ready = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.ready = false;
    }
  }

  isReady(): boolean {
    return this.ready && this.client !== null;
  }

  /**
   * Get cached value with TTL check
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    if (!this.isReady() || !this.client) {
      return null;
    }

    try {
      const cached = await this.client.get(`tnf:${key}`);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();

      // Check if expired
      if (now > entry.createdAt + entry.ttl) {
        await this.client.del(`tnf:${key}`);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error(`[RedisCache] Get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   * When ttl=0, caches indefinitely (cleanup via pattern)
   */
  async set<T = unknown>(key: string, value: T, ttl: number = 3600000): Promise<boolean> {
    if (!this.isReady() || !this.client) {
      return false;
    }

    try {
      const entry: CacheEntry<T> = {
        data: value,
        ttl,
        createdAt: Date.now(),
        key,
      };

      await this.client.setex(`tnf:${key}`, Math.floor(ttl / 1000), JSON.stringify(entry));
      return true;
    } catch (error) {
      console.error(`[RedisCache] Set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async del(key: string): Promise<boolean> {
    if (!this.isReady() || !this.client) {
      return false;
    }

    try {
      const result = await this.client.del(`tnf:${key}`);
      return result === 1;
    } catch (error) {
      console.error(`[RedisCache] Delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Pattern-based cache cleanup - essential for indefinite caches
   */
  async cleanup(pattern: string = 'tnf:*'): Promise<number> {
    if (!this.isReady() || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      // Check TTL for each key
      const expiredKeys: string[] = [];
      for (const key of keys) {
        const entry = await this.client.get(key);
        if (entry) {
          try {
            const parsed: CacheEntry = JSON.parse(entry);
            const now = Date.now();
            if (now > parsed.createdAt + parsed.ttl) {
              expiredKeys.push(key);
            }
          } catch {
            expiredKeys.push(key);
          }
        }
      }

      if (expiredKeys.length > 0) {
        await this.client.del(expiredKeys);
      }

      return expiredKeys.length;
    } catch (error) {
      console.error(`[RedisCache] Cleanup error:`, error);
      return 0;
    }
  }

  /**
   * Get request counter for rate limiting
   */
  async incrementCounter(key: string, expiry: number): Promise<number> {
    if (!this.isReady() || !this.client) {
      return 0;
    }

    try {
      const count = await this.client.incr(`tnf:rate:${key}`);
      await this.client.expire(`tnf:rate:${key}`, expiry);
      return count;
    } catch (error) {
      console.error(`[RedisCache] Counter increment error:`, error);
      return 0;
    }
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(key: string, limit: number, window: number): Promise<boolean> {
    const count = await this.incrementCounter(key, window);
    return count <= limit;
  }

  /**
   * Pipeline multiple operations for atomic execution
   */
  async pipeline<T>(operations: () => T[]): Promise<T[]> {
    if (!this.isReady() || !this.client) {
      return [];
    }

    try {
      const pipeline = this.client.multi();
      const results = operations.map((op) => {
        pipeline.addCommand(op);
        return pipeline;
      });
      return await pipeline.exec();
    } catch (error) {
      console.error(`[RedisCache] Pipeline error:`, error);
      return [];
    }
  }
}

// Singleton instance for application-wide use
let redisInstance: RedisCacheService | null = null;

export function getRedisCache(config?: Partial<CacheConfig>): RedisCacheService {
  if (!redisInstance) {
    redisInstance = new RedisCacheService(config);
  }
  return redisInstance;
}

export { RedisCacheService };
