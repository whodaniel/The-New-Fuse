import { Logger } from '@tnf/core-monitoring';
import { HorizontalScalingCoordinator, ScalingCoordinationConfig } from './HorizontalScalingCoordinator';
import { FileChangeBatcher, BatchConfig, BatchedFileChange } from './FileChangeBatcher';
import { SyncLRUCache, CacheConfig } from './SyncLRUCache';
import { SyncPerformanceTelemetry, TelemetryConfig, SyncOperationMetrics } from './SyncPerformanceTelemetry';
import { FileChangeEvent } from '../watchers/EnhancedFileSystemWatcher';

// Generic interfaces for compatibility with existing infrastructure
interface RedisService {
  setex(key: string, seconds: number, value: string): Promise<string>;
  get(key: string): Promise<string | null>;
  sadd(key: string, member: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  srem(key: string, member: string): Promise<number>;
  del(key: string): Promise<number>;
  lpush(key: string, value: string): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  publish(channel: string, message: string): Promise<number>;
}

interface MetricsService {
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
}

export interface PerformanceConfig {
  scaling: ScalingCoordinationConfig;
  batching: BatchConfig;
  caching: CacheConfig;
  telemetry: TelemetryConfig;
  enableOptimizations: boolean;
  memoryThreshold: number;
  cpuThreshold: number;
}

export interface PerformanceMetrics {
  scaling: {
    instanceCount: number;
    currentLoad: number;
    distributedWork: number;
  };
  batching: {
    pendingChanges: number;
    activeBatches: number;
    processedBatches: number;
  };
  caching: {
    hitRate: number;
    memoryUsage: number;
    evictionCount: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    uptime: number;
  };
}

/**
 * Main performance optimization service that coordinates all performance features
 * Integrates with existing monitoring infrastructure for unified observability
 */
export class PerformanceOptimizationService {
  private readonly logger = new Logger('PerformanceOptimizationService');
  
  private scalingCoordinator?: HorizontalScalingCoordinator;
  private fileChangeBatcher?: FileChangeBatcher;
  private syncCache?: SyncLRUCache<any>;
  private telemetry?: SyncPerformanceTelemetry;
  
  private isInitialized = false;
  private monitoringTimer?: NodeJS.Timeout;
  private processedBatchCount = 0;

  constructor(
    private readonly redisService: RedisService,
    private readonly metricsService: MetricsService,
    private readonly config: PerformanceConfig
  ) {}

  /**
   * Initialize all performance optimization components
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing performance optimization service');

      // Initialize telemetry first for metrics collection
      this.telemetry = new SyncPerformanceTelemetry(
        this.metricsService,
        this.config.telemetry
      );

      // Initialize horizontal scaling coordinator
      this.scalingCoordinator = new HorizontalScalingCoordinator(
        this.redisService,
        this.config.scaling
      );
      await this.scalingCoordinator.initialize();

      // Initialize file change batcher
      this.fileChangeBatcher = new FileChangeBatcher(
        this.config.batching,
        this.handleBatchedChanges.bind(this)
      );

      // Initialize LRU cache
      this.syncCache = new SyncLRUCache(this.config.caching);

      // Start system monitoring
      this.startSystemMonitoring();

      this.isInitialized = true;
      this.logger.info('Performance optimization service initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize performance optimization service', { error });
      throw error;
    }
  }

  /**
   * Process file change through batching system
   */
  async processFileChange(event: FileChangeEvent): Promise<void> {
    if (!this.isInitialized || !this.fileChangeBatcher) {
      throw new Error('Performance optimization service not initialized');
    }

    const operationId = `file-change-${Date.now()}-${Math.random()}`;
    this.telemetry?.startOperation(operationId);

    try {
      await this.fileChangeBatcher.addFileChange(event);
      
      this.telemetry?.endOperation(
        operationId,
        'file_change_batching',
        true,
        1,
        event.metadata?.size || 0,
        event.tenantId
      );
    } catch (error) {
      this.telemetry?.endOperation(
        operationId,
        'file_change_batching',
        false,
        1,
        0,
        event.tenantId,
        error instanceof Error ? error.name : 'unknown'
      );
      throw error;
    }
  }

  /**
   * Get cached data with performance tracking
   */
  getCachedData<T>(key: string, tenantId?: string): T | undefined {
    if (!this.syncCache) return undefined;

    const operationId = `cache-get-${Date.now()}`;
    this.telemetry?.startOperation(operationId);

    try {
      const result = this.syncCache.get(key, tenantId) as T | undefined;
      
      this.telemetry?.endOperation(
        operationId,
        'cache_get',
        result !== undefined,
        1,
        0,
        tenantId
      );

      return result;
    } catch (error) {
      this.telemetry?.endOperation(
        operationId,
        'cache_get',
        false,
        1,
        0,
        tenantId,
        error instanceof Error ? error.name : 'unknown'
      );
      return undefined;
    }
  }

  /**
   * Set cached data with performance tracking
   */
  setCachedData<T>(key: string, value: T, tenantId?: string): void {
    if (!this.syncCache) return;

    const operationId = `cache-set-${Date.now()}`;
    this.telemetry?.startOperation(operationId);

    try {
      this.syncCache.set(key, value, tenantId);
      
      this.telemetry?.endOperation(
        operationId,
        'cache_set',
        true,
        1,
        JSON.stringify(value).length,
        tenantId
      );
    } catch (error) {
      this.telemetry?.endOperation(
        operationId,
        'cache_set',
        false,
        1,
        0,
        tenantId,
        error instanceof Error ? error.name : 'unknown'
      );
    }
  }

  /**
   * Distribute work across cluster instances
   */
  async distributeWork(workType: string, workload: any, tenantId?: string): Promise<string> {
    if (!this.scalingCoordinator) {
      throw new Error('Scaling coordinator not initialized');
    }

    const operationId = `distribute-work-${Date.now()}`;
    this.telemetry?.startOperation(operationId);

    try {
      const targetInstance = await this.scalingCoordinator.distributeWork(workType, workload);
      
      this.telemetry?.endOperation(
        operationId,
        'work_distribution',
        true,
        1,
        JSON.stringify(workload).length,
        tenantId
      );

      return targetInstance;
    } catch (error) {
      this.telemetry?.endOperation(
        operationId,
        'work_distribution',
        false,
        1,
        0,
        tenantId,
        error instanceof Error ? error.name : 'unknown'
      );
      throw error;
    }
  }

  /**
   * Get assigned work for this instance
   */
  async getAssignedWork(): Promise<any[]> {
    if (!this.scalingCoordinator) return [];

    return await this.scalingCoordinator.getAssignedWork();
  }

  /**
   * Update current instance load
   */
  updateInstanceLoad(load: number): void {
    if (this.scalingCoordinator) {
      this.scalingCoordinator.updateLoad(load);
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const scalingInstances = await this.scalingCoordinator?.getActiveInstances() || [];
    const batchStats = this.fileChangeBatcher?.getBatchStats() || { pendingChanges: 0, activeBatches: 0, activeTimers: 0 };
    const cacheStats = this.syncCache?.getStats() || { hitRate: 0, memoryUsage: 0, evictionCount: 0, size: 0, missRate: 0, tenantStats: new Map() };
    const telemetryStats = this.telemetry?.getPerformanceSummary() || { uptime: 0, totalOperations: 0, errorRate: 0, averageDuration: 0, peakMemoryUsage: 0, totalDataSynced: 0, operationsPerSecond: 0 };

    return {
      scaling: {
        instanceCount: scalingInstances.length,
        currentLoad: scalingInstances.find(i => i.instanceId === this.config.scaling.instanceId)?.load || 0,
        distributedWork: scalingInstances.reduce((sum, i) => sum + i.load, 0)
      },
      batching: {
        pendingChanges: batchStats.pendingChanges,
        activeBatches: batchStats.activeBatches,
        processedBatches: this.processedBatchCount
      },
      caching: {
        hitRate: cacheStats.hitRate,
        memoryUsage: cacheStats.memoryUsage,
        evictionCount: cacheStats.evictionCount
      },
      system: {
        cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
        memoryUsage: process.memoryUsage().heapUsed,
        uptime: telemetryStats.uptime
      }
    };
  }

  /**
   * Force optimization cleanup when under memory pressure
   */
  async forceOptimization(): Promise<void> {
    this.logger.info('Forcing performance optimization cleanup');

    // Force cache cleanup
    if (this.syncCache) {
      this.syncCache.forceCleanup();
    }

    // Flush all pending batches
    if (this.fileChangeBatcher) {
      await this.fileChangeBatcher.flushAll();
    }

    // Trigger garbage collection if available
    if (global.gc) {
      global.gc();
    }

    this.logger.info('Performance optimization cleanup completed');
  }

  /**
   * Handle batched file changes
   */
  private async handleBatchedChanges(batch: BatchedFileChange): Promise<void> {
    const operationId = `batch-${batch.id}`;
    this.telemetry?.startOperation(operationId);

    try {
      // Record batch metrics
      this.telemetry?.recordBatchMetrics(
        batch.events.length,
        Date.now() - batch.batchedAt.getTime(),
        batch.priority
      );

      // Process the batch (this would integrate with existing sync services)
      // For now, we'll just log the batch processing
      this.logger.info('Processing batched file changes', {
        batchId: batch.id,
        eventCount: batch.events.length,
        priority: batch.priority,
        tenantId: batch.tenantId
      });

      this.processedBatchCount++;

      this.telemetry?.endOperation(
        operationId,
        'batch_processing',
        true,
        batch.events.length,
        batch.events.reduce((sum, e) => sum + (e.metadata?.size || 0), 0),
        batch.tenantId
      );

    } catch (error) {
      this.telemetry?.endOperation(
        operationId,
        'batch_processing',
        false,
        batch.events.length,
        0,
        batch.tenantId,
        error instanceof Error ? error.name : 'unknown'
      );
      throw error;
    }
  }

  /**
   * Start system monitoring for performance optimization
   */
  private startSystemMonitoring(): void {
    this.monitoringTimer = setInterval(async () => {
      try {
        const metrics = await this.getPerformanceMetrics();
        
        // Record system metrics
        this.telemetry?.recordSystemMetrics({
          cpuUsage: metrics.system.cpuUsage,
          memoryUsage: metrics.system.memoryUsage,
          diskUsage: 0, // Would integrate with system monitoring
          networkLatency: 0, // Would integrate with network monitoring
          activeConnections: metrics.scaling.instanceCount
        });

        // Record cache metrics
        this.telemetry?.recordCacheMetrics(
          metrics.caching.hitRate,
          1 - metrics.caching.hitRate, // miss rate
          metrics.caching.evictionCount,
          metrics.caching.memoryUsage
        );

        // Check if optimization is needed
        if (metrics.system.memoryUsage > this.config.memoryThreshold ||
            metrics.system.cpuUsage > this.config.cpuThreshold) {
          await this.forceOptimization();
        }

      } catch (error) {
        this.logger.error('System monitoring failed', { error });
      }
    }, 30000); // Monitor every 30 seconds
  }

  /**
   * Shutdown all performance optimization components
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down performance optimization service');

    try {
      // Clear monitoring timer
      if (this.monitoringTimer) {
        clearInterval(this.monitoringTimer);
      }

      // Shutdown components in reverse order
      if (this.fileChangeBatcher) {
        await this.fileChangeBatcher.shutdown();
      }

      if (this.syncCache) {
        this.syncCache.shutdown();
      }

      if (this.scalingCoordinator) {
        await this.scalingCoordinator.shutdown();
      }

      if (this.telemetry) {
        this.telemetry.shutdown();
      }

      this.isInitialized = false;
      this.logger.info('Performance optimization service shutdown complete');

    } catch (error) {
      this.logger.error('Error during performance optimization service shutdown', { error });
    }
  }
}