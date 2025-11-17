import { Logger } from '@tnf/core-monitoring';

// Generic interface for compatibility with existing infrastructure
interface MetricsService {
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
  tenantId?: string;
}

export interface SyncOperationMetrics {
  operationType: string;
  duration: number;
  success: boolean;
  errorType?: string;
  resourceCount: number;
  dataSize: number;
  tenantId?: string;
}

export interface SystemResourceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeConnections: number;
}

export interface TelemetryConfig {
  metricsInterval: number;
  retentionPeriod: number;
  aggregationWindow: number;
  enableDetailedMetrics: boolean;
  maxMetricsBuffer: number;
}

/**
 * Performance telemetry system for sync operations
 * Integrates with existing monitoring infrastructure
 */
export class SyncPerformanceTelemetry {
  private readonly logger = new Logger('SyncPerformanceTelemetry');
  private readonly metricsBuffer: PerformanceMetric[] = [];
  private readonly operationTimers = new Map<string, number>();
  private metricsTimer?: NodeJS.Timeout;
  private startTime = Date.now();

  // Performance counters
  private syncOperationCount = 0;
  private syncErrorCount = 0;
  private totalSyncDuration = 0;
  private peakMemoryUsage = 0;
  private totalDataSynced = 0;

  constructor(
    private readonly metricsService: MetricsService,
    private readonly config: TelemetryConfig
  ) {
    this.startMetricsCollection();
  }

  /**
   * Record sync operation metrics
   */
  recordSyncOperation(metrics: SyncOperationMetrics): void {
    this.syncOperationCount++;
    this.totalSyncDuration += metrics.duration;
    this.totalDataSynced += metrics.dataSize;

    if (!metrics.success) {
      this.syncErrorCount++;
    }

    // Record detailed metrics
    this.addMetric({
      name: 'sync_operation_duration',
      value: metrics.duration,
      unit: 'ms',
      timestamp: new Date(),
      tags: {
        operation_type: metrics.operationType,
        success: metrics.success.toString(),
        error_type: metrics.errorType || 'none'
      },
      tenantId: metrics.tenantId
    });

    this.addMetric({
      name: 'sync_operation_data_size',
      value: metrics.dataSize,
      unit: 'bytes',
      timestamp: new Date(),
      tags: {
        operation_type: metrics.operationType
      },
      tenantId: metrics.tenantId
    });

    this.addMetric({
      name: 'sync_operation_resource_count',
      value: metrics.resourceCount,
      unit: 'count',
      timestamp: new Date(),
      tags: {
        operation_type: metrics.operationType
      },
      tenantId: metrics.tenantId
    });

    this.logger.debug('Sync operation recorded', {
      operationType: metrics.operationType,
      duration: metrics.duration,
      success: metrics.success,
      resourceCount: metrics.resourceCount,
      dataSize: metrics.dataSize
    });
  }

  /**
   * Start timing a sync operation
   */
  startOperation(operationId: string): void {
    this.operationTimers.set(operationId, Date.now());
  }

  /**
   * End timing a sync operation and record metrics
   */
  endOperation(
    operationId: string, 
    operationType: string, 
    success: boolean, 
    resourceCount: number = 0,
    dataSize: number = 0,
    tenantId?: string,
    errorType?: string
  ): void {
    const startTime = this.operationTimers.get(operationId);
    if (!startTime) {
      this.logger.warn('Operation timer not found', { operationId });
      return;
    }

    const duration = Date.now() - startTime;
    this.operationTimers.delete(operationId);

    this.recordSyncOperation({
      operationType,
      duration,
      success,
      errorType,
      resourceCount,
      dataSize,
      tenantId
    });
  }

  /**
   * Record system resource metrics
   */
  recordSystemMetrics(metrics: SystemResourceMetrics): void {
    this.peakMemoryUsage = Math.max(this.peakMemoryUsage, metrics.memoryUsage);

    this.addMetric({
      name: 'system_cpu_usage',
      value: metrics.cpuUsage,
      unit: 'percent',
      timestamp: new Date(),
      tags: {}
    });

    this.addMetric({
      name: 'system_memory_usage',
      value: metrics.memoryUsage,
      unit: 'bytes',
      timestamp: new Date(),
      tags: {}
    });

    this.addMetric({
      name: 'system_disk_usage',
      value: metrics.diskUsage,
      unit: 'percent',
      timestamp: new Date(),
      tags: {}
    });

    this.addMetric({
      name: 'system_network_latency',
      value: metrics.networkLatency,
      unit: 'ms',
      timestamp: new Date(),
      tags: {}
    });

    this.addMetric({
      name: 'system_active_connections',
      value: metrics.activeConnections,
      unit: 'count',
      timestamp: new Date(),
      tags: {}
    });
  }

  /**
   * Record cache performance metrics
   */
  recordCacheMetrics(hitRate: number, missRate: number, evictionCount: number, memoryUsage: number): void {
    this.addMetric({
      name: 'cache_hit_rate',
      value: hitRate,
      unit: 'percent',
      timestamp: new Date(),
      tags: {}
    });

    this.addMetric({
      name: 'cache_miss_rate',
      value: missRate,
      unit: 'percent',
      timestamp: new Date(),
      tags: {}
    });

    this.addMetric({
      name: 'cache_eviction_count',
      value: evictionCount,
      unit: 'count',
      timestamp: new Date(),
      tags: {}
    });

    this.addMetric({
      name: 'cache_memory_usage',
      value: memoryUsage,
      unit: 'bytes',
      timestamp: new Date(),
      tags: {}
    });
  }

  /**
   * Record batch processing metrics
   */
  recordBatchMetrics(batchSize: number, processingTime: number, priority: string): void {
    this.addMetric({
      name: 'batch_size',
      value: batchSize,
      unit: 'count',
      timestamp: new Date(),
      tags: { priority }
    });

    this.addMetric({
      name: 'batch_processing_time',
      value: processingTime,
      unit: 'ms',
      timestamp: new Date(),
      tags: { priority }
    });
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    uptime: number;
    totalOperations: number;
    errorRate: number;
    averageDuration: number;
    peakMemoryUsage: number;
    totalDataSynced: number;
    operationsPerSecond: number;
  } {
    const uptime = Date.now() - this.startTime;
    const uptimeSeconds = uptime / 1000;
    
    return {
      uptime,
      totalOperations: this.syncOperationCount,
      errorRate: this.syncOperationCount > 0 ? this.syncErrorCount / this.syncOperationCount : 0,
      averageDuration: this.syncOperationCount > 0 ? this.totalSyncDuration / this.syncOperationCount : 0,
      peakMemoryUsage: this.peakMemoryUsage,
      totalDataSynced: this.totalDataSynced,
      operationsPerSecond: uptimeSeconds > 0 ? this.syncOperationCount / uptimeSeconds : 0
    };
  }

  /**
   * Get tenant-specific metrics
   */
  getTenantMetrics(tenantId: string): PerformanceMetric[] {
    return this.metricsBuffer.filter(metric => metric.tenantId === tenantId);
  }

  /**
   * Get metrics by type and time range
   */
  getMetrics(
    metricName?: string, 
    startTime?: Date, 
    endTime?: Date,
    tenantId?: string
  ): PerformanceMetric[] {
    return this.metricsBuffer.filter(metric => {
      if (metricName && metric.name !== metricName) return false;
      if (startTime && metric.timestamp < startTime) return false;
      if (endTime && metric.timestamp > endTime) return false;
      if (tenantId && metric.tenantId !== tenantId) return false;
      return true;
    });
  }

  /**
   * Add metric to buffer
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metricsBuffer.push(metric);

    // Trim buffer if it exceeds max size
    if (this.metricsBuffer.length > this.config.maxMetricsBuffer) {
      this.metricsBuffer.splice(0, this.metricsBuffer.length - this.config.maxMetricsBuffer);
    }

    // Send to metrics service if enabled
    if (this.config.enableDetailedMetrics) {
      this.metricsService.recordMetric(metric.name, metric.value, metric.tags);
    }
  }

  /**
   * Start metrics collection timer
   */
  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.collectAndSendMetrics();
    }, this.config.metricsInterval);
  }

  /**
   * Collect and send aggregated metrics
   */
  private collectAndSendMetrics(): void {
    try {
      const summary = this.getPerformanceSummary();
      
      // Send summary metrics to monitoring service
      this.metricsService.recordMetric('sync_total_operations', summary.totalOperations);
      this.metricsService.recordMetric('sync_error_rate', summary.errorRate);
      this.metricsService.recordMetric('sync_average_duration', summary.averageDuration);
      this.metricsService.recordMetric('sync_operations_per_second', summary.operationsPerSecond);
      this.metricsService.recordMetric('sync_peak_memory_usage', summary.peakMemoryUsage);
      this.metricsService.recordMetric('sync_total_data_synced', summary.totalDataSynced);

      // Clean up old metrics
      this.cleanupOldMetrics();

      this.logger.debug('Metrics collected and sent', {
        totalOperations: summary.totalOperations,
        errorRate: summary.errorRate,
        averageDuration: summary.averageDuration
      });
    } catch (error) {
      this.logger.error('Failed to collect metrics', { error });
    }
  }

  /**
   * Clean up old metrics based on retention period
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - this.config.retentionPeriod);
    const initialSize = this.metricsBuffer.length;
    
    // Remove metrics older than retention period
    let i = 0;
    while (i < this.metricsBuffer.length) {
      if (this.metricsBuffer[i].timestamp < cutoffTime) {
        this.metricsBuffer.splice(i, 1);
      } else {
        i++;
      }
    }

    const removedCount = initialSize - this.metricsBuffer.length;
    if (removedCount > 0) {
      this.logger.debug('Cleaned up old metrics', {
        removedCount,
        remainingCount: this.metricsBuffer.length
      });
    }
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['name', 'value', 'unit', 'timestamp', 'tags', 'tenantId'];
      const rows = this.metricsBuffer.map(metric => [
        metric.name,
        metric.value.toString(),
        metric.unit,
        metric.timestamp.toISOString(),
        JSON.stringify(metric.tags),
        metric.tenantId || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(this.metricsBuffer, null, 2);
  }

  /**
   * Reset all metrics and counters
   */
  reset(): void {
    this.metricsBuffer.length = 0;
    this.operationTimers.clear();
    this.syncOperationCount = 0;
    this.syncErrorCount = 0;
    this.totalSyncDuration = 0;
    this.peakMemoryUsage = 0;
    this.totalDataSynced = 0;
    this.startTime = Date.now();
    
    this.logger.info('Performance telemetry reset');
  }

  /**
   * Shutdown telemetry system
   */
  shutdown(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    
    // Send final metrics
    this.collectAndSendMetrics();
    
    this.logger.info('Performance telemetry shutdown complete');
  }
}