import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface QuotaConfig {
  requests: number; // Number of requests allowed
  period: number; // Period in seconds
  renewalType: 'fixed' | 'rolling'; // Fixed window or rolling window
}

export interface QuotaTier {
  name: string;
  quotas: {
    hourly: QuotaConfig;
    daily: QuotaConfig;
    monthly: QuotaConfig;
  };
}

export interface QuotaUsage {
  tier: string;
  period: 'hourly' | 'daily' | 'monthly';
  used: number;
  limit: number;
  remaining: number;
  resetTime: Date;
  percentUsed: number;
}

/**
 * Quota management system for API usage tracking and enforcement
 * Supports multiple quota tiers and periods (hourly, daily, monthly)
 */
@Injectable()
export class QuotaManagementService {
  private readonly logger = new Logger(QuotaManagementService.name);
  private redis!: Redis;

  // Predefined quota tiers
  private readonly tiers: Record<string, QuotaTier> = {
    free: {
      name: 'free',
      quotas: {
        hourly: { requests: 1000, period: 3600, renewalType: 'rolling' },
        daily: { requests: 10000, period: 86400, renewalType: 'fixed' },
        monthly: { requests: 100000, period: 2592000, renewalType: 'fixed' },
      },
    },
    pro: {
      name: 'pro',
      quotas: {
        hourly: { requests: 10000, period: 3600, renewalType: 'rolling' },
        daily: { requests: 100000, period: 86400, renewalType: 'fixed' },
        monthly: { requests: 1000000, period: 2592000, renewalType: 'fixed' },
      },
    },
    enterprise: {
      name: 'enterprise',
      quotas: {
        hourly: { requests: 100000, period: 3600, renewalType: 'rolling' },
        daily: { requests: 1000000, period: 86400, renewalType: 'fixed' },
        monthly: { requests: 10000000, period: 2592000, renewalType: 'fixed' },
      },
    },
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
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    });

    this.redis.on('error', (error) => {
      this.logger.error(`Redis connection error: ${error.message}`);
    });

    this.redis.on('connect', () => {
      this.logger.log('Quota management Redis connected');
    });
  }

  /**
   * Check and consume quota
   */
  async consumeQuota(
    userId: string,
    tier: string = 'free'
  ): Promise<{
    allowed: boolean;
    usage: QuotaUsage[];
  }> {
    const quotaTier = this.tiers[tier];
    if (!quotaTier) {
      throw new Error(`Invalid quota tier: ${tier}`);
    }

    const periods: Array<'hourly' | 'daily' | 'monthly'> = ['hourly', 'daily', 'monthly'];
    const usage: QuotaUsage[] = [];
    let allowed = true;

    for (const period of periods) {
      const quota = quotaTier.quotas[period];
      const key = `quota:${tier}:${period}:${userId}`;
      const now = Date.now();

      // Check current usage
      const currentUsage = await this.getUsage(key, quota, now);

      usage.push({
        tier,
        period,
        used: currentUsage.used,
        limit: quota.requests,
        remaining: Math.max(0, quota.requests - currentUsage.used),
        resetTime: currentUsage.resetTime,
        percentUsed: (currentUsage.used / quota.requests) * 100,
      });

      // Check if quota exceeded
      if (currentUsage.used >= quota.requests) {
        allowed = false;
      }
    }

    // If allowed, increment usage
    if (allowed) {
      await this.incrementUsage(userId, tier);
    }

    return { allowed, usage };
  }

  /**
   * Get quota usage for a user
   */
  async getUsage(
    key: string,
    quota: QuotaConfig,
    now: number
  ): Promise<{ used: number; resetTime: Date }> {
    try {
      if (quota.renewalType === 'rolling') {
        return await this.getRollingUsage(key, quota, now);
      } else {
        return await this.getFixedUsage(key, quota, now);
      }
    } catch (error) {
      this.logger.error(`Error getting quota usage for ${key}:`, error);
      return {
        used: 0,
        resetTime: new Date(now + quota.period * 1000),
      };
    }
  }

  /**
   * Get all quota usage for a user
   */
  async getUserQuotas(userId: string, tier: string = 'free'): Promise<QuotaUsage[]> {
    const quotaTier = this.tiers[tier];
    if (!quotaTier) {
      throw new Error(`Invalid quota tier: ${tier}`);
    }

    const periods: Array<'hourly' | 'daily' | 'monthly'> = ['hourly', 'daily', 'monthly'];
    const usage: QuotaUsage[] = [];
    const now = Date.now();

    for (const period of periods) {
      const quota = quotaTier.quotas[period];
      const key = `quota:${tier}:${period}:${userId}`;
      const currentUsage = await this.getUsage(key, quota, now);

      usage.push({
        tier,
        period,
        used: currentUsage.used,
        limit: quota.requests,
        remaining: Math.max(0, quota.requests - currentUsage.used),
        resetTime: currentUsage.resetTime,
        percentUsed: (currentUsage.used / quota.requests) * 100,
      });
    }

    return usage;
  }

  /**
   * Reset quota for a user
   */
  async resetQuota(
    userId: string,
    tier: string,
    period?: 'hourly' | 'daily' | 'monthly'
  ): Promise<void> {
    const periods = period ? [period] : (['hourly', 'daily', 'monthly'] as const);

    const pipeline = this.redis.pipeline();

    for (const p of periods) {
      const key = `quota:${tier}:${p}:${userId}`;
      pipeline.del(key);
    }

    await pipeline.exec();

    this.logger.log(`Reset quota for user ${userId}, tier ${tier}, periods: ${periods.join(', ')}`);
  }

  /**
   * Add custom quota tier
   */
  addTier(name: string, tier: QuotaTier): void {
    this.tiers[name] = tier;
    this.logger.log(`Added custom quota tier: ${name}`);
  }

  /**
   * Get quota tier configuration
   */
  getTier(name: string): QuotaTier | undefined {
    return this.tiers[name];
  }

  /**
   * Get all available tiers
   */
  getAllTiers(): QuotaTier[] {
    return Object.values(this.tiers);
  }

  /**
   * Get quota statistics
   */
  async getQuotaStats(): Promise<{
    totalUsers: number;
    tierDistribution: Record<string, number>;
    topUsers: Array<{ userId: string; tier: string; usage: number }>;
  }> {
    try {
      let cursor = '0';
      const keys: string[] = [];

      // Scan for all quota keys
      do {
        const [nextCursor, foundKeys] = await this.redis.scan(
          cursor,
          'MATCH',
          'quota:*',
          'COUNT',
          100
        );
        cursor = nextCursor;
        keys.push(...foundKeys);
      } while (cursor !== '0');

      // Analyze keys
      const userSet = new Set<string>();
      const tierCounts: Record<string, number> = {};

      for (const key of keys) {
        const parts = key.split(':');
        if (parts.length >= 4) {
          const tier = parts[1];
          const userId = parts[3];
          userSet.add(userId);
          tierCounts[tier] = (tierCounts[tier] || 0) + 1;
        }
      }

      return {
        totalUsers: userSet.size,
        tierDistribution: tierCounts,
        topUsers: [], // Would require more complex analysis
      };
    } catch (error) {
      this.logger.error('Error getting quota stats:', error);
      return {
        totalUsers: 0,
        tierDistribution: {},
        topUsers: [],
      };
    }
  }

  // Private helper methods

  private async getRollingUsage(
    key: string,
    quota: QuotaConfig,
    now: number
  ): Promise<{ used: number; resetTime: Date }> {
    const windowStart = now - quota.period * 1000;

    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    const count = await this.redis.zcard(key);

    return {
      used: count,
      resetTime: new Date(now + quota.period * 1000),
    };
  }

  private async getFixedUsage(
    key: string,
    quota: QuotaConfig,
    now: number
  ): Promise<{ used: number; resetTime: Date }> {
    const currentPeriod = Math.floor(now / (quota.period * 1000));
    const periodKey = `${key}:${currentPeriod}`;

    const count = await this.redis.get(periodKey);
    const used = count ? parseInt(count, 10) : 0;

    const resetTime = new Date((currentPeriod + 1) * quota.period * 1000);

    return { used, resetTime };
  }

  private async incrementUsage(userId: string, tier: string): Promise<void> {
    const quotaTier = this.tiers[tier];
    const now = Date.now();
    const pipeline = this.redis.pipeline();

    // Increment hourly (rolling)
    const hourlyKey = `quota:${tier}:hourly:${userId}`;
    pipeline.zadd(hourlyKey, now, `${now}-${Math.random()}`);
    pipeline.expire(hourlyKey, quotaTier.quotas.hourly.period);

    // Increment daily (fixed)
    const currentDay = Math.floor(now / (quotaTier.quotas.daily.period * 1000));
    const dailyKey = `quota:${tier}:daily:${userId}:${currentDay}`;
    pipeline.incr(dailyKey);
    pipeline.expire(dailyKey, quotaTier.quotas.daily.period);

    // Increment monthly (fixed)
    const currentMonth = Math.floor(now / (quotaTier.quotas.monthly.period * 1000));
    const monthlyKey = `quota:${tier}:monthly:${userId}:${currentMonth}`;
    pipeline.incr(monthlyKey);
    pipeline.expire(monthlyKey, quotaTier.quotas.monthly.period);

    await pipeline.exec();
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    this.logger.log('Quota management service destroyed');
  }
}
