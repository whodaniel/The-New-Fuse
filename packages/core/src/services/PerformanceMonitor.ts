/**
 * @fileoverview Production-ready performance monitoring service
 */

import { Injectable } from '@nestjs/common';
import { PerformanceMetrics, ApplicationMetrics } from '../types/monitoring';
import { ServiceState } from '../constants/types';
import { logger } from '../utils/logger';
import { MetricsCollector } from './MetricsCollector';
import { SystemMonitor } from './SystemMonitor';

@Injectable()
export class PerformanceMonitor {
  private state: ServiceState = ServiceState.UNINITIALIZED;
  private monitoringInterval?: NodeJS.Timeout;
  private startTime: Date = new Date();
  private requestCount: number = 0;
  private errorCount: number = 0;
  private responseTimes: number[] = [];
  private activeConnections: number = 0;

  constructor(
    private readonly metricsCollector: MetricsCollector,
    private readonly systemMonitor: SystemMonitor,
  ) {
    logger.setContext('PerformanceMonitor');
  }

  async start(): Promise<void> {
    if (this.state === ServiceState.RUNNING) {
      logger.warn('PerformanceMonitor is already running');
      return;
    }

    try {
      this.state = ServiceState.INITIALIZING;
      logger.info('Starting PerformanceMonitor');

      // Start performance monitoring interval
      this.monitoringInterval = setInterval(() => {
        this.collectPerformanceMetrics();
      }, 30000); // Collect every 30 seconds

      this.state = ServiceState.RUNNING;
      logger.info('PerformanceMonitor started successfully');
    } catch (error) {
      this.state = ServiceState.ERROR;
      logger.error('Failed to start PerformanceMonitor', error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.state === ServiceState.STOPPED) {
      logger.warn('PerformanceMonitor is already stopped');
      return;
    }

    try {
      this.state = ServiceState.STOPPING;
      logger.info('Stopping PerformanceMonitor');

      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = undefined;
      }

      this.state = ServiceState.STOPPED;
      logger.info('PerformanceMonitor stopped successfully');
    } catch (error) {
      this.state = ServiceState.ERROR;
      logger.error('Failed to stop PerformanceMonitor', error as Error);
      throw error;
    }
  }

  getState(): ServiceState {
    return this.state;
  }

  async monitor(): Promise<PerformanceMetrics> {
    try {
      const systemMetrics = await this.systemMonitor.getSystemMetrics();
      const applicationMetrics = this.getApplicationMetrics();

      const performanceMetrics: PerformanceMetrics = {
        system: systemMetrics,
        application: applicationMetrics,
        agents: [], // Will be populated by AgentOrchestrator
        workflows: [], // Will be populated by WorkflowEngine
        timestamp: new Date(),
      };

      // Record metrics
      this.recordSystemMetrics(systemMetrics);
      this.recordApplicationMetrics(applicationMetrics);

      return performanceMetrics;
    } catch (error) {
      logger.error('Failed to collect performance metrics', error as Error);
      throw error;
    }
  }

  // Request tracking methods
  recordRequest(responseTime: number, isError: boolean = false): void {
    this.requestCount++;
    this.responseTimes.push(responseTime);

    if (isError) {
      this.errorCount++;
    }

    // Keep only last 1000 response times for memory efficiency
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    // Record metrics
    this.metricsCollector.recordCounter('http_requests_total', 1, { error: isError.toString() });
    this.metricsCollector.recordTimer('http_request_duration', responseTime);
  }

  recordConnectionChange(delta: number): void {
    this.activeConnections = Math.max(0, this.activeConnections + delta);
    this.metricsCollector.recordGauge('active_connections', this.activeConnections);
  }

  // Database connection tracking
  recordDatabaseConnection(active: number, idle: number): void {
    this.metricsCollector.recordGauge('database_connections_active', active);
    this.metricsCollector.recordGauge('database_connections_idle', idle);
    this.metricsCollector.recordGauge('database_connections_total', active + idle);
  }

  // Memory tracking
  recordMemoryUsage(): void {
    const memoryUsage = process.memoryUsage();

    this.metricsCollector.recordGauge('memory_heap_used', memoryUsage.heapUsed, 'bytes');
    this.metricsCollector.recordGauge('memory_heap_total', memoryUsage.heapTotal, 'bytes');
    this.metricsCollector.recordGauge('memory_external', memoryUsage.external, 'bytes');
    this.metricsCollector.recordGauge('memory_rss', memoryUsage.rss, 'bytes');
  }

  // Event loop lag monitoring
  recordEventLoopLag(): void {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
      this.metricsCollector.recordGauge('event_loop_lag', lag, 'ms');
    });
  }

  private async collectPerformanceMetrics(): Promise<void> {
    try {
      // Collect memory metrics
      this.recordMemoryUsage();

      // Collect event loop lag
      this.recordEventLoopLag();

      // Collect full performance metrics
      await this.monitor();

      logger.debug('Performance metrics collected successfully');
    } catch (error) {
      logger.error('Failed to collect performance metrics', error as Error);
    }
  }

  private getApplicationMetrics(): ApplicationMetrics {
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    const responseTime = this.calculateResponseTimeStats();

    return {
      uptime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      responseTime,
      activeConnections: this.activeConnections,
      databaseConnections: {
        active: 0, // Will be updated by database service
        idle: 0, // Will be updated by database service
        total: 0, // Will be updated by database service
      },
    };
  }

  private calculateResponseTimeStats(): ApplicationMetrics['responseTime'] {
    if (this.responseTimes.length === 0) {
      return {
        average: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      };
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      average: sum / sorted.length,
      p50: this.calculatePercentile(sorted, 50),
      p95: this.calculatePercentile(sorted, 95),
      p99: this.calculatePercentile(sorted, 99),
    };
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  private recordSystemMetrics(metrics: PerformanceMetrics['system']): void {
    // CPU metrics
    this.metricsCollector.recordGauge('cpu_usage_percent', metrics.cpu.usage, '%');
    this.metricsCollector.recordGauge('cpu_cores', metrics.cpu.cores);

    // Memory metrics
    this.metricsCollector.recordGauge('system_memory_used', metrics.memory.used, 'bytes');
    this.metricsCollector.recordGauge('system_memory_total', metrics.memory.total, 'bytes');
    this.metricsCollector.recordGauge('system_memory_usage_percent', metrics.memory.usage, '%');

    // Disk metrics
    this.metricsCollector.recordGauge('disk_used', metrics.disk.used, 'bytes');
    this.metricsCollector.recordGauge('disk_total', metrics.disk.total, 'bytes');
    this.metricsCollector.recordGauge('disk_usage_percent', metrics.disk.usage, '%');
    this.metricsCollector.recordGauge('disk_iops', metrics.disk.iops);

    // Network metrics
    this.metricsCollector.recordGauge('network_bytes_in', metrics.network.bytesIn, 'bytes');
    this.metricsCollector.recordGauge('network_bytes_out', metrics.network.bytesOut, 'bytes');
    this.metricsCollector.recordGauge('network_packets_in', metrics.network.packetsIn);
    this.metricsCollector.recordGauge('network_packets_out', metrics.network.packetsOut);
    this.metricsCollector.recordGauge('network_connections', metrics.network.connections);
  }

  private recordApplicationMetrics(metrics: ApplicationMetrics): void {
    this.metricsCollector.recordGauge('app_uptime', metrics.uptime, 'seconds');
    this.metricsCollector.recordGauge('app_requests_total', metrics.requestCount);
    this.metricsCollector.recordGauge('app_errors_total', metrics.errorCount);
    this.metricsCollector.recordGauge('app_response_time_avg', metrics.responseTime.average, 'ms');
    this.metricsCollector.recordGauge('app_response_time_p50', metrics.responseTime.p50, 'ms');
    this.metricsCollector.recordGauge('app_response_time_p95', metrics.responseTime.p95, 'ms');
    this.metricsCollector.recordGauge('app_response_time_p99', metrics.responseTime.p99, 'ms');
    this.metricsCollector.recordGauge('app_active_connections', metrics.activeConnections);
  }

  // Utility methods for performance tracking
  async trackOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    tags?: Record<string, string>,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      this.metricsCollector.recordTimer(`operation_duration`, duration, {
        operation: operationName,
        success: 'true',
        ...tags,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.metricsCollector.recordTimer(`operation_duration`, duration, {
        operation: operationName,
        success: 'false',
        ...tags,
      });

      this.metricsCollector.recordCounter(`operation_errors`, 1, {
        operation: operationName,
        ...tags,
      });

      throw error;
    }
  }

  trackOperationSync<T>(
    operationName: string,
    operation: () => T,
    tags?: Record<string, string>,
  ): T {
    const startTime = Date.now();

    try {
      const result = operation();
      const duration = Date.now() - startTime;

      this.metricsCollector.recordTimer(`operation_duration`, duration, {
        operation: operationName,
        success: 'true',
        ...tags,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.metricsCollector.recordTimer(`operation_duration`, duration, {
        operation: operationName,
        success: 'false',
        ...tags,
      });

      this.metricsCollector.recordCounter(`operation_errors`, 1, {
        operation: operationName,
        ...tags,
      });

      throw error;
    }
  }
}
