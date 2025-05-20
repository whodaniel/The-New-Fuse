import { Injectable } from '@nestjs/common';
import { MetricsConfig, PerformanceMetrics, SystemPerformanceMetrics } from '@the-new-fuse/types';
import { Logger } from '@the-new-fuse/utils';
import { MetricsCollector } from '../monitoring/metrics-collector.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ErrorCategory, ErrorSeverity } from '../monitoring/ErrorTrackingService.js';

export interface MetricsQuery {
  startTime: Date;
  endTime: Date;
  metrics: string[];
}

export interface MetricsResult {
  timestamp: number;
  values: Record<string, number>;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly collector: MetricsCollector;
  private readonly prisma: PrismaService;
  private errorCounts: Map<string, number> = new Map();

  constructor(config: MetricsConfig, prisma: PrismaService) {
    this.collector = new MetricsCollector(config);
    this.prisma = prisma;
  }

  /**
   * Set a metric value
   */
  setValue(name: string, value: number, tags?: Record<string, string>): void {
    this.collector.setValue(name, value, tags);
  }

  /**
   * Increment a metric counter
   */
  increment(name: string, value = 1, tags?: Record<string, string>): void {
    this.collector.increment(name, value, tags);
  }

  /**
   * Decrement a metric counter
   */
  decrement(name: string, value = 1, tags?: Record<string, string>): void {
    this.collector.decrement(name, value, tags);
  }

  /**
   * Get the current value of a metric
   */
  getValue(name: string, tags?: Record<string, string>): number {
    return this.collector.getValue(name, tags);
  }

  /**
   * Get all current metrics
   */
  getAllMetrics(): Record<string, number> {
    return this.collector.getAllMetrics();
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.collector.reset();
    this.errorCounts.clear();
  }

  /**
   * Increment error count with enhanced categorization
   */
  incrementErrorCount(errorName: string, options?: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    service?: string;
  }): void {
    const {
      category = ErrorCategory.UNKNOWN,
      severity = ErrorSeverity.MEDIUM,
      service
    } = options || {};

    // Increment general error count
    this.increment('errors.total');

    // Increment specific error type count
    this.increment(`errors.byName.${errorName}`);

    // Increment by category
    this.increment(`errors.byCategory.${category}`);

    // Increment by severity
    this.increment(`errors.bySeverity.${severity}`);

    // Increment by service if provided
    if (service) {
      this.increment(`errors.byService.${service}`);
      this.increment(`errors.byService.${service}.${category}`);
    }

    // Track in local map for threshold monitoring
    const key = `${category}:${severity}`;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);

    // Store in database for historical analysis
    this.recordErrorMetric(errorName, category, severity, service);
  }

  /**
   * Record error metric in database for historical analysis
   */
  private async recordErrorMetric(
    errorName: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    service?: string
  ): Promise<void> {
    try {
      await this.prisma.errorMetric.create({
        data: {
          name: errorName,
          category,
          severity,
          service: service || 'unknown',
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Failed to record error metric', error);
    }
  }

  /**
   * Query metrics for a specific time range
   */
  async queryMetrics(query: MetricsQuery): Promise<MetricsResult[]> {
    try {
      // Get metrics from collector for the specified time range
      const metrics: (metric as any).timestamp.getTime(): (query as any).metrics.reduce((acc, name)  = await this.collector.queryTimeRange(query.startTime, query.endTime);

      // Filter and format results
      return metrics.map(metric => ( {
        timestamp> {
          acc[name] = metric.values[name] || 0;
          return acc;
        }, {} as Record<string, number>)
      }));
    } catch (error: unknown){
      this.logger.error('Error querying metrics:', error): MetricsQuery): Promise<SystemPerformanceMetrics[]> {
    const metrics: {
        timestamp: {
          gte: query.startTime,
          lte: query.endTime
        }
      }
    });

    return metrics.map(m  = await this.prisma.metrics.findMany({
      where> ({
      latency: m.latency,
      throughput: m.throughput,
      cpuUsage: m.cpuUsage,
      memoryUsage: m.memoryUsage,
      errorRate: m.errorRate,
      requestCount: m.requestCount,
      concurrentUsers: m.concurrentUsers
    }): Promise<number> {
    const metrics: { timestamp: desc' }
    });
    return metrics?.cpuUsage ?? 0;
  }

  async getMemoryUsage(): Promise<void> {): Promise<number> {
    const metrics: { timestamp: desc' }
    }): Promise<number> {
    const metrics: { timestamp: desc' }
    });
    return metrics?.latency ?? 0;
  }

  async getThroughput(): Promise<void> {): Promise<number> {
    const metrics   = await this.prisma.metrics.findFirst({
      orderBy await this.prisma.metrics.findFirst({
      orderBy await this.prisma.metrics.findFirst({
      orderBy await this.prisma.metrics.findFirst({
      orderBy: { timestamp: desc' }
    }): Promise<number> {
    const metrics: { timestamp: desc' }
    });
    return metrics?.requestCount ?? 0;
  }

  async getConcurrentUsers(): Promise<void> {): Promise<number> {
    const metrics  = await this.prisma.metrics.findFirst({
      orderBy await this.prisma.metrics.findFirst({
      orderBy: { timestamp: desc' }
    });
    return metrics?.concurrentUsers ?? 0;
  }
}
