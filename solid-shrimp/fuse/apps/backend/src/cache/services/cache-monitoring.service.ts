import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  missRate: number;
  averageHitTime: number;
  averageMissTime: number;
  totalOperations: number;
  keyMetrics: Map<string, KeyMetrics>;
}

export interface KeyMetrics {
  key: string;
  hits: number;
  misses: number;
  lastAccess: number;
  averageTime: number;
}

@Injectable()
export class CacheMonitoringService {
  private readonly logger = new Logger(CacheMonitoringService.name);
  private readonly enabled: boolean;
  private readonly sampleRate: number;

  private metrics: {
    hits: number;
    misses: number;
    hitTimes: number[];
    missTimes: number[];
    keyMetrics: Map<string, KeyMetrics>;
  };

  private metricsInterval: NodeJS.Timeout;
  private readonly aggregationWindow: number;

  constructor(private readonly configService: ConfigService) {
    const cacheConfig = this.configService.get('cache');
    this.enabled = cacheConfig?.monitoring?.enabled || false;
    this.sampleRate = cacheConfig?.monitoring?.sampleRate || 100;
    this.aggregationWindow = cacheConfig?.monitoring?.metricsInterval || 60000;

    this.metrics = {
      hits: 0,
      misses: 0,
      hitTimes: [],
      missTimes: [],
      keyMetrics: new Map(),
    };

    if (this.enabled) {
      this.startMetricsAggregation();
    }
  }

  /**
   * Start periodic metrics aggregation
   */
  private startMetricsAggregation(): void {
    this.metricsInterval = setInterval(() => {
      this.aggregateAndLogMetrics();
    }, this.aggregationWindow);
  }

  /**
   * Stop metrics aggregation
   */
  onModuleDestroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }

  /**
   * Record a cache hit
   */
  recordHit(key: string, duration: number): void {
    if (!this.shouldSample()) {
      return;
    }

    this.metrics.hits++;
    this.metrics.hitTimes.push(duration);

    this.updateKeyMetrics(key, true, duration);
  }

  /**
   * Record a cache miss
   */
  recordMiss(key: string, duration: number): void {
    if (!this.shouldSample()) {
      return;
    }

    this.metrics.misses++;
    this.metrics.missTimes.push(duration);

    this.updateKeyMetrics(key, false, duration);
  }

  /**
   * Update metrics for a specific key
   */
  private updateKeyMetrics(key: string, isHit: boolean, duration: number): void {
    let keyMetric = this.metrics.keyMetrics.get(key);

    if (!keyMetric) {
      keyMetric = {
        key,
        hits: 0,
        misses: 0,
        lastAccess: Date.now(),
        averageTime: 0,
      };
      this.metrics.keyMetrics.set(key, keyMetric);
    }

    if (isHit) {
      keyMetric.hits++;
    } else {
      keyMetric.misses++;
    }

    keyMetric.lastAccess = Date.now();

    // Update average time (moving average)
    const totalOps = keyMetric.hits + keyMetric.misses;
    keyMetric.averageTime =
      (keyMetric.averageTime * (totalOps - 1) + duration) / totalOps;
  }

  /**
   * Determine if this operation should be sampled
   */
  private shouldSample(): boolean {
    if (!this.enabled) {
      return false;
    }

    if (this.sampleRate >= 100) {
      return true;
    }

    return Math.random() * 100 < this.sampleRate;
  }

  /**
   * Get current cache statistics
   */
  getStats(): {
    hitRate: number;
    missRate: number;
    averageHitTime: number;
    averageMissTime: number;
    totalOperations: number;
  } {
    const totalOps = this.metrics.hits + this.metrics.misses;

    if (totalOps === 0) {
      return {
        hitRate: 0,
        missRate: 0,
        averageHitTime: 0,
        averageMissTime: 0,
        totalOperations: 0,
      };
    }

    const hitRate = (this.metrics.hits / totalOps) * 100;
    const missRate = (this.metrics.misses / totalOps) * 100;

    const averageHitTime =
      this.metrics.hitTimes.length > 0
        ? this.metrics.hitTimes.reduce((a, b) => a + b, 0) /
          this.metrics.hitTimes.length
        : 0;

    const averageMissTime =
      this.metrics.missTimes.length > 0
        ? this.metrics.missTimes.reduce((a, b) => a + b, 0) /
          this.metrics.missTimes.length
        : 0;

    return {
      hitRate,
      missRate,
      averageHitTime,
      averageMissTime,
      totalOperations: totalOps,
    };
  }

  /**
   * Get detailed metrics including per-key statistics
   */
  getDetailedMetrics(): CacheMetrics {
    const stats = this.getStats();

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate: stats.hitRate,
      missRate: stats.missRate,
      averageHitTime: stats.averageHitTime,
      averageMissTime: stats.averageMissTime,
      totalOperations: stats.totalOperations,
      keyMetrics: this.metrics.keyMetrics,
    };
  }

  /**
   * Get top N most accessed cache keys
   */
  getTopKeys(n: number = 10): KeyMetrics[] {
    return Array.from(this.metrics.keyMetrics.values())
      .sort((a, b) => b.hits + b.misses - (a.hits + a.misses))
      .slice(0, n);
  }

  /**
   * Get keys with lowest hit rates (candidates for removal)
   */
  getLowHitRateKeys(n: number = 10): KeyMetrics[] {
    return Array.from(this.metrics.keyMetrics.values())
      .filter((m) => m.hits + m.misses > 10) // Filter out rarely used keys
      .map((m) => ({
        ...m,
        hitRate: (m.hits / (m.hits + m.misses)) * 100,
      }))
      .sort((a: any, b: any) => a.hitRate - b.hitRate)
      .slice(0, n);
  }

  /**
   * Aggregate and log metrics periodically
   */
  private aggregateAndLogMetrics(): void {
    const stats = this.getStats();

    this.logger.log(
      `Cache Metrics - Hit Rate: ${stats.hitRate.toFixed(2)}%, ` +
        `Miss Rate: ${stats.missRate.toFixed(2)}%, ` +
        `Total Ops: ${stats.totalOperations}, ` +
        `Avg Hit Time: ${stats.averageHitTime.toFixed(2)}ms, ` +
        `Avg Miss Time: ${stats.averageMissTime.toFixed(2)}ms`,
    );

    const topKeys = this.getTopKeys(5);
    if (topKeys.length > 0) {
      this.logger.debug(
        'Top 5 Cache Keys:\n' +
          topKeys
            .map(
              (k) =>
                `  ${k.key}: ${k.hits} hits, ${k.misses} misses, ` +
                `${((k.hits / (k.hits + k.misses)) * 100).toFixed(1)}% hit rate`,
            )
            .join('\n'),
      );
    }

    // Reset time arrays to prevent memory growth
    if (this.metrics.hitTimes.length > 1000) {
      this.metrics.hitTimes = this.metrics.hitTimes.slice(-100);
    }
    if (this.metrics.missTimes.length > 1000) {
      this.metrics.missTimes = this.metrics.missTimes.slice(-100);
    }
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      hitTimes: [],
      missTimes: [],
      keyMetrics: new Map(),
    };
    this.logger.log('Cache metrics reset');
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): {
    timestamp: number;
    metrics: CacheMetrics;
    topKeys: KeyMetrics[];
    lowHitRateKeys: any[];
  } {
    return {
      timestamp: Date.now(),
      metrics: this.getDetailedMetrics(),
      topKeys: this.getTopKeys(10),
      lowHitRateKeys: this.getLowHitRateKeys(10),
    };
  }
}
