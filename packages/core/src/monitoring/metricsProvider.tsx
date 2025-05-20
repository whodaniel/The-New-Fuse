import { Redis } from 'ioredis';
import { Logger } from '@the-new-fuse/utils';
import { MetricType, MetricUnit, Metric, MetricLabel } from './types.js';
import { EventEmitter } from 'events';

const logger = new Logger('MetricsProvider');

export class MetricsProvider extends EventEmitter {
  private redis: Redis;
  private prefix: string;
  private defaultLabels: MetricLabel[];

  constructor(redis: Redis, options: { prefix?: string; defaultLabels?: MetricLabel[] } = {}) {
    super();
    this.redis = redis;
    this.prefix = options.prefix || 'metrics:';
    this.defaultLabels = options.defaultLabels || [];
  }

  async recordCounter(name: string, value = 1, labels: MetricLabel[] = []): Promise<void> {
    await this.recordMetric({
      name,
      type: MetricType.COUNTER,
      value,
      unit: MetricUnit.COUNT,
      timestamp: new Date(),
      labels: [...this.defaultLabels, ...labels]
    });
  }

  async recordGauge(name: string, value: number, unit: MetricUnit, labels: MetricLabel[] = []): Promise<void> {
    await this.recordMetric({
      name,
      type: MetricType.GAUGE,
      value,
      unit,
      timestamp: new Date(),
      labels: [...this.defaultLabels, ...labels]
    });
  }

  async recordHistogram(name: string, value: number, unit: MetricUnit, labels: MetricLabel[] = []): Promise<void> {
    await this.recordMetric({
      name,
      type: MetricType.HISTOGRAM,
      value,
      unit,
      timestamp: new Date(),
      labels: [...this.defaultLabels, ...labels]
    });
  }

  async recordTiming(name: string, valueMs: number, labels: MetricLabel[] = []): Promise<void> {
    await this.recordMetric({
      name,
      type: MetricType.HISTOGRAM,
      value: valueMs,
      unit: MetricUnit.MILLISECONDS,
      timestamp: new Date(),
      labels: [...this.defaultLabels, ...labels]
    });
  }

  async recordMemory(name: string, valueBytes: number, labels: MetricLabel[] = []): Promise<void> {
    await this.recordMetric({
      name,
      type: MetricType.GAUGE,
      value: valueBytes,
      unit: MetricUnit.BYTES,
      timestamp: new Date(),
      labels: [...this.defaultLabels, ...labels]
    });
  }

  private async recordMetric(metric: Metric): Promise<void> {
    try {
      const key = this.getMetricKey(metric);
      const value = JSON.stringify({
        value: metric.value,
        unit: metric.unit,
        labels: metric.labels,
        timestamp: metric.timestamp.getTime()
      });

      // Store in Redis with TTL
      await this.redis.multi()
        .zadd(key, metric.timestamp.getTime(), value)
        .expire(key, 86400) // 24 hours retention
        .exec();

      // Emit metric event for real-time monitoring
      this.emit('metric', metric);
    } catch (error) {
      logger.error('Failed to record metric:', {
        error,
        metric
      });
    }
  }

  private getMetricKey(metric: Metric): string {
    return `${this.prefix}${metric.type}:${metric.name}`;
  }

  async getMetric(name: string, type: MetricType, start?: Date, end?: Date): Promise<Metric[]> {
    const key = `${this.prefix}${type}:${name}`;
    const now = Date.now();
    const startTime = start?.getTime() || (now - 3600000); // Default to last hour
    const endTime = end?.getTime() || now;

    try {
      const results = await this.redis.zrangebyscore(key, startTime, endTime);
      return results.map(result => {
        const data = JSON.parse(result);
        return {
          name,
          type,
          value: data.value,
          unit: data.unit,
          timestamp: new Date(data.timestamp),
          labels: data.labels
        };
      });
    } catch (error) {
      logger.error('Failed to retrieve metrics:', {
        error,
        name,
        type,
        start,
        end
      });
      return [];
    }
  }

  async cleanup(maxAge: number = 86400): Promise<void> {
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
      logger.error('Failed to cleanup metrics:', error);
    }
  }
}