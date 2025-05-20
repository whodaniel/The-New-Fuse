import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { LoggerService } from '../logging/LoggerService.js';
import { MetricsService } from '../monitoring/MetricsService.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface CacheConfig {
  ttl?: number;
  prefix?: string;
  serializer?: (data: any) => string;
  deserializer?: (data: string) => any;
}

interface CacheStats {
  hitRate: number;
  missRate: number;
  size: number;
  memory: number;
  evictions: number;
  operations: {
    gets: number;
    sets: number;
    deletes: number;
  };
}

@Injectable()
export class CacheManager implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private statsInterval: NodeJS.Timeout;

  constructor(
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    await this.connect();
    this.startStatsCollection();
  }

  async onModuleDestroy() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    await this.disconnect();
  }

  private async connect() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        enableOfflineQueue: false,
        retryStrategy: (times) => Math.min(times * 50, 2000)
      });

      this.redis.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
        this.metrics.incrementCounter('cache.connection.errors');
      });

      this.redis.on('connect', () => {
        this.logger.info('Connected to Redis cache');
        this.metrics.incrementCounter('cache.connection.successes');
      });
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  private async disconnect() {
    try {
      await this.redis.quit();
      this.logger.info('Disconnected from Redis cache');
    } catch (error) {
      this.logger.error('Error disconnecting from Redis:', error);
    }
  }

  private startStatsCollection() {
    this.statsInterval = setInterval(async () => {
      try {
        const stats = await this.getStats();
        this.metrics.gauge('cache.hit_rate', stats.hitRate);
        this.metrics.gauge('cache.memory_usage', stats.memory);
        this.metrics.gauge('cache.total_keys', stats.size);
        this.metrics.gauge('cache.evictions', stats.evictions);

        this.eventEmitter.emit('cache.stats', stats);
      } catch (error) {
        this.logger.error('Failed to collect cache stats:', error);
      }
    }, 60000); // Collect stats every minute
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      
      if (value) {
        this.metrics.incrementCounter('cache.hits');
        return JSON.parse(value);
      }
      
      this.metrics.incrementCounter('cache.misses');
      return null;
    } catch (error) {
      this.logger.error('Cache get error:', error);
      this.metrics.incrementCounter('cache.errors');
      return null;
    }
  }

  async set(
    key: string,
    value: any,
    config: CacheConfig = {}
  ): Promise<boolean> {
    try {
      const serialized = config.serializer 
        ? config.serializer(value)
        : JSON.stringify(value);

      if (config.ttl) {
        await this.redis.setex(key, config.ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }

      this.metrics.incrementCounter('cache.sets');
      return true;
    } catch (error) {
      this.logger.error('Cache set error:', error);
      this.metrics.incrementCounter('cache.errors');
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      this.metrics.incrementCounter('cache.deletes');
      return true;
    } catch (error) {
      this.logger.error('Cache delete error:', error);
      this.metrics.incrementCounter('cache.errors');
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        const deleted = await this.redis.del(...keys);
        this.metrics.incrementCounter('cache.pattern_deletes');
        this.metrics.gauge('cache.keys_deleted', deleted);
        return deleted;
      }
      return 0;
    } catch (error) {
      this.logger.error('Cache pattern invalidation error:', error);
      this.metrics.incrementCounter('cache.errors');
      return 0;
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info();
      const stats: CacheStats = {
        hitRate: 0,
        missRate: 0,
        size: 0,
        memory: 0,
        evictions: 0,
        operations: {
          gets: 0,
          sets: 0,
          deletes: 0
        }
      };

      // Parse Redis INFO command output
      const lines = info.split('\n');
      for (const line of lines) {
        if (line.includes('keyspace_hits')) {
          stats.operations.gets = parseInt(line.split(':')[1]);
        } else if (line.includes('keyspace_misses')) {
          const misses = parseInt(line.split(':')[1]);
          stats.operations.gets += misses;
          stats.hitRate = stats.operations.gets > 0 
            ? (stats.operations.gets - misses) / stats.operations.gets 
            : 0;
          stats.missRate = 1 - stats.hitRate;
        } else if (line.includes('used_memory')) {
          stats.memory = parseInt(line.split(':')[1]);
        } else if (line.includes('evicted_keys')) {
          stats.evictions = parseInt(line.split(':')[1]);
        } else if (line.includes('db0')) {
          const dbStats = line.split(':')[1];
          const matches = dbStats.match(/keys=(\d+)/);
          if (matches) {
            stats.size = parseInt(matches[1]);
          }
        }
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      throw error;
    }
  }
}