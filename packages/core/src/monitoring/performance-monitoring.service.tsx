import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@the-new-fuse/utils';
import { PrismaService } from '../prisma/prisma.service.js';
import * as process from 'process';
import * as os from 'os';
import { CorrelationIdManager } from '../utils/correlation-id.js';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  context?: Record<string, any>;
  timestamp?: Date;
}

export interface MemorySnapshot {
  timestamp: Date;
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  arrayBuffers?: number;
}

export interface MemoryLeakDetectionResult {
  isLeaking: boolean;
  leakRate?: number; // MB per hour
  projectedExhaustion?: Date; // When memory will be exhausted at current rate
  recommendation?: string;
}

export interface PerformanceThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit: string;
}

@Injectable()
export class PerformanceMonitoringService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PerformanceMonitoringService.name);
  private monitoringInterval: NodeJS.Timeout;
  private memoryLeakDetectionInterval: NodeJS.Timeout;
  private memorySnapshots: MemorySnapshot[] = [];
  private readonly snapshotRetention = 24; // Hours of snapshots to retain
  private readonly thresholds: PerformanceThreshold[] = [];
  private readonly enabled: boolean;
  private readonly sampleRate: number;
  private readonly alertingEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {
    // Load configuration
    const perfConfig = this.configService.get('monitoring.performance') || {};
    this.enabled = perfConfig.enabled !== false;
    this.sampleRate = perfConfig.sampleRate || 1.0; // Default to capturing all metrics
    this.thresholds = perfConfig.thresholds || [];
    this.alertingEnabled = perfConfig.alerting?.enabled !== false;
    
    this.logger.info('Performance monitoring service initialized');
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.info('Performance monitoring is disabled');
      return;
    }

    // Start regular performance monitoring
    const interval = this.configService.get('monitoring.performance.interval', 60000); // Default: 1 minute
    this.monitoringInterval = setInterval(() => this.collectMetrics(), interval);
    
    // Start memory leak detection
    const memoryCheckInterval = this.configService.get('monitoring.performance.memoryCheckInterval', 3600000); // Default: 1 hour
    this.memoryLeakDetectionInterval = setInterval(() => this.checkForMemoryLeaks(), memoryCheckInterval);
    
    // Take initial memory snapshot
    this.takeMemorySnapshot();
    
    this.logger.info('Performance monitoring started');
  }

  async onModuleDestroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.memoryLeakDetectionInterval) {
      clearInterval(this.memoryLeakDetectionInterval);
    }
    
    this.logger.info('Performance monitoring stopped');
  }

  /**
   * Record a performance metric
   */
  async recordMetric(metric: PerformanceMetric): Promise<void> {
    // Apply sampling rate
    if (Math.random() > this.sampleRate) {
      return;
    }
    
    // Normalize the metric
    const normalizedMetric = this.normalizeMetric(metric);
    
    // Check thresholds and alert if necessary
    this.checkThresholds(normalizedMetric);
    
    // Store in database
    try {
      await this.prisma.performanceMetric.create({
        data: {
          name: normalizedMetric.name,
          value: normalizedMetric.value,
          unit: normalizedMetric.unit,
          tags: normalizedMetric.tags as any,
          context: normalizedMetric.context as any,
          timestamp: normalizedMetric.timestamp
        }
      });
    } catch (error) {
      this.logger.error('Failed to store performance metric', error);
    }
    
    // Emit metric event
    this.eventEmitter.emit('performance.metric', normalizedMetric);
  }

  /**
   * Record response time for an operation
   */
  async recordResponseTime({
    operation,
    durationMs,
    success = true,
    tags = {},
  }: {
    operation: string;
    durationMs: number;
    success?: boolean;
    tags?: Record<string, string>;
  }): Promise<void> {
    return this.recordMetric({
      name: 'response_time',
      value: durationMs,
      unit: 'ms',
      tags: {
        operation,
        success: String(success),
        ...tags,
      },
      context: {
        operation,
        success,
      },
    });
  }

  /**
   * Record resource usage
   */
  async recordResourceUsage({
    resource,
    usage,
    capacity,
    tags = {},
  }: {
    resource: string;
    usage: number;
    capacity?: number;
    tags?: Record<string, string>;
  }): Promise<void> {
    const metrics: PerformanceMetric[] = [
      {
        name: 'resource_usage',
        value: usage,
        tags: {
          resource,
          ...tags,
        },
        context: {
          resource,
          usage,
          capacity,
        },
      },
    ];

    // If capacity is provided, also record utilization percentage
    if (capacity !== undefined && capacity > 0) {
      metrics.push({
        name: 'resource_utilization',
        value: (usage / capacity) * 100,
        unit: '%',
        tags: {
          resource,
          ...tags,
        },
        context: {
          resource,
          usage,
          capacity,
        },
      });
    }

    // Record all metrics
    await Promise.all(metrics.map(metric => this.recordMetric(metric)));
  }

  /**
   * Record throughput for an operation
   */
  async recordThroughput({
    operation,
    count,
    intervalSeconds = 60,
    success = true,
    tags = {},
  }: {
    operation: string;
    count: number;
    intervalSeconds?: number;
    success?: boolean;
    tags?: Record<string, string>;
  }): Promise<void> {
    return this.recordMetric({
      name: 'throughput',
      value: count / intervalSeconds, // Calculate operations per second
      unit: 'ops/s',
      tags: {
        operation,
        success: String(success),
        interval: `${intervalSeconds}s`,
        ...tags,
      },
      context: {
        operation,
        count,
        intervalSeconds,
        success,
      },
    });
  }

  /**
   * Record latency for inter-service communication
   */
  async recordInterServiceLatency({
    sourceService,
    targetService,
    operation,
    durationMs,
    success = true,
    correlationId = CorrelationIdManager.getCurrentId(),
    tags = {},
  }: {
    sourceService: string;
    targetService: string;
    operation: string;
    durationMs: number;
    success?: boolean;
    correlationId?: string;
    tags?: Record<string, string>;
  }): Promise<void> {
    return this.recordMetric({
      name: 'inter_service_latency',
      value: durationMs,
      unit: 'ms',
      tags: {
        source: sourceService,
        target: targetService,
        operation,
        success: String(success),
        correlationId,
        ...tags,
      },
      context: {
        sourceService,
        targetService,
        operation,
        success,
        correlationId,
      },
    });
  }

  /**
   * Detect memory leaks by analyzing memory usage patterns
   */
  async detectMemoryLeaks(hours: number = 24): Promise<MemoryLeakDetectionResult> {
    // Need at least 2 snapshots to detect a trend
    if (this.memorySnapshots.length < 2) {
      return { isLeaking: false };
    }
    
    // Filter snapshots to the requested time window
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const relevantSnapshots = this.memorySnapshots.filter(s => s.timestamp >= cutoff);
    
    if (relevantSnapshots.length < 2) {
      return { isLeaking: false };
    }
    
    // Calculate the rate of change in heap usage
    const first = relevantSnapshots[0];
    const last = relevantSnapshots[relevantSnapshots.length - 1];
    const elapsedHours = (last.timestamp.getTime() - first.timestamp.getTime()) / (1000 * 60 * 60);
    
    if (elapsedHours < 1) {
      return { isLeaking: false };
    }
    
    // Calculate leak rate in MB per hour
    const leakRate = (last.heapUsed - first.heapUsed) / (1024 * 1024) / elapsedHours;
    
    // Determine if this is a leak (more than 10MB/hour sustained growth)
    const isLeaking = leakRate > 10;
    
    let result: MemoryLeakDetectionResult = {
      isLeaking,
      leakRate
    };
    
    if (isLeaking) {
      // Calculate when memory will be exhausted
      const availableMemoryMB = os.totalmem() / (1024 * 1024) - last.heapUsed / (1024 * 1024);
      const hoursUntilExhaustion = availableMemoryMB / leakRate;
      
      result.projectedExhaustion = new Date(Date.now() + hoursUntilExhaustion * 60 * 60 * 1000);
      result.recommendation = this.getMemoryLeakRecommendation(leakRate);
      
      // Log and emit event for memory leak detection
      this.logger.warn(`Memory leak detected: ${leakRate.toFixed(2)} MB/hour`, result);
      this.eventEmitter.emit('performance.memoryLeak', result);
    }
    
    return result;
  }

  /**
   * Get custom business metrics for a specific time range
   */
  async getCustomMetrics(
    metricNames: string[],
    startTime: Date,
    endTime: Date = new Date(),
    tags?: Record<string, string>
  ): Promise<Record<string, number>> {
    const whereClause: any = {
      name: { in: metricNames },
      timestamp: {
        gte: startTime,
        lte: endTime
      }
    };
    
    // Add tag filtering if provided
    if (tags && Object.keys(tags).length > 0) {
      whereClause.tags = {};
      for (const [key, value] of Object.entries(tags)) {
        whereClause.tags[key] = value;
      }
    }
    
    const metrics = await this.prisma.performanceMetric.findMany({
      where: whereClause
    });
    
    // Group by name and calculate average
    const result: Record<string, number> = {};
    const counts: Record<string, number> = {};
    
    for (const metric of metrics) {
      if (!result[metric.name]) {
        result[metric.name] = 0;
        counts[metric.name] = 0;
      }
      
      result[metric.name] += metric.value;
      counts[metric.name]++;
    }
    
    // Calculate averages
    for (const name of Object.keys(result)) {
      if (counts[name] > 0) {
        result[name] = result[name] / counts[name];
      }
    }
    
    return result;
  }

  /**
   * Private methods
   */

  private normalizeMetric(metric: PerformanceMetric): PerformanceMetric {
    return {
      ...metric,
      timestamp: metric.timestamp || new Date(),
      tags: metric.tags || {},
      context: metric.context || {},
      unit: metric.unit || ''
    };
  }

  private checkThresholds(metric: PerformanceMetric): void {
    if (!this.alertingEnabled) return;
    
    const threshold = this.thresholds.find(t => t.metric === metric.name);
    if (!threshold) return;
    
    if (metric.value >= threshold.critical) {
      this.triggerAlert('critical', metric, threshold);
    } else if (metric.value >= threshold.warning) {
      this.triggerAlert('warning', metric, threshold);
    }
  }

  private triggerAlert(
    level: 'warning' | 'critical',
    metric: PerformanceMetric,
    threshold: PerformanceThreshold
  ): void {
    const alert = {
      level,
      metric: metric.name,
      value: metric.value,
      threshold: level === 'critical' ? threshold.critical : threshold.warning,
      unit: threshold.unit,
      tags: metric.tags,
      timestamp: new Date().toISOString(),
      message: `Performance ${level}: ${metric.name} is ${metric.value}${threshold.unit} (threshold: ${level === 'critical' ? threshold.critical : threshold.warning}${threshold.unit})`
    };
    
    this.logger.warn(`Performance alert: ${alert.message}`, alert);
    this.eventEmitter.emit('performance.alert', alert);
  }

  private async collectMetrics(): Promise<void> {
    try {
      // System metrics
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const osLoadAvg = os.loadavg();
      
      // Record memory metrics
      await this.recordResourceUsage({
        resource: 'memory.heap.used',
        usage: memoryUsage.heapUsed / (1024 * 1024),
        capacity: memoryUsage.heapTotal / (1024 * 1024),
        tags: { unit: 'MB' }
      });
      
      await this.recordResourceUsage({
        resource: 'memory.rss',
        usage: memoryUsage.rss / (1024 * 1024),
        capacity: os.totalmem() / (1024 * 1024),
        tags: { unit: 'MB' }
      });
      
      // Record CPU metrics
      await this.recordResourceUsage({
        resource: 'cpu.user',
        usage: cpuUsage.user / 1000000, // Convert to seconds
        tags: { unit: 's' }
      });
      
      await this.recordResourceUsage({
        resource: 'cpu.system',
        usage: cpuUsage.system / 1000000, // Convert to seconds
        tags: { unit: 's' }
      });
      
      await this.recordResourceUsage({
        resource: 'cpu.loadavg.1m',
        usage: osLoadAvg[0],
        capacity: os.cpus().length,
        tags: { unit: 'load' }
      });
      
      // Take memory snapshot for leak detection
      this.takeMemorySnapshot();
      
    } catch (error) {
      this.logger.error('Error collecting performance metrics', error);
    }
  }

  private takeMemorySnapshot(): void {
    const memoryUsage = process.memoryUsage();
    
    const snapshot: MemorySnapshot = {
      timestamp: new Date(),
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      rss: memoryUsage.rss,
      external: memoryUsage.external,
      arrayBuffers: (memoryUsage as any).arrayBuffers
    };
    
    this.memorySnapshots.push(snapshot);
    
    // Prune old snapshots
    const cutoff = new Date(Date.now() - this.snapshotRetention * 60 * 60 * 1000);
    this.memorySnapshots = this.memorySnapshots.filter(s => s.timestamp >= cutoff);
  }

  private async checkForMemoryLeaks(): Promise<void> {
    const result = await this.detectMemoryLeaks();
    
    if (result.isLeaking) {
      // Store memory leak detection in database
      try {
        await this.prisma.performanceMetric.create({
          data: {
            name: 'memory_leak_detection',
            value: result.leakRate || 0,
            unit: 'MB/hour',
            tags: {
              severity: result.leakRate && result.leakRate > 50 ? 'critical' : 'warning'
            } as any,
            context: result as any
          }
        });
      } catch (error) {
        this.logger.error('Failed to store memory leak detection', error);
      }
    }
  }

  private getMemoryLeakRecommendation(leakRate: number): string {
    if (leakRate > 100) {
      return 'Critical memory leak detected. Consider restarting the service immediately and investigating object retention patterns.';
    } else if (leakRate > 50) {
      return 'Significant memory leak detected. Schedule a restart soon and review recent code changes that might be causing object retention.';
    } else {
      return 'Minor memory leak detected. Monitor the situation and consider investigating object lifecycle management in the application.';
    }
  }
}
