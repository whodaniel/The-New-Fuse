/**
 * Sync retry manager with exponential backoff and circuit breaker patterns
 * Integrates with existing Redis infrastructure for persistent retry queues
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { SyncError, SyncContext } from './SyncErrorHandler.js';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
  circuitBreakerEnabled: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  id: string;
  operation: string;
  data: any;
  context: SyncContext;
  attemptNumber: number;
  maxAttempts: number;
  nextRetryAt: Date;
  lastError?: SyncError;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Circuit breaker state
 */
export interface CircuitBreakerState {
  operation: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureAt?: Date;
  nextAttemptAt?: Date;
  successCount: number;
}

/**
 * Retry statistics
 */
export interface RetryStatistics {
  totalRetries: number;
  successfulRetries: number;
  failedRetries: number;
  averageAttempts: number;
  circuitBreakerTrips: number;
  operationStats: Record<string, {
    attempts: number;
    successes: number;
    failures: number;
    avgDelay: number;
  }>;
}

/**
 * Sync retry manager with advanced retry patterns
 */
@Injectable()
export class SyncRetryManager extends EventEmitter {
  private readonly logger: Logger;
  private readonly retryQueueKey: string;
  private readonly circuitBreakerKey: string;
  private readonly statsKey: string;
  private readonly config: RetryConfig;
  private readonly circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private processingTimer?: NodeJS.Timeout;
  private statistics: RetryStatistics;

  constructor(
    private readonly redisService: UnifiedRedisService,
    config: Partial<RetryConfig> = {},
    logger?: Logger
  ) {
    super();
    
    this.logger = logger || new Logger('SyncRetryManager');
    this.retryQueueKey = 'sync:retry:queue';
    this.circuitBreakerKey = 'sync:circuit_breakers';
    this.statsKey = 'sync:retry:stats';
    
    this.config = {
      maxAttempts: 5,
      baseDelay: 1000, // 1 second
      maxDelay: 300000, // 5 minutes
      backoffMultiplier: 2,
      jitterEnabled: true,
      circuitBreakerEnabled: true,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000, // 1 minute
      ...config
    };

    this.statistics = {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageAttempts: 0,
      circuitBreakerTrips: 0,
      operationStats: {}
    };

    this.initializeRetryProcessor();
  }

  /**
   * Schedule a retry for a failed operation
   */
  async scheduleRetry(
    operation: string,
    data: any,
    context: SyncContext,
    error: SyncError,
    customConfig?: Partial<RetryConfig>
  ): Promise<string> {
    const config = { ...this.config, ...customConfig };
    
    // Check circuit breaker
    if (config.circuitBreakerEnabled && this.isCircuitBreakerOpen(operation)) {
      this.logger.warn(`Circuit breaker open for operation: ${operation}`);
      throw new Error(`Circuit breaker open for operation: ${operation}`);
    }

    const retryId = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const nextRetryAt = this.calculateNextRetryTime(1, config);

    const retryAttempt: RetryAttempt = {
      id: retryId,
      operation,
      data,
      context,
      attemptNumber: 1,
      maxAttempts: config.maxAttempts,
      nextRetryAt,
      lastError: error,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in Redis sorted set with score as retry time
    const score = nextRetryAt.getTime();
    await this.redisService.zadd(this.retryQueueKey, score, JSON.stringify(retryAttempt));

    this.logger.debug(`Scheduled retry for operation: ${operation}`, {
      retryId,
      attemptNumber: 1,
      nextRetryAt,
      tenantId: context.tenantId
    });

    this.emit('retryScheduled', { retryAttempt, error });
    
    return retryId;
  }

  /**
   * Process pending retries
   */
  async processRetries(batchSize: number = 20): Promise<void> {
    try {
      const now = Date.now();
      
      // Get retries ready for processing
      const retryData = await this.redisService.zrange(this.retryQueueKey, 0, batchSize - 1);
      
      for (const retryStr of retryData) {
        try {
          const retry: RetryAttempt = JSON.parse(retryStr);
          
          // Check if it's time to retry
          if (retry.nextRetryAt.getTime() > now) {
            continue;
          }

          // Remove from queue
          await this.redisService.zrem(this.retryQueueKey, retryStr);

          // Check circuit breaker again
          if (this.config.circuitBreakerEnabled && this.isCircuitBreakerOpen(retry.operation)) {
            this.logger.warn(`Circuit breaker open, skipping retry: ${retry.id}`);
            continue;
          }

          // Attempt to process the retry
          const success = await this.executeRetry(retry);

          if (success) {
            await this.handleRetrySuccess(retry);
          } else {
            await this.handleRetryFailure(retry);
          }

        } catch (processError) {
          this.logger.error('Error processing retry:', processError);
        }
      }

    } catch (error) {
      this.logger.error('Error processing retry queue:', error);
    }
  }

  /**
   * Get retry statistics
   */
  async getStatistics(): Promise<RetryStatistics> {
    try {
      // Load statistics from Redis
      const statsData = await this.redisService.get(this.statsKey);
      if (statsData) {
        const persistedStats = JSON.parse(statsData);
        return { ...this.statistics, ...persistedStats };
      }
    } catch (error) {
      this.logger.error('Error loading retry statistics:', error);
    }
    
    return { ...this.statistics };
  }

  /**
   * Get circuit breaker states
   */
  getCircuitBreakerStates(): Map<string, CircuitBreakerState> {
    return new Map(this.circuitBreakers);
  }

  /**
   * Reset circuit breaker for an operation
   */
  async resetCircuitBreaker(operation: string): Promise<void> {
    const breaker = this.circuitBreakers.get(operation);
    if (breaker) {
      breaker.state = 'closed';
      breaker.failureCount = 0;
      breaker.successCount = 0;
      breaker.lastFailureAt = undefined;
      breaker.nextAttemptAt = undefined;
      
      await this.persistCircuitBreakerState(operation, breaker);
      
      this.logger.info(`Circuit breaker reset for operation: ${operation}`);
      this.emit('circuitBreakerReset', { operation, breaker });
    }
  }

  /**
   * Clear all pending retries
   */
  async clearRetryQueue(): Promise<number> {
    const count = await this.redisService.zrange(this.retryQueueKey, 0, -1);
    await this.redisService.del(this.retryQueueKey);
    
    this.logger.info(`Cleared ${count.length} pending retries`);
    return count.length;
  }

  /**
   * Shutdown retry manager
   */
  shutdown(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = undefined;
    }
    
    this.removeAllListeners();
    this.logger.debug('SyncRetryManager shutdown complete');
  }

  /**
   * Initialize retry processor
   */
  private initializeRetryProcessor(): void {
    // Process retries every 5 seconds
    this.processingTimer = setInterval(() => {
      this.processRetries().catch(error => {
        this.logger.error('Error in retry processor:', error);
      });
    }, 5000);

    // Load circuit breaker states from Redis
    this.loadCircuitBreakerStates().catch(error => {
      this.logger.error('Error loading circuit breaker states:', error);
    });

    this.logger.debug('Retry processor initialized');
  }

  /**
   * Calculate next retry time with exponential backoff and jitter
   */
  private calculateNextRetryTime(attemptNumber: number, config: RetryConfig): Date {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attemptNumber - 1);
    
    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.jitterEnabled) {
      const jitter = delay * 0.1 * Math.random(); // Up to 10% jitter
      delay += jitter;
    }
    
    return new Date(Date.now() + delay);
  }

  /**
   * Execute a retry attempt
   */
  private async executeRetry(retry: RetryAttempt): Promise<boolean> {
    try {
      this.logger.debug(`Executing retry: ${retry.id}`, {
        operation: retry.operation,
        attemptNumber: retry.attemptNumber,
        tenantId: retry.context.tenantId
      });

      // Emit retry execution event for custom handlers
      const result = await new Promise<boolean>((resolve) => {
        this.emit('executeRetry', retry, resolve);
        
        // Default timeout
        setTimeout(() => resolve(false), 30000);
      });

      return result;

    } catch (error) {
      this.logger.error(`Error executing retry ${retry.id}:`, error);
      return false;
    }
  }

  /**
   * Handle successful retry
   */
  private async handleRetrySuccess(retry: RetryAttempt): Promise<void> {
    this.logger.info(`Retry succeeded: ${retry.id}`, {
      operation: retry.operation,
      attemptNumber: retry.attemptNumber,
      tenantId: retry.context.tenantId
    });

    // Update statistics
    this.statistics.successfulRetries++;
    this.updateOperationStats(retry.operation, true, retry.attemptNumber);

    // Update circuit breaker
    if (this.config.circuitBreakerEnabled) {
      await this.recordCircuitBreakerSuccess(retry.operation);
    }

    // Persist statistics
    await this.persistStatistics();

    this.emit('retrySuccess', retry);
  }

  /**
   * Handle failed retry
   */
  private async handleRetryFailure(retry: RetryAttempt): Promise<void> {
    if (retry.attemptNumber < retry.maxAttempts) {
      // Schedule next retry
      retry.attemptNumber++;
      retry.nextRetryAt = this.calculateNextRetryTime(retry.attemptNumber, this.config);
      retry.updatedAt = new Date();

      const score = retry.nextRetryAt.getTime();
      await this.redisService.zadd(this.retryQueueKey, score, JSON.stringify(retry));

      this.logger.debug(`Retry failed, scheduling next attempt: ${retry.id}`, {
        operation: retry.operation,
        attemptNumber: retry.attemptNumber,
        nextRetryAt: retry.nextRetryAt,
        tenantId: retry.context.tenantId
      });

      this.emit('retryRescheduled', retry);

    } else {
      // Max attempts reached
      this.logger.error(`Retry exhausted: ${retry.id}`, {
        operation: retry.operation,
        maxAttempts: retry.maxAttempts,
        tenantId: retry.context.tenantId
      });

      // Update statistics
      this.statistics.failedRetries++;
      this.updateOperationStats(retry.operation, false, retry.attemptNumber);

      // Update circuit breaker
      if (this.config.circuitBreakerEnabled) {
        await this.recordCircuitBreakerFailure(retry.operation);
      }

      // Persist statistics
      await this.persistStatistics();

      this.emit('retryExhausted', retry);
    }
  }

  /**
   * Check if circuit breaker is open for an operation
   */
  private isCircuitBreakerOpen(operation: string): boolean {
    const breaker = this.circuitBreakers.get(operation);
    if (!breaker) return false;

    if (breaker.state === 'open') {
      // Check if timeout has passed
      if (breaker.nextAttemptAt && Date.now() >= breaker.nextAttemptAt.getTime()) {
        breaker.state = 'half-open';
        this.logger.debug(`Circuit breaker transitioning to half-open: ${operation}`);
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Record circuit breaker success
   */
  private async recordCircuitBreakerSuccess(operation: string): Promise<void> {
    let breaker = this.circuitBreakers.get(operation);
    if (!breaker) {
      breaker = {
        operation,
        state: 'closed',
        failureCount: 0,
        successCount: 0
      };
      this.circuitBreakers.set(operation, breaker);
    }

    breaker.successCount++;

    if (breaker.state === 'half-open') {
      // Transition back to closed
      breaker.state = 'closed';
      breaker.failureCount = 0;
      this.logger.info(`Circuit breaker closed: ${operation}`);
      this.emit('circuitBreakerClosed', { operation, breaker });
    }

    await this.persistCircuitBreakerState(operation, breaker);
  }

  /**
   * Record circuit breaker failure
   */
  private async recordCircuitBreakerFailure(operation: string): Promise<void> {
    let breaker = this.circuitBreakers.get(operation);
    if (!breaker) {
      breaker = {
        operation,
        state: 'closed',
        failureCount: 0,
        successCount: 0
      };
      this.circuitBreakers.set(operation, breaker);
    }

    breaker.failureCount++;
    breaker.lastFailureAt = new Date();

    if (breaker.failureCount >= this.config.circuitBreakerThreshold) {
      breaker.state = 'open';
      breaker.nextAttemptAt = new Date(Date.now() + this.config.circuitBreakerTimeout);
      
      this.statistics.circuitBreakerTrips++;
      
      this.logger.warn(`Circuit breaker opened: ${operation}`, {
        failureCount: breaker.failureCount,
        nextAttemptAt: breaker.nextAttemptAt
      });
      
      this.emit('circuitBreakerOpened', { operation, breaker });
    }

    await this.persistCircuitBreakerState(operation, breaker);
  }

  /**
   * Update operation-specific statistics
   */
  private updateOperationStats(operation: string, success: boolean, attempts: number): void {
    if (!this.statistics.operationStats[operation]) {
      this.statistics.operationStats[operation] = {
        attempts: 0,
        successes: 0,
        failures: 0,
        avgDelay: 0
      };
    }

    const stats = this.statistics.operationStats[operation];
    stats.attempts += attempts;
    
    if (success) {
      stats.successes++;
    } else {
      stats.failures++;
    }

    // Update overall statistics
    this.statistics.totalRetries++;
    const totalOperations = this.statistics.successfulRetries + this.statistics.failedRetries;
    if (totalOperations > 0) {
      this.statistics.averageAttempts = this.statistics.totalRetries / totalOperations;
    }
  }

  /**
   * Persist statistics to Redis
   */
  private async persistStatistics(): Promise<void> {
    try {
      await this.redisService.set(this.statsKey, JSON.stringify(this.statistics), 3600); // 1 hour TTL
    } catch (error) {
      this.logger.error('Error persisting retry statistics:', error);
    }
  }

  /**
   * Persist circuit breaker state to Redis
   */
  private async persistCircuitBreakerState(operation: string, breaker: CircuitBreakerState): Promise<void> {
    try {
      const key = `${this.circuitBreakerKey}:${operation}`;
      await this.redisService.set(key, JSON.stringify(breaker), 3600); // 1 hour TTL
    } catch (error) {
      this.logger.error('Error persisting circuit breaker state:', error);
    }
  }

  /**
   * Load circuit breaker states from Redis
   */
  private async loadCircuitBreakerStates(): Promise<void> {
    try {
      const pattern = `${this.circuitBreakerKey}:*`;
      const keys = await this.redisService.keys(pattern);
      
      for (const key of keys) {
        const data = await this.redisService.get(key);
        if (data) {
          const breaker: CircuitBreakerState = JSON.parse(data);
          this.circuitBreakers.set(breaker.operation, breaker);
        }
      }
      
      this.logger.debug(`Loaded ${this.circuitBreakers.size} circuit breaker states`);
      
    } catch (error) {
      this.logger.error('Error loading circuit breaker states:', error);
    }
  }
}