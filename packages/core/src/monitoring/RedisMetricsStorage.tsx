import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';
import { MetricsStorage, MetricValue, MetricsQuery } from './interfaces.js';
import { MetricType, MetricUnit } from './types.js';

export class RedisMetricsStorage implements MetricsStorage {
  private readonly logger = new Logger('RedisMetricsStorage');
  private readonly prefix: string;
  private readonly redis: Redis;

  constructor(redis: Redis, prefix = 'metrics:') {
    this.redis = redis;
    this.prefix = prefix;
  }

  private getKey(name: string, type: MetricType): string {
    return `${this.prefix}${type}:${name}`;
  }

  async store(metric: MetricValue): Promise<void> {
    try {
      const key = this.getKey(metric.name, metric.type);
      const value = JSON.stringify({
        value: metric.value,
        unit: metric.unit,
        labels: metric.labels,
        timestamp: metric.timestamp.getTime()
      });

      await this.redis.zadd(key, metric.timestamp.getTime(), value);
    } catch (error) {
      this.logger.error(`Failed to store metric ${metric.name}:`, error);
      throw error;
    }
  }

  async retrieve(query: MetricsQuery): Promise<MetricValue[]> {
    try {
      const key = this.getKey(query.name, query.type);
      const startScore = query.start?.getTime() ?? '-inf';
      const endScore = query.end?.getTime() ?? '+inf';

      const results = await this.redis.zrangebyscore(key, startScore, endScore);
      
      return results.map(result => {
        const data = JSON.parse(result);
        return {
          name: query.name,
          type: query.type,
          value: data.value,
          unit: data.unit as MetricUnit,
          timestamp: new Date(data.timestamp),
          labels: data.labels
        };
      }).filter(metric => {
        if (!query.labels) return true;
        return Object.entries(query.labels).every(([key, value]) => 
          metric.labels?.some(label => label.name === key && label.value === value)
        );
      });
    } catch (error) {
      this.logger.error(`Failed to retrieve metrics for ${query.name}:`, error);
      return [];
    }
  }

  async cleanup(maxAge: number): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.prefix}*`);
      const now = Date.now();
      const minScore = now - (maxAge * 1000);

      await Promise.all(
        keys.map(key =>
          this.redis.zremrangebyscore(key, '-inf', minScore)
        )
      );
    } catch (error) {
      this.logger.error('Failed to cleanup metrics:', error);
      throw error;
    }
  }

  async getStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {
      totalMetrics: 0,
      memoryUsage: 0,
      oldestTimestamp: Date.now(),
      newestTimestamp: 0
    };

    try {
      const keys = await this.redis.keys(`${this.prefix}*`);
      
      for (const key of keys) {
        const count = await this.redis.zcard(key);
        stats.totalMetrics += count;

        if (count > 0) {
          const [oldest] = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
          const [newest] = await this.redis.zrange(key, -1, -1, 'WITHSCORES');
          
          if (oldest) {
            stats.oldestTimestamp = Math.min(stats.oldestTimestamp, parseInt(oldest));
          }
          if (newest) {
            stats.newestTimestamp = Math.max(stats.newestTimestamp, parseInt(newest));
          }
        }
      }

      const info = await this.redis.info('memory');
      const match = info.match(/used_memory:(\d+)/);
      if (match) {
        stats.memoryUsage = parseInt(match[1]);
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get metrics stats:', error);
      throw error;
    }
  }
}