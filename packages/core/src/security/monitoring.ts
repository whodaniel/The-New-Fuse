import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { performance } from 'perf_hooks';

export interface Metric {
  timestamp: Date;
  value: number;
  labels?: Record<string, string>;
}

export interface SystemHealth {
  responseTimes: {
    avg: number;
    p95: number;
    p99: number;
  };
  messageCounts: {
    total: number;
    byType: Record<string, number>;
  };
  errorRates: {
    total: number;
    byType: Record<string, number>;
  };
}

@Injectable()
export class MonitoringService implements OnModuleDestroy {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
    this.redis.on('error', (err: any) => this.logger.error('Redis Error', err));
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  /**
   * Increments a counter metric.
   */
  async increment(key: string, labels: Record<string, string> = {}) {
    const serializedLabels = this.serializeLabels(labels);
    await this.redis.hincrby('counters', `${key}:${serializedLabels}`, 1);
  }

  /**
   * Records a timing measurement for a function.
   */
  async recordTime<T>(key: string, fn: () => Promise<T>, labels: Record<string, string> = {}): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      const serializedLabels = this.serializeLabels(labels);
      await this.redis.lpush(`timings:${key}:${serializedLabels}`, duration.toString());
    }
  }

  /**
   * Calculates system health metrics.
   */
  async getSystemHealth(): Promise<SystemHealth> {
    // This is a simplified example. A real implementation would require
    // more sophisticated data aggregation and analysis.
    const responseTimes = await this.getTimingStats('api.response');
    const messageCounts = await this.getCounterStats('message.type');
    const errorRates = await this.getCounterStats('error.type');

    return {
      responseTimes,
      messageCounts,
      errorRates,
    };
  }

  private async getTimingStats(key: string): Promise<{ avg: number; p95: number; p99: number }> {
    const timings = await this.redis.lrange(`timings:${key}`, 0, -1);
    const numbers = timings.map(Number).sort((a, b) => a - b);
    if (numbers.length === 0) return { avg: 0, p95: 0, p99: 0 };

    const sum = numbers.reduce((acc, val) => acc + val, 0);
    const avg = sum / numbers.length;
    const p95 = this.calculatePercentile(numbers, 95);
    const p99 = this.calculatePercentile(numbers, 99);

    return { avg, p95, p99 };
  }

  private async getCounterStats(keyPrefix: string): Promise<{ total: number; byType: Record<string, number> }> {
    const counters = await this.redis.hgetall('counters');
    let total = 0;
    const byType: Record<string, number> = {};

    for (const [field, value] of Object.entries(counters)) {
      if (field.startsWith(keyPrefix)) {
        const type = field.split(':')[1] || 'unknown';
        const count = Number(value);
        total += count;
        byType[type] = (byType[type] || 0) + count;
      }
    }

    return { total, byType };
  }

  private calculatePercentile(arr: number[], percentile: number): number {
    if (arr.length === 0) return 0;
    const index = (percentile / 100) * (arr.length - 1);
    const floor = Math.floor(index);
    const ceil = Math.ceil(index);
    if (floor === ceil) return arr[floor];
    const d0 = arr[floor] * (ceil - index);
    const d1 = arr[ceil] * (index - floor);
    return d0 + d1;
  }

  private serializeLabels(labels: Record<string, string>): string {
    return Object.entries(labels).map(([k, v]) => `${k}=${v}`).join(',');
  }
}
