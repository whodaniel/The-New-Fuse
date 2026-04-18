import { Injectable, Logger } from '@nestjs/common';
import { RedisRateLimiterService } from '../rate-limiting/redis-rate-limiter.service.js';
import { ResponseCacheService } from '../caching/response-cache.service.js';
import { CacheInvalidationService } from '../caching/cache-invalidation.service.js';

export interface OptimizationMetrics {
  rateLimit: {
    totalKeys: number;
    blockedKeys: number;
    topConsumers: Array<{ key: string; count: number }>;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    memoryHits: number;
    redisHits: number;
    memoryCacheSize: number;
  };
  invalidation: {
    scheduledJobs: number;
  };
  timestamp: string;
}

export interface OptimizationAlert {
  type: 'rate_limit' | 'cache' | 'performance';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metric?: string;
  value?: number;
  threshold?: number;
  timestamp: string;
}

/**
 * Monitoring service for API optimization features
 * Tracks metrics and generates alerts for rate limiting, caching, and performance
 */
@Injectable()
export class OptimizationMonitoringService {
  private readonly logger = new Logger(OptimizationMonitoringService.name);
  private alerts: OptimizationAlert[] = [];
  private maxAlerts = 100;

  // Thresholds for alerts
  private readonly thresholds = {
    rateLimitBlockedKeys: 10,
    cacheHitRateMin: 50, // %
    cacheHitRateLow: 30, // %
    rateLimitHighConsumption: 80 // % of limit
  };

  constructor(
    private rateLimiter: RedisRateLimiterService,
    private cacheService: ResponseCacheService,
    private invalidationService: CacheInvalidationService
  ) {
    // Start periodic monitoring
    this.startMonitoring();
  }

  /**
   * Get current optimization metrics
   */
  async getMetrics(): Promise<OptimizationMetrics> {
    const [rateLimitMetrics, cacheStats, invalidationStats] = await Promise.all([
      this.rateLimiter.getMetrics(),
      Promise.resolve(this.cacheService.getStats()),
      Promise.resolve(this.invalidationService.getStats())
    ]);

    return {
      rateLimit: rateLimitMetrics,
      cache: cacheStats,
      invalidation: invalidationStats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit = 50): OptimizationAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(
    severity: 'info' | 'warning' | 'critical'
  ): OptimizationAlert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Clear old alerts
   */
  clearAlerts(olderThan?: Date): void {
    if (olderThan) {
      this.alerts = this.alerts.filter(
        alert => new Date(alert.timestamp) > olderThan
      );
    } else {
      this.alerts = [];
    }
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, { status: string; latency?: number }>;
    alerts: number;
  }> {
    const [rateLimitHealth, cacheHealth] = await Promise.all([
      this.rateLimiter.healthCheck(),
      this.cacheService.healthCheck()
    ]);

    const criticalAlerts = this.getAlertsBySeverity('critical').length;
    const warningAlerts = this.getAlertsBySeverity('warning').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (
      rateLimitHealth.status === 'unhealthy' ||
      cacheHealth.status === 'unhealthy' ||
      criticalAlerts > 0
    ) {
      overallStatus = 'unhealthy';
    } else if (warningAlerts > 5) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      components: {
        rateLimit: rateLimitHealth,
        cache: cacheHealth
      },
      alerts: this.alerts.length
    };
  }

  /**
   * Generate performance report
   */
  async generateReport(): Promise<{
    metrics: OptimizationMetrics;
    health: any;
    recommendations: string[];
  }> {
    const [metrics, health] = await Promise.all([
      this.getMetrics(),
      this.getHealthStatus()
    ]);

    const recommendations = this.generateRecommendations(metrics);

    return {
      metrics,
      health,
      recommendations
    };
  }

  // Private methods

  private startMonitoring(): void {
    // Check metrics every 60 seconds
    setInterval(() => {
      this.checkMetrics().catch(error => {
        this.logger.error('Monitoring check error:', error);
      });
    }, 60000);

    this.logger.log('Optimization monitoring started');
  }

  private async checkMetrics(): Promise<void> {
    try {
      const metrics = await this.getMetrics();

      // Check rate limit metrics
      if (metrics.rateLimit.blockedKeys > this.thresholds.rateLimitBlockedKeys) {
        this.addAlert({
          type: 'rate_limit',
          severity: 'warning',
          message: `High number of blocked rate limit keys: ${metrics.rateLimit.blockedKeys}`,
          metric: 'blockedKeys',
          value: metrics.rateLimit.blockedKeys,
          threshold: this.thresholds.rateLimitBlockedKeys,
          timestamp: new Date().toISOString()
        });
      }

      // Check cache hit rate
      if (metrics.cache.hitRate < this.thresholds.cacheHitRateLow) {
        this.addAlert({
          type: 'cache',
          severity: 'critical',
          message: `Very low cache hit rate: ${metrics.cache.hitRate}%`,
          metric: 'hitRate',
          value: metrics.cache.hitRate,
          threshold: this.thresholds.cacheHitRateLow,
          timestamp: new Date().toISOString()
        });
      } else if (metrics.cache.hitRate < this.thresholds.cacheHitRateMin) {
        this.addAlert({
          type: 'cache',
          severity: 'warning',
          message: `Low cache hit rate: ${metrics.cache.hitRate}%`,
          metric: 'hitRate',
          value: metrics.cache.hitRate,
          threshold: this.thresholds.cacheHitRateMin,
          timestamp: new Date().toISOString()
        });
      }

      // Check top consumers
      const topConsumers = metrics.rateLimit.topConsumers.slice(0, 3);
      for (const consumer of topConsumers) {
        if (consumer.count > this.thresholds.rateLimitHighConsumption) {
          this.addAlert({
            type: 'rate_limit',
            severity: 'info',
            message: `High rate limit consumption: ${consumer.key} (${consumer.count} requests)`,
            metric: 'consumption',
            value: consumer.count,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      this.logger.error('Error checking metrics:', error);
    }
  }

  private addAlert(alert: OptimizationAlert): void {
    this.alerts.push(alert);

    // Keep only the most recent alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    // Log based on severity
    switch (alert.severity) {
      case 'critical':
        this.logger.error(`[CRITICAL] ${alert.message}`);
        break;
      case 'warning':
        this.logger.warn(`[WARNING] ${alert.message}`);
        break;
      case 'info':
        this.logger.log(`[INFO] ${alert.message}`);
        break;
    }
  }

  private generateRecommendations(metrics: OptimizationMetrics): string[] {
    const recommendations: string[] = [];

    // Cache recommendations
    if (metrics.cache.hitRate < 50) {
      recommendations.push(
        'Cache hit rate is low. Consider increasing TTL for frequently accessed data.'
      );
    }

    if (metrics.cache.memoryHits < metrics.cache.redisHits) {
      recommendations.push(
        'Memory cache is underutilized. Consider increasing memory cache size for better performance.'
      );
    }

    // Rate limit recommendations
    if (metrics.rateLimit.blockedKeys > 10) {
      recommendations.push(
        'High number of blocked rate limit keys. Review rate limit policies or investigate potential abuse.'
      );
    }

    if (metrics.rateLimit.topConsumers.length > 0) {
      const topConsumer = metrics.rateLimit.topConsumers[0];
      if (topConsumer.count > 1000) {
        recommendations.push(
          `High consumption detected for ${topConsumer.key}. Consider implementing a dedicated rate limit tier.`
        );
      }
    }

    // Invalidation recommendations
    if (metrics.invalidation.scheduledJobs > 50) {
      recommendations.push(
        'Many scheduled invalidation jobs. Consider batch invalidation for better performance.'
      );
    }

    return recommendations;
  }
}
