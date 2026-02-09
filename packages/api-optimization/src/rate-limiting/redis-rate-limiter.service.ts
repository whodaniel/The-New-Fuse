import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface RateLimitConfig {
  points: number;           // Number of requests
  duration: number;         // Time window in seconds
  blockDuration?: number;   // Block duration in seconds (default: duration)
  keyPrefix?: string;       // Redis key prefix
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  totalHits: number;
}

export interface RateLimitTier {
  name: string;
  points: number;
  duration: number;
  blockDuration?: number;
}

/**
 * Redis-based rate limiter with advanced features:
 * - Sliding window algorithm
 * - Per-user/IP rate limiting
 * - Tiered rate limits (free, pro, enterprise)
 * - Distributed rate limiting across multiple servers
 * - Rate limit monitoring and metrics
 */
@Injectable()
export class RedisRateLimiterService {
  private readonly logger = new Logger(RedisRateLimiterService.name);
  private redis!: Redis;

  // Predefined rate limit tiers
  private readonly tiers: Record<string, RateLimitTier> = {
    free: {
      name: 'free',
      points: 100,        // 100 requests
      duration: 60,       // per minute
      blockDuration: 300  // block for 5 minutes
    },
    pro: {
      name: 'pro',
      points: 1000,       // 1000 requests
      duration: 60,       // per minute
      blockDuration: 60   // block for 1 minute
    },
    enterprise: {
      name: 'enterprise',
      points: 10000,      // 10000 requests
      duration: 60,       // per minute
      blockDuration: 30   // block for 30 seconds
    },
    burst: {
      name: 'burst',
      points: 10,         // 10 requests
      duration: 1,        // per second
      blockDuration: 5    // block for 5 seconds
    }
  };

  constructor(private configService: ConfigService) {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const redisHost = this.configService.get('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get('REDIS_PORT', 6379);
    const redisPassword = this.configService.get('REDIS_PASSWORD');

    this.redis = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });

    this.redis.on('error', (error) => {
      this.logger.error(`Redis connection error: ${error.message}`);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis rate limiter connected successfully');
    });
  }

  /**
   * Check rate limit using sliding window algorithm
   */
  async consume(
    key: string,
    config: RateLimitConfig = this.tiers.free
  ): Promise<RateLimitResult> {
    const keyPrefix = config.keyPrefix || 'ratelimit';
    const redisKey = `${keyPrefix}:${key}`;
    const now = Date.now();
    const windowStart = now - (config.duration * 1000);

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();

      // Remove old entries outside the window
      pipeline.zremrangebyscore(redisKey, 0, windowStart);

      // Count current requests in window
      pipeline.zcard(redisKey);

      // Add current request
      pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);

      // Set expiry on the key
      pipeline.expire(redisKey, config.duration);

      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Pipeline execution failed');
      }

      // Get the count before adding current request
      const currentCount = (results[1][1] as number) || 0;
      const totalHits = currentCount + 1;
      const remaining = Math.max(0, config.points - totalHits);
      const allowed = totalHits <= config.points;

      // Calculate reset time
      const resetTime = new Date(now + (config.duration * 1000));

      // If blocked, set block duration
      if (!allowed && config.blockDuration) {
        await this.redis.setex(
          `${redisKey}:blocked`,
          config.blockDuration,
          '1'
        );
      }

      return {
        allowed,
        remaining,
        resetTime,
        retryAfter: allowed ? undefined : config.blockDuration || config.duration,
        totalHits
      };
    } catch (error) {
      this.logger.error(`Rate limit check error for key ${key}:`, error);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: config.points,
        resetTime: new Date(now + (config.duration * 1000)),
        totalHits: 0
      };
    }
  }

  /**
   * Check if a key is currently blocked
   */
  async isBlocked(key: string, keyPrefix = 'ratelimit'): Promise<boolean> {
    try {
      const blocked = await this.redis.get(`${keyPrefix}:${key}:blocked`);
      return blocked === '1';
    } catch (error) {
      this.logger.error(`Error checking block status for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get rate limit for a specific tier
   */
  getTierConfig(tier: string): RateLimitConfig {
    return this.tiers[tier] || this.tiers.free;
  }

  /**
   * Add custom rate limit tier
   */
  addTier(name: string, config: RateLimitTier): void {
    this.tiers[name] = config;
    this.logger.log(`Added custom rate limit tier: ${name}`);
  }

  /**
   * Get remaining points for a key
   */
  async getRemaining(
    key: string,
    config: RateLimitConfig = this.tiers.free
  ): Promise<number> {
    const keyPrefix = config.keyPrefix || 'ratelimit';
    const redisKey = `${keyPrefix}:${key}`;
    const now = Date.now();
    const windowStart = now - (config.duration * 1000);

    try {
      // Count requests in current window
      const count = await this.redis.zcount(redisKey, windowStart, now);
      return Math.max(0, config.points - count);
    } catch (error) {
      this.logger.error(`Error getting remaining points for key ${key}:`, error);
      return config.points;
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  async reset(key: string, keyPrefix = 'ratelimit'): Promise<void> {
    try {
      await this.redis.del(`${keyPrefix}:${key}`);
      await this.redis.del(`${keyPrefix}:${key}:blocked`);
      this.logger.log(`Reset rate limit for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error resetting rate limit for key ${key}:`, error);
    }
  }

  /**
   * Get rate limit metrics for monitoring
   */
  async getMetrics(keyPattern = 'ratelimit:*'): Promise<{
    totalKeys: number;
    blockedKeys: number;
    topConsumers: Array<{ key: string; count: number }>;
  }> {
    try {
      // Scan for all rate limit keys
      const keys: string[] = [];
      let cursor = '0';

      do {
        const [nextCursor, foundKeys] = await this.redis.scan(
          cursor,
          'MATCH',
          keyPattern,
          'COUNT',
          100
        );
        cursor = nextCursor;
        keys.push(...foundKeys);
      } while (cursor !== '0');

      // Filter blocked keys
      const blockedKeys = keys.filter(k => k.endsWith(':blocked'));

      // Get top consumers
      const topConsumers: Array<{ key: string; count: number }> = [];
      const regularKeys = keys.filter(k => !k.endsWith(':blocked'));

      for (const key of regularKeys.slice(0, 10)) {
        const count = await this.redis.zcard(key);
        topConsumers.push({ key, count });
      }

      topConsumers.sort((a, b) => b.count - a.count);

      return {
        totalKeys: regularKeys.length,
        blockedKeys: blockedKeys.length,
        topConsumers: topConsumers.slice(0, 10)
      };
    } catch (error) {
      this.logger.error('Error getting rate limit metrics:', error);
      return {
        totalKeys: 0,
        blockedKeys: 0,
        topConsumers: []
      };
    }
  }

  /**
   * Penalty - temporarily reduce rate limit for a key
   */
  async applyPenalty(
    key: string,
    penaltyPoints: number,
    duration: number,
    keyPrefix = 'ratelimit'
  ): Promise<void> {
    try {
      const redisKey = `${keyPrefix}:${key}:penalty`;
      await this.redis.setex(redisKey, duration, penaltyPoints.toString());
      this.logger.warn(`Applied penalty of ${penaltyPoints} points to key: ${key}`);
    } catch (error) {
      this.logger.error(`Error applying penalty to key ${key}:`, error);
    }
  }

  /**
   * Get penalty points for a key
   */
  async getPenalty(key: string, keyPrefix = 'ratelimit'): Promise<number> {
    try {
      const penalty = await this.redis.get(`${keyPrefix}:${key}:penalty`);
      return penalty ? parseInt(penalty, 10) : 0;
    } catch (error) {
      this.logger.error(`Error getting penalty for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<{ status: string; latency: number }> {
    const startTime = Date.now();

    try {
      await this.redis.ping();
      return {
        status: 'healthy',
        latency: Date.now() - startTime
      };
    } catch (error) {
      this.logger.error('Rate limiter health check failed:', error);
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime
      };
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    this.logger.log('Redis rate limiter disconnected');
  }
}
