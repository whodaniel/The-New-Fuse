/**
 * Comprehensive error handling and monitoring integration for sync operations
 * Integrates with existing error systems and core-error-handling package
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  BaseError,
  BaseErrorHandler,
  BaseErrorHandlerConfig,
  ErrorCategory,
  ErrorContext,
  ErrorSeverity,
  RecoveryResult,
} from '@the-new-fuse/core-error-handling';
import { IMetricsCollector, IMonitoringSystem } from '@the-new-fuse/core-monitoring';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';

/**
 * Sync-specific error types
 */
export interface SyncError extends BaseError {
  type: 'network' | 'conflict' | 'permission' | 'validation' | 'timeout' | 'resource';
  resourceType: string;
  resourceId: string;
  tenantId?: string;
  syncOperation: string;
  retryable: boolean;
  metadata: {
    syncContext?: SyncContext;
    originalError?: Error;
    stackTrace?: string;
    [key: string]: any;
  };
}

/**
 * Sync operation context
 */
export interface SyncContext extends ErrorContext {
  syncId: string;
  syncType: 'file' | 'agent' | 'template' | 'task' | 'config';
  tenantId?: string;
  resourcePath?: string;
  version?: number;
  checksum?: string;
  timestamp: Date;
}

/**
 * Sync error statistics
 */
export interface SyncErrorStatistics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByResource: Record<string, number>;
  errorsByTenant: Record<string, number>;
  errorsByOperation: Record<string, number>;
  retrySuccessRate: number;
  avgRecoveryTime: number;
  criticalErrors: number;
  lastCriticalError?: Date;
}

/**
 * Fallback operation for failed sync operations
 */
export interface FallbackOperation {
  id: string;
  operation: string;
  data: any;
  context: SyncContext;
  priority: number;
  maxRetries: number;
  retryCount: number;
  nextRetryAt: Date;
  createdAt: Date;
}

/**
 * Configuration for sync error handler
 */
export interface SyncErrorHandlerConfig extends BaseErrorHandlerConfig {
  redisQueuePrefix: string;
  fallbackQueueName: string;
  maxFallbackOperations: number;
  retryDelayMultiplier: number;
  maxRetryDelay: number;
  enableMetricsCollection: boolean;
  metricsReportingInterval: number;
  enableAlerts: boolean;
  alertThresholds: {
    errorRate: number;
    criticalErrorCount: number;
    failedRecoveryRate: number;
  };
}

/**
 * Comprehensive sync error handler
 */
@Injectable()
export class SyncErrorHandler extends BaseErrorHandler<SyncError, SyncContext> {
  private readonly syncLogger: Logger;
  private readonly fallbackQueue: string;
  private readonly syncStatistics: SyncErrorStatistics;
  private metricsCollector?: IMetricsCollector;
  private monitoringSystem?: IMonitoringSystem;
  private metricsTimer?: NodeJS.Timeout;

  constructor(
    private readonly redisService: UnifiedRedisService,
    config: Partial<SyncErrorHandlerConfig> = {},
    monitoringSystem?: IMonitoringSystem,
    logger?: Logger
  ) {
    const syncConfig: SyncErrorHandlerConfig = {
      enableAutoRecovery: true,
      maxRecoveryAttempts: 5,
      statisticsInterval: 30000, // 30 seconds
      enableLogging: true,
      logLevel: 'error',
      redisQueuePrefix: 'sync:error',
      fallbackQueueName: 'sync:fallback:operations',
      maxFallbackOperations: 10000,
      retryDelayMultiplier: 2,
      maxRetryDelay: 300000, // 5 minutes
      enableMetricsCollection: true,
      metricsReportingInterval: 60000, // 1 minute
      enableAlerts: true,
      alertThresholds: {
        errorRate: 10, // errors per minute
        criticalErrorCount: 5,
        failedRecoveryRate: 0.5, // 50%
      },
      ...config,
    };

    super(syncConfig, logger);

    this.syncLogger = logger || new Logger('SyncErrorHandler');
    this.fallbackQueue = syncConfig.fallbackQueueName;
    this.monitoringSystem = monitoringSystem;

    this.syncStatistics = {
      totalErrors: 0,
      errorsByType: {},
      errorsByResource: {},
      errorsByTenant: {},
      errorsByOperation: {},
      retrySuccessRate: 0,
      avgRecoveryTime: 0,
      criticalErrors: 0,
    };

    if (this.monitoringSystem) {
      this.metricsCollector = this.monitoringSystem.getMetricsCollector();
    }

    this.initializeMetricsCollection();
  }

  /**
   * Handle sync-specific errors with enhanced context
   */
  async handleSyncError(
    error: Error | SyncError,
    context: SyncContext,
    operation?: string
  ): Promise<RecoveryResult | null> {
    const syncError = this.normalizeSyncError(error, context, operation);

    // Update sync-specific statistics
    this.updateSyncStatistics(syncError);

    // Record metrics if available
    if (this.metricsCollector) {
      this.recordErrorMetrics(syncError);
    }

    // Check for critical error patterns
    if (this.isCriticalError(syncError)) {
      await this.handleCriticalError(syncError, context);
    }

    // Attempt standard error handling
    const result = await this.handleError(syncError, context);

    // If recovery failed, queue for fallback processing
    if (!result || !result.success) {
      await this.queueFallbackOperation(syncError, context);
    }

    return result;
  }

  /**
   * Queue failed operations for later retry using Redis
   */
  async queueFallbackOperation(
    error: SyncError,
    context: SyncContext,
    customData?: any
  ): Promise<void> {
    try {
      const fallbackOp: FallbackOperation = {
        id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operation: error.syncOperation,
        data: customData || error.metadata,
        context,
        priority: this.calculateFallbackPriority(error),
        maxRetries: error.retryable ? 5 : 1,
        retryCount: 0,
        nextRetryAt: this.calculateNextRetryTime(0),
        createdAt: new Date(),
      };

      // Use Redis sorted set for priority queue
      const score = fallbackOp.priority * 1000 + fallbackOp.nextRetryAt.getTime();
      await this.redisService.zadd(this.fallbackQueue, score, JSON.stringify(fallbackOp));

      // Limit queue size
      const queueSize = await this.redisService.zrange(this.fallbackQueue, 0, -1);
      if (queueSize.length > (this.config as SyncErrorHandlerConfig).maxFallbackOperations) {
        // Remove oldest low-priority items
        await this.redisService.zrem(this.fallbackQueue, queueSize[0]);
      }

      this.syncLogger.debug(`Queued fallback operation: ${fallbackOp.id}`, {
        operation: fallbackOp.operation,
        priority: fallbackOp.priority,
        tenantId: context.tenantId,
      });

      // Emit event for monitoring
      this.emit('fallbackQueued', { operation: fallbackOp, error, context });
    } catch (queueError) {
      this.syncLogger.error('Failed to queue fallback operation:', queueError);
      // Don't throw - this is a fallback mechanism itself
    }
  }

  /**
   * Process queued fallback operations
   */
  async processFallbackQueue(batchSize: number = 10): Promise<void> {
    try {
      const now = Date.now();

      // Get operations ready for retry
      const operations = await this.redisService.zrange(this.fallbackQueue, 0, batchSize - 1);

      for (const opStr of operations) {
        try {
          const operation: FallbackOperation = JSON.parse(opStr);

          // Check if it's time to retry
          if (operation.nextRetryAt.getTime() > now) {
            continue;
          }

          // Remove from queue
          await this.redisService.zrem(this.fallbackQueue, opStr);

          // Attempt to process the operation
          const success = await this.processFallbackOperation(operation);

          if (!success && operation.retryCount < operation.maxRetries) {
            // Requeue with updated retry info
            operation.retryCount++;
            operation.nextRetryAt = this.calculateNextRetryTime(operation.retryCount);

            const newScore = operation.priority * 1000 + operation.nextRetryAt.getTime();
            await this.redisService.zadd(this.fallbackQueue, newScore, JSON.stringify(operation));
          }
        } catch (processError) {
          this.syncLogger.error('Error processing fallback operation:', processError);
        }
      }
    } catch (error) {
      this.syncLogger.error('Error processing fallback queue:', error);
    }
  }

  /**
   * Get comprehensive error statistics
   */
  getSyncStatistics(): SyncErrorStatistics {
    return { ...this.syncStatistics };
  }

  /**
   * Clear error history and reset statistics
   */
  clearSyncHistory(): void {
    this.clearErrorHistory();
    Object.keys(this.syncStatistics.errorsByType).forEach((key) => {
      this.syncStatistics.errorsByType[key] = 0;
    });
    Object.keys(this.syncStatistics.errorsByResource).forEach((key) => {
      this.syncStatistics.errorsByResource[key] = 0;
    });
    Object.keys(this.syncStatistics.errorsByTenant).forEach((key) => {
      this.syncStatistics.errorsByTenant[key] = 0;
    });
    Object.keys(this.syncStatistics.errorsByOperation).forEach((key) => {
      this.syncStatistics.errorsByOperation[key] = 0;
    });
    this.syncStatistics.totalErrors = 0;
    this.syncStatistics.criticalErrors = 0;
    this.syncStatistics.retrySuccessRate = 0;
    this.syncStatistics.avgRecoveryTime = 0;
  }

  /**
   * Shutdown with cleanup
   */
  shutdown(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = undefined;
    }
    super.shutdown();
    this.syncLogger.debug('SyncErrorHandler shutdown complete');
  }

  /**
   * Initialize default recovery strategies for sync operations
   */
  protected initializeDefaultRecoveryStrategies(): void {
    // Network retry strategy
    this.registerRecoveryStrategy({
      name: 'networkRetry',
      applicableErrorCodes: [1001, 1002, 1003], // Network-related error codes
      maxAttempts: 3,
      delay: 1000,
      recover: async (error: SyncError, context: SyncContext) => {
        if (error.type === 'network') {
          // Wait and retry network operation
          await this.delay(1000);
          return true; // Assume retry will be handled by caller
        }
        return false;
      },
    });

    // Conflict resolution strategy
    this.registerRecoveryStrategy({
      name: 'conflictResolution',
      applicableErrorCodes: [2001, 2002], // Conflict-related error codes
      maxAttempts: 2,
      delay: 500,
      recover: async (error: SyncError, context: SyncContext) => {
        if (error.type === 'conflict') {
          // Attempt automatic conflict resolution
          return await this.attemptConflictResolution(error, context);
        }
        return false;
      },
    });

    // Permission retry strategy
    this.registerRecoveryStrategy({
      name: 'permissionRetry',
      applicableErrorCodes: [3001, 3002], // Permission-related error codes
      maxAttempts: 1,
      delay: 2000,
      recover: async (error: SyncError, context: SyncContext) => {
        if (error.type === 'permission') {
          // Wait for permission changes to propagate
          await this.delay(2000);
          return true;
        }
        return false;
      },
    });

    // Resource cleanup strategy
    this.registerRecoveryStrategy({
      name: 'resourceCleanup',
      applicableErrorCodes: [4001, 4002], // Resource-related error codes
      maxAttempts: 1,
      delay: 0,
      recover: async (error: SyncError, context: SyncContext) => {
        if (error.type === 'resource') {
          // Attempt to clean up and retry
          return await this.attemptResourceCleanup(error, context);
        }
        return false;
      },
    });
  }

  /**
   * Initialize default error handlers for sync operations
   */
  protected initializeDefaultErrorHandlers(): void {
    // Network error handler
    this.registerErrorHandler(1000, {
      name: 'networkErrorHandler',
      canHandle: (error: SyncError) => error.type === 'network',
      handle: async (error: SyncError, context: SyncContext) => {
        this.syncLogger.warn(`Network error in sync operation: ${error.message}`, {
          syncId: context.syncId,
          resourceType: error.resourceType,
          tenantId: context.tenantId,
        });
      },
    });

    // Conflict error handler
    this.registerErrorHandler(2000, {
      name: 'conflictErrorHandler',
      canHandle: (error: SyncError) => error.type === 'conflict',
      handle: async (error: SyncError, context: SyncContext) => {
        this.syncLogger.error(`Sync conflict detected: ${error.message}`, {
          syncId: context.syncId,
          resourceType: error.resourceType,
          resourceId: error.resourceId,
          tenantId: context.tenantId,
        });
      },
    });

    // Critical error handler
    this.registerErrorHandler(9000, {
      name: 'criticalErrorHandler',
      canHandle: (error: SyncError) => error.severity === ErrorSeverity.CRITICAL,
      handle: async (error: SyncError, context: SyncContext) => {
        this.syncLogger.error(`CRITICAL SYNC ERROR: ${error.message}`, {
          syncId: context.syncId,
          resourceType: error.resourceType,
          resourceId: error.resourceId,
          tenantId: context.tenantId,
          stackTrace: error.metadata.stackTrace,
        });

        // Emit critical error event for immediate attention
        this.emit('criticalSyncError', { error, context });
      },
    });
  }

  /**
   * Normalize various error types to SyncError
   */
  private normalizeSyncError(
    error: Error | SyncError,
    context: SyncContext,
    operation?: string
  ): SyncError {
    if (this.isSyncError(error)) {
      return error;
    }

    // Convert regular Error to SyncError
    const syncError: SyncError = {
      code: this.determineErrorCode(error),
      message: error.message,
      timestamp: new Date(),
      correlationId: context.correlationId,
      retryable: this.isRetryableError(error),
      severity: this.determineSeverity(error),
      category: this.determineCategory(error),
      type: this.determineErrorType(error),
      resourceType: context.syncType,
      resourceId: context.resourcePath || 'unknown',
      tenantId: context.tenantId,
      syncOperation: operation || 'unknown',
      metadata: {
        syncContext: context,
        originalError: error,
        stackTrace: error.stack,
      },
    };

    return syncError;
  }

  /**
   * Check if error is a SyncError
   */
  private isSyncError(error: any): error is SyncError {
    return error && typeof error === 'object' && 'syncOperation' in error;
  }

  /**
   * Determine error code based on error type
   */
  private determineErrorCode(error: Error): number {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('connection')) return 1001;
    if (message.includes('timeout')) return 1002;
    if (message.includes('conflict')) return 2001;
    if (message.includes('permission') || message.includes('unauthorized')) return 3001;
    if (message.includes('validation')) return 4001;
    if (message.includes('resource') || message.includes('not found')) return 4002;

    return 9999; // Unknown error
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const retryablePatterns = ['network', 'timeout', 'connection', 'temporary', 'retry'];

    return retryablePatterns.some((pattern) => message.includes(pattern));
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();

    if (message.includes('critical') || message.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }
    if (message.includes('conflict') || message.includes('corruption')) {
      return ErrorSeverity.HIGH;
    }
    if (message.includes('timeout') || message.includes('retry')) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  /**
   * Determine error category
   */
  private determineCategory(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('connection')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return ErrorCategory.AUTHORIZATION;
    }
    if (message.includes('validation')) {
      return ErrorCategory.VALIDATION;
    }

    return ErrorCategory.SYSTEM;
  }

  /**
   * Determine sync-specific error type
   */
  private determineErrorType(error: Error): SyncError['type'] {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('connection')) return 'network';
    if (message.includes('conflict')) return 'conflict';
    if (message.includes('permission') || message.includes('unauthorized')) return 'permission';
    if (message.includes('validation')) return 'validation';
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('resource') || message.includes('not found')) return 'resource';

    return 'validation'; // Default fallback
  }

  /**
   * Update sync-specific statistics
   */
  private updateSyncStatistics(error: SyncError): void {
    this.syncStatistics.totalErrors++;

    // Update by type
    this.syncStatistics.errorsByType[error.type] =
      (this.syncStatistics.errorsByType[error.type] || 0) + 1;

    // Update by resource
    this.syncStatistics.errorsByResource[error.resourceType] =
      (this.syncStatistics.errorsByResource[error.resourceType] || 0) + 1;

    // Update by tenant
    if (error.tenantId) {
      this.syncStatistics.errorsByTenant[error.tenantId] =
        (this.syncStatistics.errorsByTenant[error.tenantId] || 0) + 1;
    }

    // Update by operation
    this.syncStatistics.errorsByOperation[error.syncOperation] =
      (this.syncStatistics.errorsByOperation[error.syncOperation] || 0) + 1;

    // Update critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.syncStatistics.criticalErrors++;
      this.syncStatistics.lastCriticalError = new Date();
    }
  }

  /**
   * Record error metrics if monitoring is available
   */
  private recordErrorMetrics(error: SyncError): void {
    if (!this.metricsCollector) return;

    const labels = {
      type: error.type,
      resourceType: error.resourceType,
      severity: error.severity,
      tenantId: error.tenantId || 'global',
    };

    this.metricsCollector.incrementCounter('sync_errors_total', labels);
    this.metricsCollector.recordGauge(
      'sync_error_severity_score',
      this.getSeverityScore(error.severity),
      labels
    );

    if (error.retryable) {
      this.metricsCollector.incrementCounter('sync_retryable_errors_total', labels);
    }
  }

  /**
   * Get numeric score for error severity
   */
  private getSeverityScore(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 1;
      case ErrorSeverity.MEDIUM:
        return 2;
      case ErrorSeverity.HIGH:
        return 3;
      case ErrorSeverity.CRITICAL:
        return 4;
      default:
        return 0;
    }
  }

  /**
   * Check if error is critical and requires immediate attention
   */
  private isCriticalError(error: SyncError): boolean {
    return (
      error.severity === ErrorSeverity.CRITICAL ||
      (error.type === 'conflict' && error.resourceType === 'agent') ||
      error.syncOperation.includes('master_clock')
    );
  }

  /**
   * Handle critical errors with special processing
   */
  private async handleCriticalError(error: SyncError, context: SyncContext): Promise<void> {
    // Log critical error with full context
    this.syncLogger.error('CRITICAL SYNC ERROR DETECTED', {
      error: error.message,
      code: error.code,
      type: error.type,
      resourceType: error.resourceType,
      resourceId: error.resourceId,
      tenantId: context.tenantId,
      syncId: context.syncId,
      operation: error.syncOperation,
      timestamp: error.timestamp,
      stackTrace: error.metadata.stackTrace,
    });

    // Emit critical error event for immediate escalation
    this.emit('criticalError', { error, context });

    // Record critical error metric
    if (this.metricsCollector) {
      this.metricsCollector.incrementCounter('sync_critical_errors_total', {
        type: error.type,
        resourceType: error.resourceType,
        tenantId: context.tenantId || 'global',
      });
    }
  }

  /**
   * Calculate priority for fallback operations
   */
  private calculateFallbackPriority(error: SyncError): number {
    let priority = 1;

    // Higher priority for critical errors
    if (error.severity === ErrorSeverity.CRITICAL) priority += 10;
    if (error.severity === ErrorSeverity.HIGH) priority += 5;

    // Higher priority for certain resource types
    if (error.resourceType === 'agent') priority += 3;
    if (error.resourceType === 'template') priority += 2;

    // Higher priority for certain operations
    if (error.syncOperation.includes('master_clock')) priority += 5;
    if (error.syncOperation.includes('heartbeat')) priority += 3;

    return priority;
  }

  /**
   * Calculate next retry time with exponential backoff
   */
  private calculateNextRetryTime(retryCount: number): Date {
    const config = this.config as SyncErrorHandlerConfig;
    const baseDelay = 1000; // 1 second
    const delay = Math.min(
      baseDelay * Math.pow(config.retryDelayMultiplier, retryCount),
      config.maxRetryDelay
    );

    return new Date(Date.now() + delay);
  }

  /**
   * Process a single fallback operation
   */
  private async processFallbackOperation(operation: FallbackOperation): Promise<boolean> {
    try {
      this.syncLogger.debug(`Processing fallback operation: ${operation.id}`, {
        operation: operation.operation,
        retryCount: operation.retryCount,
        tenantId: operation.context.tenantId,
      });

      // Emit event for custom processing
      const result = await new Promise<boolean>((resolve) => {
        this.emit('processFallbackOperation', operation, resolve);

        // Default timeout if no handler responds
        setTimeout(() => resolve(false), 5000);
      });

      if (result) {
        this.syncLogger.info(`Fallback operation succeeded: ${operation.id}`);
        this.emit('fallbackOperationSuccess', operation);
      } else {
        this.syncLogger.warn(`Fallback operation failed: ${operation.id}`);
        this.emit('fallbackOperationFailed', operation);
      }

      return result;
    } catch (error) {
      this.syncLogger.error(`Error processing fallback operation ${operation.id}:`, error);
      return false;
    }
  }

  /**
   * Attempt automatic conflict resolution
   */
  private async attemptConflictResolution(
    error: SyncError,
    context: SyncContext
  ): Promise<boolean> {
    try {
      // Emit conflict resolution event for custom handlers
      const resolved = await new Promise<boolean>((resolve) => {
        this.emit('resolveConflict', error, context, resolve);

        // Default timeout
        setTimeout(() => resolve(false), 10000);
      });

      return resolved;
    } catch (error) {
      this.syncLogger.error('Error in conflict resolution:', error);
      return false;
    }
  }

  /**
   * Attempt resource cleanup
   */
  private async attemptResourceCleanup(error: SyncError, context: SyncContext): Promise<boolean> {
    try {
      // Emit resource cleanup event for custom handlers
      const cleaned = await new Promise<boolean>((resolve) => {
        this.emit('cleanupResource', error, context, resolve);

        // Default timeout
        setTimeout(() => resolve(false), 5000);
      });

      return cleaned;
    } catch (error) {
      this.syncLogger.error('Error in resource cleanup:', error);
      return false;
    }
  }

  /**
   * Initialize metrics collection
   */
  private initializeMetricsCollection(): void {
    const config = this.config as SyncErrorHandlerConfig;

    if (!config.enableMetricsCollection || !this.metricsCollector) {
      return;
    }

    this.metricsTimer = setInterval(() => {
      this.reportMetrics();
    }, config.metricsReportingInterval);
  }

  /**
   * Report current metrics
   */
  private reportMetrics(): void {
    if (!this.metricsCollector) return;

    const stats = this.getSyncStatistics();

    // Report error counts
    this.metricsCollector.recordGauge('sync_total_errors', stats.totalErrors);
    this.metricsCollector.recordGauge('sync_critical_errors', stats.criticalErrors);
    this.metricsCollector.recordGauge('sync_retry_success_rate', stats.retrySuccessRate);
    this.metricsCollector.recordGauge('sync_avg_recovery_time', stats.avgRecoveryTime);

    // Report error rates by type
    Object.entries(stats.errorsByType).forEach(([type, count]) => {
      this.metricsCollector!.recordGauge('sync_errors_by_type', count, { type });
    });

    // Report error rates by resource
    Object.entries(stats.errorsByResource).forEach(([resource, count]) => {
      this.metricsCollector!.recordGauge('sync_errors_by_resource', count, { resource });
    });

    // Check alert thresholds
    this.checkAlertThresholds(stats);
  }

  /**
   * Check if alert thresholds are exceeded
   */
  private checkAlertThresholds(stats: SyncErrorStatistics): void {
    const config = this.config as SyncErrorHandlerConfig;

    if (!config.enableAlerts) return;

    // Check error rate
    if (this.statistics.errorRate > config.alertThresholds.errorRate) {
      this.emit('alertTriggered', {
        type: 'errorRate',
        threshold: config.alertThresholds.errorRate,
        current: this.statistics.errorRate,
        message: `Sync error rate exceeded threshold: ${this.statistics.errorRate}/min`,
      });
    }

    // Check critical error count
    if (stats.criticalErrors > config.alertThresholds.criticalErrorCount) {
      this.emit('alertTriggered', {
        type: 'criticalErrors',
        threshold: config.alertThresholds.criticalErrorCount,
        current: stats.criticalErrors,
        message: `Critical sync errors exceeded threshold: ${stats.criticalErrors}`,
      });
    }

    // Check failed recovery rate
    if (stats.retrySuccessRate < 1 - config.alertThresholds.failedRecoveryRate) {
      this.emit('alertTriggered', {
        type: 'recoveryFailure',
        threshold: config.alertThresholds.failedRecoveryRate,
        current: 1 - stats.retrySuccessRate,
        message: `Sync recovery failure rate exceeded threshold: ${(1 - stats.retrySuccessRate) * 100}%`,
      });
    }
  }
}
