import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';
import { MetricValue, MetricType, MetricUnit } from './types.js';
import { Logger } from '@nestjs/common';

interface AggregatedMetric {
  count: number;
  sum: number;
  min: number;
  max: number;
  last: number;
  timestamp: number;
}

@Injectable()
export class RealTimeMetricsAggregator implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('RealTimeMetricsAggregator');
  private readonly aggregationWindows = new Map<string, AggregatedMetric>();
  private flushInterval: NodeJS.Timer;
  private readonly windowSize = 10000; // 10 second windows
  private readonly retentionTime = 3600000; // 1 hour retention

  constructor(
    private readonly redis: Redis,
    private readonly eventBus: EventEmitter2
  ) {}

  onModuleInit() {
    this.startAggregation();
  }

  onModuleDestroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
  }

  private startAggregation() {
    // Subscribe to metric events
    this.eventBus.on('metric.*', (metric: MetricValue) => {
      this.aggregateMetric(metric);
    });

    // Flush aggregated data periodically
    this.flushInterval = setInterval(() => {
      this.flushAggregations();
    }, this.windowSize);
  }

  private aggregateMetric(metric: MetricValue) {
    const key = this.getMetricKey(metric);
    let aggregation = this.aggregationWindows.get(key);

    if (!aggregation) {
      aggregation = {
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        last: 0,
        timestamp: Date.now()
      };
      this.aggregationWindows.set(key, aggregation);
    }

    aggregation.count++;
    aggregation.sum += metric.value;
    aggregation.min = Math.min(aggregation.min, metric.value);
    aggregation.max = Math.max(aggregation.max, metric.value);
    aggregation.last = metric.value;
  }

  private async flushAggregations() {
    const now = Date.now();
    const pipeline = this.redis.pipeline();

    for (const [key, aggregation] of this.aggregationWindows.entries()) {
      const windowKey = `${key}:${Math.floor(now / this.windowSize)}`;
      
      pipeline.hmset(windowKey, {
        count: aggregation.count,
        sum: aggregation.sum,
        min: aggregation.min,
        max: aggregation.max,
        last: aggregation.last,
        timestamp: now
      });

      pipeline.expire(windowKey, Math.ceil(this.retentionTime / 1000));

      // Emit real-time updates
      this.eventBus.emit('metrics.aggregated', {
        key,
        metrics: {
          avg: aggregation.sum / aggregation.count,
          ...aggregation
        }
      });
    }

    try {
      await pipeline.exec();
      this.aggregationWindows.clear();
    } catch (error) {
      this.logger.error('Failed to flush aggregations:', error);
    }
  }

  async getAggregatedMetrics(
    metricName: string,
    type: MetricType,
    start: number = Date.now() - this.retentionTime,
    end: number = Date.now()
  ): Promise<AggregatedMetric[]> {
    const startWindow = Math.floor(start / this.windowSize);
    const endWindow = Math.floor(end / this.windowSize);
    const key = `${type}:${metricName}`;
    const metrics: AggregatedMetric[] = [];

    for (let window = startWindow; window <= endWindow; window++) {
      const windowKey = `${key}:${window}`;
      const data = await this.redis.hgetall(windowKey);
      
      if (Object.keys(data).length > 0) {
        metrics.push({
          count: parseInt(data.count),
          sum: parseFloat(data.sum),
          min: parseFloat(data.min),
          max: parseFloat(data.max),
          last: parseFloat(data.last),
          timestamp: parseInt(data.timestamp)
        });
      }
    }

    return metrics;
  }

  private getMetricKey(metric: MetricValue): string {
    const labels = metric.labels
      ? `:${metric.labels.map(l => `${l.name}=${l.value}`).join(',')}`
      : '';
    return `${metric.type}:${metric.name}${labels}`;
  }

  async getMetricStats(
    metricName: string,
    type: MetricType,
    windowSize: number = this.windowSize
  ): Promise<{
    avg: number;
    min: number;
    max: number;
    count: number;
    rate: number;
  }> {
    const end = Date.now();
    const start = end - windowSize;
    const metrics = await this.getAggregatedMetrics(metricName, type, start, end);

    if (metrics.length === 0) {
      return {
        avg: 0,
        min: 0,
        max: 0,
        count: 0,
        rate: 0
      };
    }

    const totalCount = metrics.reduce((sum, m) => sum + m.count, 0);
    const totalSum = metrics.reduce((sum, m) => sum + m.sum, 0);
    const min = Math.min(...metrics.map(m => m.min));
    const max = Math.max(...metrics.map(m => m.max));
    const timeSpan = (end - start) / 1000; // Convert to seconds

    return {
      avg: totalSum / totalCount,
      min,
      max,
      count: totalCount,
      rate: totalCount / timeSpan
    };
  }
}