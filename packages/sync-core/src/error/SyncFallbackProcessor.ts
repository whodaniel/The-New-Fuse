/**
 * Sync fallback processor for handling failed operations
 * Provides graceful degradation and alternative processing paths
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { IMetricsCollector } from '@tnf/core-monitoring';
import { SyncError, SyncContext, FallbackOperation } from './SyncErrorHandler.js';

/**
 * Fallback strategy configuration
 */
export interface FallbackStrategy {
  name: string;
  priority: number;
  applicableOperations: string[];
  applicableResourceTypes: string[];
  maxExecutionTime: number;
  enabled: boolean;
  execute: (operation: FallbackOperation) => Promise<FallbackResult>;
}

/**
 * Fallback execution result
 */
export interface FallbackResult {
  success: boolean;
  strategy: string;
  executionTime: number;
  data?: any;
  error?: Error;
  shouldRetry: boolean;
  alternativeAction?: string;
}

/**
 * Fallback processor configuration
 */
export interface FallbackProcessorConfig {
  enabled: boolean;
  processingInterval: number;
  batchSize: number;
  maxConcurrentProcessing: number;
  defaultTimeout: number;
  enableMetrics: boolean;
  enableAlternativeActions: boolean;
  gracefulDegradationEnabled: boolean;
}

/**
 * Fallback statistics
 */
export interface FallbackStatistics {
  totalProcessed: number;
  successfulFallbacks: number;
  failedFallbacks: number;
  averageExecutionTime: number;
  strategiesUsed: Record<string, number>;
  operationTypes: Record<string, number>;
  alternativeActionsTriggered: number;
  gracefulDegradations: number;
}

/**
 * Alternative action for failed operations
 */
export interface AlternativeAction {
  name: string;
  description: string;
  execute: (operation: FallbackOperation, context: SyncContext) => Promise<boolean>;
}

/**
 * Sync fallback processor with multiple recovery strategies
 */
@Injectable()
export class SyncFallbackProcessor extends EventEmitter {
  private readonly logger: Logger;
  private readonly config: FallbackProcessorConfig;
  private readonly strategies: Map<string, FallbackStrategy> = new Map();
  private readonly alternativeActions: Map<string, AlternativeAction> = new Map();
  private readonly statistics: FallbackStatistics;
  private processingTimer?: NodeJS.Timeout;
  private currentlyProcessing = 0;
  private metricsCollector?: IMetricsCollector;

  constructor(
    private readonly redisService: UnifiedRedisService,
    config: Partial<FallbackProcessorConfig> = {},
    metricsCollector?: IMetricsCollector,
    logger?: Logger
  ) {
    super();
    
    this.logger = logger || new Logger('SyncFallbackProcessor');
    this.metricsCollector = metricsCollector;
    
    this.config = {
      enabled: true,
      processingInterval: 10000, // 10 seconds
      batchSize: 5,
      maxConcurrentProcessing: 3,
      defaultTimeout: 30000, // 30 seconds
      enableMetrics: true,
      enableAlternativeActions: true,
      gracefulDegradationEnabled: true,
      ...config
    };

    this.statistics = {
      totalProcessed: 0,
      successfulFallbacks: 0,
      failedFallbacks: 0,
      averageExecutionTime: 0,
      strategiesUsed: {},
      operationTypes: {},
      alternativeActionsTriggered: 0,
      gracefulDegradations: 0
    };

    this.initializeDefaultStrategies();
    this.initializeDefaultAlternativeActions();
    this.startProcessing();
  }

  /**
   * Register a custom fallback strategy
   */
  registerStrategy(strategy: FallbackStrategy): void {
    this.strategies.set(strategy.name, strategy);
    this.logger.debug(`Registered fallback strategy: ${strategy.name}`);
  }

  /**
   * Register an alternative action
   */
  registerAlternativeAction(action: AlternativeAction): void {
    this.alternativeActions.set(action.name, action);
    this.logger.debug(`Registered alternative action: ${action.name}`);
  }

  /**
   * Process a single fallback operation
   */
  async processFallbackOperation(operation: FallbackOperation): Promise<FallbackResult> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Processing fallback operation: ${operation.id}`, {
        operation: operation.operation,
        resourceType: operation.context.syncType,
        tenantId: operation.context.tenantId
      });

      // Find applicable strategies
      const applicableStrategies = this.findApplicableStrategies(operation);
      
      if (applicableStrategies.length === 0) {
        return await this.handleNoApplicableStrategy(operation, startTime);
      }

      // Try strategies in priority order
      for (const strategy of applicableStrategies) {
        if (!strategy.enabled) continue;

        try {
          const result = await this.executeStrategyWithTimeout(strategy, operation);
          
          if (result.success) {
            await this.handleSuccessfulFallback(operation, result, startTime);
            return result;
          }

        } catch (error) {
          this.logger.warn(`Strategy ${strategy.name} failed for operation ${operation.id}:`, error);
        }
      }

      // All strategies failed, try alternative actions
      if (this.config.enableAlternativeActions) {
        const alternativeResult = await this.tryAlternativeActions(operation);
        if (alternativeResult) {
          return alternativeResult;
        }
      }

      // Graceful degradation as last resort
      if (this.config.gracefulDegradationEnabled) {
        return await this.performGracefulDegradation(operation, startTime);
      }

      return await this.handleCompleteFailure(operation, startTime);

    } catch (error) {
      this.logger.error(`Error processing fallback operation ${operation.id}:`, error);
      return {
        success: false,
        strategy: 'error',
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error)),
        shouldRetry: false
      };
    }
  }

  /**
   * Get fallback statistics
   */
  getStatistics(): FallbackStatistics {
    return { ...this.statistics };
  }

  /**
   * Get registered strategies
   */
  getStrategies(): FallbackStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get registered alternative actions
   */
  getAlternativeActions(): AlternativeAction[] {
    return Array.from(this.alternativeActions.values());
  }

  /**
   * Enable or disable a strategy
   */
  setStrategyEnabled(strategyName: string, enabled: boolean): void {
    const strategy = this.strategies.get(strategyName);
    if (strategy) {
      strategy.enabled = enabled;
      this.logger.info(`Strategy ${strategyName} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Clear statistics
   */
  clearStatistics(): void {
    this.statistics.totalProcessed = 0;
    this.statistics.successfulFallbacks = 0;
    this.statistics.failedFallbacks = 0;
    this.statistics.averageExecutionTime = 0;
    this.statistics.strategiesUsed = {};
    this.statistics.operationTypes = {};
    this.statistics.alternativeActionsTriggered = 0;
    this.statistics.gracefulDegradations = 0;
  }

  /**
   * Shutdown processor
   */
  shutdown(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = undefined;
    }
    
    this.removeAllListeners();
    this.logger.debug('SyncFallbackProcessor shutdown complete');
  }

  /**
   * Initialize default fallback strategies
   */
  private initializeDefaultStrategies(): void {
    // Cache fallback strategy
    this.registerStrategy({
      name: 'cacheRestore',
      priority: 1,
      applicableOperations: ['sync', 'update', 'create'],
      applicableResourceTypes: ['file', 'config', 'template'],
      maxExecutionTime: 5000,
      enabled: true,
      execute: async (operation: FallbackOperation) => {
        return await this.executeCacheRestore(operation);
      }
    });

    // Local storage fallback
    this.registerStrategy({
      name: 'localStorage',
      priority: 2,
      applicableOperations: ['sync', 'save'],
      applicableResourceTypes: ['file', 'config'],
      maxExecutionTime: 3000,
      enabled: true,
      execute: async (operation: FallbackOperation) => {
        return await this.executeLocalStorage(operation);
      }
    });

    // Simplified sync strategy
    this.registerStrategy({
      name: 'simplifiedSync',
      priority: 3,
      applicableOperations: ['sync'],
      applicableResourceTypes: ['agent', 'task', 'template'],
      maxExecutionTime: 10000,
      enabled: true,
      execute: async (operation: FallbackOperation) => {
        return await this.executeSimplifiedSync(operation);
      }
    });

    // Read-only mode strategy
    this.registerStrategy({
      name: 'readOnlyMode',
      priority: 4,
      applicableOperations: ['update', 'delete', 'create'],
      applicableResourceTypes: ['*'],
      maxExecutionTime: 1000,
      enabled: true,
      execute: async (operation: FallbackOperation) => {
        return await this.executeReadOnlyMode(operation);
      }
    });

    // Queue for later strategy
    this.registerStrategy({
      name: 'queueForLater',
      priority: 5,
      applicableOperations: ['*'],
      applicableResourceTypes: ['*'],
      maxExecutionTime: 2000,
      enabled: true,
      execute: async (operation: FallbackOperation) => {
        return await this.executeQueueForLater(operation);
      }
    });
  }

  /**
   * Initialize default alternative actions
   */
  private initializeDefaultAlternativeActions(): void {
    // Notify user action
    this.registerAlternativeAction({
      name: 'notifyUser',
      description: 'Notify user of sync failure and provide manual options',
      execute: async (operation: FallbackOperation, context: SyncContext) => {
        this.emit('userNotificationRequired', {
          operation,
          context,
          message: `Sync operation failed: ${operation.operation}`,
          actions: ['retry', 'skip', 'manual_resolve']
        });
        return true;
      }
    });

    // Log for manual review
    this.registerAlternativeAction({
      name: 'logForReview',
      description: 'Log operation for manual review by administrators',
      execute: async (operation: FallbackOperation, context: SyncContext) => {
        this.logger.error('Operation requires manual review', {
          operationId: operation.id,
          operation: operation.operation,
          resourceType: context.syncType,
          tenantId: context.tenantId,
          data: operation.data
        });
        
        this.emit('manualReviewRequired', { operation, context });
        return true;
      }
    });

    // Create incident
    this.registerAlternativeAction({
      name: 'createIncident',
      description: 'Create incident for critical sync failures',
      execute: async (operation: FallbackOperation, context: SyncContext) => {
        this.emit('incidentCreated', {
          severity: 'high',
          title: `Critical sync failure: ${operation.operation}`,
          description: `Failed to sync ${context.syncType} for tenant ${context.tenantId}`,
          operation,
          context
        });
        return true;
      }
    });
  }

  /**
   * Start processing fallback operations
   */
  private startProcessing(): void {
    if (!this.config.enabled) {
      this.logger.info('Fallback processor is disabled');
      return;
    }

    this.processingTimer = setInterval(() => {
      if (this.currentlyProcessing < this.config.maxConcurrentProcessing) {
        this.processNextBatch().catch(error => {
          this.logger.error('Error in fallback processing:', error);
        });
      }
    }, this.config.processingInterval);

    this.logger.debug('Fallback processor started');
  }

  /**
   * Process next batch of fallback operations
   */
  private async processNextBatch(): Promise<void> {
    // This method would be called by the SyncErrorHandler
    // when it emits 'processFallbackOperation' events
    this.emit('requestFallbackOperations', this.config.batchSize);
  }

  /**
   * Find applicable strategies for an operation
   */
  private findApplicableStrategies(operation: FallbackOperation): FallbackStrategy[] {
    const strategies = Array.from(this.strategies.values())
      .filter(strategy => {
        // Check operation applicability
        const operationMatch = strategy.applicableOperations.includes('*') ||
                              strategy.applicableOperations.includes(operation.operation);
        
        // Check resource type applicability
        const resourceMatch = strategy.applicableResourceTypes.includes('*') ||
                             strategy.applicableResourceTypes.includes(operation.context.syncType);
        
        return operationMatch && resourceMatch && strategy.enabled;
      })
      .sort((a, b) => a.priority - b.priority); // Sort by priority (lower = higher priority)

    return strategies;
  }

  /**
   * Execute strategy with timeout
   */
  private async executeStrategyWithTimeout(
    strategy: FallbackStrategy,
    operation: FallbackOperation
  ): Promise<FallbackResult> {
    const timeout = strategy.maxExecutionTime || this.config.defaultTimeout;
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Strategy ${strategy.name} timed out after ${timeout}ms`));
      }, timeout);

      strategy.execute(operation)
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Handle successful fallback
   */
  private async handleSuccessfulFallback(
    operation: FallbackOperation,
    result: FallbackResult,
    startTime: number
  ): Promise<void> {
    const executionTime = Date.now() - startTime;
    
    this.statistics.totalProcessed++;
    this.statistics.successfulFallbacks++;
    this.updateAverageExecutionTime(executionTime);
    this.updateStrategyStats(result.strategy);
    this.updateOperationTypeStats(operation.operation);

    if (this.metricsCollector) {
      this.metricsCollector.incrementCounter('sync_fallback_success_total', {
        strategy: result.strategy,
        operation: operation.operation,
        resourceType: operation.context.syncType
      });
      this.metricsCollector.recordHistogram('sync_fallback_execution_time', executionTime, {
        strategy: result.strategy
      });
    }

    this.logger.info(`Fallback successful: ${operation.id}`, {
      strategy: result.strategy,
      executionTime,
      operation: operation.operation
    });

    this.emit('fallbackSuccess', { operation, result });
  }

  /**
   * Handle case where no applicable strategy is found
   */
  private async handleNoApplicableStrategy(
    operation: FallbackOperation,
    startTime: number
  ): Promise<FallbackResult> {
    this.logger.warn(`No applicable fallback strategy for operation: ${operation.id}`);
    
    return {
      success: false,
      strategy: 'none',
      executionTime: Date.now() - startTime,
      error: new Error('No applicable fallback strategy found'),
      shouldRetry: false,
      alternativeAction: 'logForReview'
    };
  }

  /**
   * Try alternative actions when all strategies fail
   */
  private async tryAlternativeActions(operation: FallbackOperation): Promise<FallbackResult | null> {
    for (const action of this.alternativeActions.values()) {
      try {
        const success = await action.execute(operation, operation.context);
        if (success) {
          this.statistics.alternativeActionsTriggered++;
          
          this.logger.info(`Alternative action succeeded: ${action.name} for operation ${operation.id}`);
          
          return {
            success: true,
            strategy: 'alternativeAction',
            executionTime: 0,
            shouldRetry: false,
            alternativeAction: action.name
          };
        }
      } catch (error) {
        this.logger.warn(`Alternative action ${action.name} failed:`, error);
      }
    }
    
    return null;
  }

  /**
   * Perform graceful degradation
   */
  private async performGracefulDegradation(
    operation: FallbackOperation,
    startTime: number
  ): Promise<FallbackResult> {
    this.statistics.gracefulDegradations++;
    
    this.logger.info(`Performing graceful degradation for operation: ${operation.id}`);
    
    // Emit graceful degradation event
    this.emit('gracefulDegradation', {
      operation,
      message: 'System operating in degraded mode due to sync failure'
    });

    return {
      success: true,
      strategy: 'gracefulDegradation',
      executionTime: Date.now() - startTime,
      shouldRetry: false,
      data: { degradedMode: true }
    };
  }

  /**
   * Handle complete failure
   */
  private async handleCompleteFailure(
    operation: FallbackOperation,
    startTime: number
  ): Promise<FallbackResult> {
    this.statistics.totalProcessed++;
    this.statistics.failedFallbacks++;
    
    this.logger.error(`Complete fallback failure for operation: ${operation.id}`);
    
    this.emit('fallbackFailure', { operation });

    return {
      success: false,
      strategy: 'none',
      executionTime: Date.now() - startTime,
      error: new Error('All fallback strategies failed'),
      shouldRetry: false
    };
  }

  /**
   * Update average execution time
   */
  private updateAverageExecutionTime(executionTime: number): void {
    const total = this.statistics.successfulFallbacks + this.statistics.failedFallbacks;
    this.statistics.averageExecutionTime = 
      (this.statistics.averageExecutionTime * (total - 1) + executionTime) / total;
  }

  /**
   * Update strategy usage statistics
   */
  private updateStrategyStats(strategy: string): void {
    this.statistics.strategiesUsed[strategy] = (this.statistics.strategiesUsed[strategy] || 0) + 1;
  }

  /**
   * Update operation type statistics
   */
  private updateOperationTypeStats(operation: string): void {
    this.statistics.operationTypes[operation] = (this.statistics.operationTypes[operation] || 0) + 1;
  }

  // Default strategy implementations

  /**
   * Execute cache restore strategy
   */
  private async executeCacheRestore(operation: FallbackOperation): Promise<FallbackResult> {
    const startTime = Date.now();
    
    try {
      // Try to restore from Redis cache
      const cacheKey = `sync:cache:${operation.context.syncType}:${operation.context.resourcePath}`;
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        this.emit('cacheRestoreSuccess', { operation, data: JSON.parse(cachedData) });
        
        return {
          success: true,
          strategy: 'cacheRestore',
          executionTime: Date.now() - startTime,
          data: JSON.parse(cachedData),
          shouldRetry: false
        };
      }
      
      return {
        success: false,
        strategy: 'cacheRestore',
        executionTime: Date.now() - startTime,
        error: new Error('No cached data available'),
        shouldRetry: false
      };
      
    } catch (error) {
      return {
        success: false,
        strategy: 'cacheRestore',
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error)),
        shouldRetry: false
      };
    }
  }

  /**
   * Execute local storage strategy
   */
  private async executeLocalStorage(operation: FallbackOperation): Promise<FallbackResult> {
    const startTime = Date.now();
    
    // Emit event for local storage handling
    this.emit('localStorageRequired', { operation });
    
    return {
      success: true,
      strategy: 'localStorage',
      executionTime: Date.now() - startTime,
      shouldRetry: false,
      data: { storedLocally: true }
    };
  }

  /**
   * Execute simplified sync strategy
   */
  private async executeSimplifiedSync(operation: FallbackOperation): Promise<FallbackResult> {
    const startTime = Date.now();
    
    // Emit event for simplified sync
    this.emit('simplifiedSyncRequired', { operation });
    
    return {
      success: true,
      strategy: 'simplifiedSync',
      executionTime: Date.now() - startTime,
      shouldRetry: true,
      data: { simplified: true }
    };
  }

  /**
   * Execute read-only mode strategy
   */
  private async executeReadOnlyMode(operation: FallbackOperation): Promise<FallbackResult> {
    const startTime = Date.now();
    
    // Switch to read-only mode
    this.emit('readOnlyModeActivated', { operation });
    
    return {
      success: true,
      strategy: 'readOnlyMode',
      executionTime: Date.now() - startTime,
      shouldRetry: false,
      data: { readOnlyMode: true }
    };
  }

  /**
   * Execute queue for later strategy
   */
  private async executeQueueForLater(operation: FallbackOperation): Promise<FallbackResult> {
    const startTime = Date.now();
    
    try {
      // Queue operation for later processing
      const queueKey = 'sync:deferred:operations';
      const deferredOp = {
        ...operation,
        deferredAt: new Date(),
        reason: 'fallback_queue'
      };
      
      await this.redisService.lpush(queueKey, JSON.stringify(deferredOp));
      
      return {
        success: true,
        strategy: 'queueForLater',
        executionTime: Date.now() - startTime,
        shouldRetry: false,
        data: { queued: true }
      };
      
    } catch (error) {
      return {
        success: false,
        strategy: 'queueForLater',
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error)),
        shouldRetry: false
      };
    }
  }
}