import { Injectable } from '@nestjs/common';
import { RedisService } from './redisService.js';
import { CacheService } from './cacheService.js';

@Injectable()
export class HealthService {
  constructor(
    private readonly redis: RedisService,
    private readonly cache: CacheService,
  ) {}

  async checkHealth(): Promise<{
    status: string;
    redis: boolean;
    cache: {
      status: boolean;
      stats: {
        hitRate: number;
        missRate: number;
        size: number;
      };
    };
  }> {
    try {
      // Check Redis health
      await this.redis.ping();
      
      // Check cache health
      const stats = await this.cache.getCacheStats();

      return {
        status: 'healthy',
        redis: true,
        cache: {
          status: true,
          stats,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        redis: false,
        cache: {
          status: false,
          stats: {
            hitRate: 0,
            missRate: 0,
            size: 0,
          },
        },
      };
    }
  }
} 
