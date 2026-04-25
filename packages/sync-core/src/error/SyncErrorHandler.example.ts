/**
 * Example usage of the sync error handling system
 * Demonstrates integration with existing infrastructure
 */

import { Logger } from '@nestjs/common';
import { IMonitoringSystem } from '@the-new-fuse/core-monitoring';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import {
  FallbackProcessorConfig,
  RetryConfig,
  SyncContext,
  SyncError,
  SyncErrorHandler,
  SyncErrorHandlerConfig,
  SyncFallbackProcessor,
  SyncRetryManager,
} from './index';

/**
 * Example: Setting up comprehensive sync error handling
 */
export class SyncErrorHandlingExample {
  private errorHandler: SyncErrorHandler;
  private retryManager: SyncRetryManager;
  private fallbackProcessor: SyncFallbackProcessor;

  constructor(
    private readonly redisService: UnifiedRedisService,
    private readonly monitoringSystem: IMonitoringSystem,
    private readonly logger: Logger
  ) {
    this.setupErrorHandling();
  }

  /**
   * Initialize the complete error handling system
   */
  private setupErrorHandling(): void {
    // Configure error handler with existing infrastructure integration
    const errorConfig: Partial<SyncErrorHandlerConfig> = {
      enableAutoRecovery: true,
      maxRecoveryAttempts: 5,
      redisQueuePrefix: 'sync:error',
      fallbackQueueName: 'sync:fallback:operations',
      enableMetricsCollection: true,
      enableAlerts: true,
      alertThresholds: {
        errorRate: 10, // errors per minute
        criticalErrorCount: 5,
        failedRecoveryRate: 0.5, // 50%
      },
    };

    // Configure retry manager with circuit breaker
    const retryConfig: Partial<RetryConfig> = {
      maxAttempts: 5,
      baseDelay: 1000,
      maxDelay: 300000, // 5 minutes
      backoffMultiplier: 2,
      jitterEnabled: true,
      circuitBreakerEnabled: true,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000, // 1 minute
    };

    // Configure fallback processor with graceful degradation
    const fallbackConfig: Partial<FallbackProcessorConfig> = {
      enabled: true,
      processingInterval: 10000, // 10 seconds
      batchSize: 5,
      maxConcurrentProcessing: 3,
      enableMetrics: true,
      enableAlternativeActions: true,
      gracefulDegradationEnabled: true,
    };

    // Initialize components
    this.errorHandler = new SyncErrorHandler(
      this.redisService,
      errorConfig,
      this.monitoringSystem,
      this.logger
    );

    this.retryManager = new SyncRetryManager(this.redisService, retryConfig, this.logger);

    this.fallbackProcessor = new SyncFallbackProcessor(
      this.redisService,
      fallbackConfig,
      this.monitoringSystem.getMetricsCollector(),
      this.logger
    );

    this.setupEventHandlers();
    this.setupCustomStrategies();
  }

  /**
   * Set up event handlers for integration
   */
  private setupEventHandlers(): void {
    // Handle critical errors with immediate escalation
    this.errorHandler.on('criticalError', ({ error, context }) => {
      this.logger.error('CRITICAL SYNC ERROR - IMMEDIATE ATTENTION REQUIRED', {
        error: error.message,
        syncId: context.syncId,
        tenantId: context.tenantId,
        resourceType: error.resourceType,
        operation: error.syncOperation,
      });

      // Trigger incident management system
      this.triggerIncident(error, context);
    });

    // Handle fallback operation processing
    this.errorHandler.on('processFallbackOperation', (operation, callback) => {
      this.fallbackProcessor
        .processFallbackOperation(operation)
        .then((result) => callback(result.success))
        .catch(() => callback(false));
    });

    // Handle retry execution
    this.retryManager.on('executeRetry', (retry, callback) => {
      this.executeRetryOperation(retry)
        .then((success) => callback(success))
        .catch(() => callback(false));
    });

    // Handle circuit breaker events
    this.retryManager.on('circuitBreakerOpened', ({ operation, breaker }) => {
      this.logger.warn('Circuit breaker opened', {
        operation,
        failureCount: breaker.failureCount,
        nextAttemptAt: breaker.nextAttemptAt,
      });

      // Notify monitoring system
      this.monitoringSystem
        .getMetricsCollector()
        .incrementCounter('sync_circuit_breaker_opened_total', { operation });
    });

    // Handle graceful degradation
    this.fallbackProcessor.on('gracefulDegradation', ({ operation }) => {
      this.logger.warn('System entering graceful degradation mode', {
        operation: operation.operation,
        resourceType: operation.context.syncType,
        tenantId: operation.context.tenantId,
      });

      // Notify users of degraded service
      this.notifyDegradedService(operation);
    });

    // Handle alert triggers
    this.errorHandler.on('alertTriggered', (alert) => {
      this.logger.error('Sync error alert triggered', alert);

      // Send to alerting system
      this.sendAlert(alert);
    });
  }

  /**
   * Set up custom fallback strategies
   */
  private setupCustomStrategies(): void {
    // File sync fallback strategy
    this.fallbackProcessor.registerStrategy({
      name: 'fileSyncFallback',
      priority: 1,
      applicableOperations: ['file-sync', 'file-update'],
      applicableResourceTypes: ['file'],
      maxExecutionTime: 10000,
      enabled: true,
      execute: async (operation) => {
        try {
          // Try to restore from local cache or backup
          const restored = await this.restoreFromBackup(operation);

          return {
            success: restored,
            strategy: 'fileSyncFallback',
            executionTime: 0,
            shouldRetry: !restored,
            data: restored ? { restoredFromBackup: true } : undefined,
          };
        } catch (error) {
          return {
            success: false,
            strategy: 'fileSyncFallback',
            executionTime: 0,
            error: error instanceof Error ? error : new Error(String(error)),
            shouldRetry: false,
          };
        }
      },
    });

    // Agent sync fallback strategy
    this.fallbackProcessor.registerStrategy({
      name: 'agentSyncFallback',
      priority: 2,
      applicableOperations: ['agent-sync', 'agent-update'],
      applicableResourceTypes: ['agent'],
      maxExecutionTime: 15000,
      enabled: true,
      execute: async (operation) => {
        try {
          // Try simplified agent sync without full state
          const simplified = await this.performSimplifiedAgentSync(operation);

          return {
            success: simplified,
            strategy: 'agentSyncFallback',
            executionTime: 0,
            shouldRetry: false,
            data: { simplifiedSync: true },
          };
        } catch (error) {
          return {
            success: false,
            strategy: 'agentSyncFallback',
            executionTime: 0,
            error: error instanceof Error ? error : new Error(String(error)),
            shouldRetry: false,
          };
        }
      },
    });

    // Template sync fallback strategy
    this.fallbackProcessor.registerStrategy({
      name: 'templateSyncFallback',
      priority: 3,
      applicableOperations: ['template-sync', 'template-update'],
      applicableResourceTypes: ['template'],
      maxExecutionTime: 5000,
      enabled: true,
      execute: async (operation) => {
        try {
          // Use cached template version
          const cached = await this.useCachedTemplate(operation);

          return {
            success: cached,
            strategy: 'templateSyncFallback',
            executionTime: 0,
            shouldRetry: false,
            data: { usedCache: true },
          };
        } catch (error) {
          return {
            success: false,
            strategy: 'templateSyncFallback',
            executionTime: 0,
            error: error instanceof Error ? error : new Error(String(error)),
            shouldRetry: false,
          };
        }
      },
    });
  }

  /**
   * Example: Handle a sync error with complete workflow
   */
  async handleSyncError(error: Error, context: SyncContext, operation: string): Promise<void> {
    try {
      // Step 1: Process error through error handler
      const result = await this.errorHandler.handleSyncError(error, context, operation);

      if (result && result.success) {
        this.logger.info('Error recovered successfully', {
          syncId: context.syncId,
          strategy: result.strategy,
          attempts: result.attempts,
        });
        return;
      }

      // Step 2: If recovery failed and error is retryable, schedule retry
      if (!result || !result.success) {
        const syncError = this.createSyncError(error, context, operation);

        if (syncError.retryable) {
          try {
            const retryId = await this.retryManager.scheduleRetry(
              operation,
              { context, originalError: error },
              context,
              syncError
            );

            this.logger.info('Retry scheduled', {
              retryId,
              syncId: context.syncId,
              operation,
            });
          } catch (retryError) {
            this.logger.error('Failed to schedule retry', {
              error: retryError.message,
              syncId: context.syncId,
            });

            // Queue for fallback processing
            await this.errorHandler.queueFallbackOperation(syncError, context);
          }
        } else {
          // Non-retryable error, queue for fallback
          await this.errorHandler.queueFallbackOperation(syncError, context);
        }
      }
    } catch (handlingError) {
      this.logger.error('Error in error handling workflow', {
        originalError: error.message,
        handlingError: handlingError.message,
        syncId: context.syncId,
      });
    }
  }

  /**
   * Example: Monitor error handling health
   */
  async getErrorHandlingHealth(): Promise<{
    errorHandler: any;
    retryManager: any;
    fallbackProcessor: any;
  }> {
    return {
      errorHandler: {
        statistics: this.errorHandler.getSyncStatistics(),
        isRunning: true,
      },
      retryManager: {
        statistics: await this.retryManager.getStatistics(),
        circuitBreakers: Array.from(this.retryManager.getCircuitBreakerStates().entries()),
      },
      fallbackProcessor: {
        statistics: this.fallbackProcessor.getStatistics(),
        strategies: this.fallbackProcessor.getStrategies().map((s) => ({
          name: s.name,
          enabled: s.enabled,
          priority: s.priority,
        })),
      },
    };
  }

  /**
   * Example: Cleanup and shutdown
   */
  shutdown(): void {
    this.errorHandler.shutdown();
    this.retryManager.shutdown();
    this.fallbackProcessor.shutdown();
  }

  // Helper methods for demonstration

  private createSyncError(error: Error, context: SyncContext, operation: string): SyncError {
    return {
      code: this.determineErrorCode(error),
      message: error.message,
      timestamp: new Date(),
      retryable: this.isRetryableError(error),
      severity: this.determineSeverity(error),
      category: this.determineCategory(error),
      type: this.determineErrorType(error),
      resourceType: context.syncType,
      resourceId: context.resourcePath || 'unknown',
      tenantId: context.tenantId,
      syncOperation: operation,
      metadata: {
        syncContext: context,
        originalError: error,
        stackTrace: error.stack,
      },
    } as SyncError;
  }

  private determineErrorCode(error: Error): number {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('connection')) return 1001;
    if (message.includes('timeout')) return 1002;
    if (message.includes('conflict')) return 2001;
    if (message.includes('permission')) return 3001;
    if (message.includes('validation')) return 4001;
    return 9999;
  }

  private isRetryableError(error: Error): boolean {
    const retryablePatterns = ['network', 'timeout', 'connection', 'temporary'];
    return retryablePatterns.some((pattern) => error.message.toLowerCase().includes(pattern));
  }

  private determineSeverity(error: Error): any {
    // Implementation would return appropriate ErrorSeverity
    return 'MEDIUM';
  }

  private determineCategory(error: Error): any {
    // Implementation would return appropriate ErrorCategory
    return 'SYSTEM';
  }

  private determineErrorType(error: Error): SyncError['type'] {
    const message = error.message.toLowerCase();
    if (message.includes('network')) return 'network';
    if (message.includes('conflict')) return 'conflict';
    if (message.includes('permission')) return 'permission';
    if (message.includes('validation')) return 'validation';
    if (message.includes('timeout')) return 'timeout';
    return 'resource';
  }

  private async executeRetryOperation(retry: any): Promise<boolean> {
    // Implementation would execute the actual retry operation
    // This is where you'd integrate with your specific sync operations
    this.logger.debug('Executing retry operation', {
      retryId: retry.id,
      operation: retry.operation,
      attemptNumber: retry.attemptNumber,
    });

    // Simulate retry logic
    return Math.random() > 0.3; // 70% success rate for demo
  }

  private async restoreFromBackup(operation: any): Promise<boolean> {
    // Implementation would restore file from backup system
    this.logger.debug('Attempting to restore from backup', {
      operationId: operation.id,
      resourcePath: operation.context.resourcePath,
    });

    // Simulate backup restoration
    return Math.random() > 0.5;
  }

  private async performSimplifiedAgentSync(operation: any): Promise<boolean> {
    // Implementation would perform simplified agent synchronization
    this.logger.debug('Performing simplified agent sync', {
      operationId: operation.id,
      agentId: operation.data?.agentId,
    });

    // Simulate simplified sync
    return Math.random() > 0.4;
  }

  private async useCachedTemplate(operation: any): Promise<boolean> {
    // Implementation would use cached template version
    this.logger.debug('Using cached template', {
      operationId: operation.id,
      templateId: operation.data?.templateId,
    });

    // Simulate cache usage
    return Math.random() > 0.2;
  }

  private triggerIncident(error: SyncError, context: SyncContext): void {
    // Implementation would trigger incident management system
    this.logger.error('Triggering incident for critical sync error', {
      errorCode: error.code,
      syncId: context.syncId,
      tenantId: context.tenantId,
    });
  }

  private notifyDegradedService(operation: any): void {
    // Implementation would notify users of degraded service
    this.logger.warn('Notifying users of degraded service', {
      operation: operation.operation,
      tenantId: operation.context.tenantId,
    });
  }

  private sendAlert(alert: any): void {
    // Implementation would send alert to monitoring/alerting system
    this.logger.error('Sending alert to monitoring system', alert);
  }
}

/**
 * Example usage in a NestJS service
 */
export class ExampleSyncService {
  private errorHandling: SyncErrorHandlingExample;

  constructor(
    private readonly redisService: UnifiedRedisService,
    private readonly monitoringSystem: IMonitoringSystem,
    private readonly logger: Logger
  ) {
    this.errorHandling = new SyncErrorHandlingExample(redisService, monitoringSystem, logger);
  }

  async syncFile(filePath: string, tenantId: string): Promise<void> {
    const context: SyncContext = {
      syncId: `file-sync-${Date.now()}`,
      syncType: 'file',
      component: 'file-sync-service',
      operation: 'file-sync',
      tenantId,
      resourcePath: filePath,
      timestamp: new Date(),
    };

    try {
      // Perform actual file sync operation
      await this.performFileSync(filePath, tenantId);

      this.logger.info('File sync completed successfully', {
        filePath,
        tenantId,
        syncId: context.syncId,
      });
    } catch (error) {
      // Handle error through comprehensive error handling system
      await this.errorHandling.handleSyncError(
        error instanceof Error ? error : new Error(String(error)),
        context,
        'file-sync'
      );
    }
  }

  private async performFileSync(filePath: string, tenantId: string): Promise<void> {
    // Implementation would perform actual file synchronization
    // This might involve chokidar file watching, Redis pub/sub, etc.

    // Simulate potential errors for demonstration
    if (Math.random() < 0.3) {
      throw new Error('Network connection timeout during file sync');
    }

    if (Math.random() < 0.1) {
      throw new Error('File conflict detected during sync');
    }
  }

  async getHealthStatus() {
    return await this.errorHandling.getErrorHandlingHealth();
  }

  onModuleDestroy() {
    this.errorHandling.shutdown();
  }
}
