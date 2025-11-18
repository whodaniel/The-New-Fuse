/**
 * Retry Logic for Critical Operations
 *
 * @description
 * Provides utilities for implementing retry logic with various strategies
 * including exponential backoff, jitter, and circuit breaker patterns.
 */

import { Logger } from './Logger.js';
import { ApplicationError } from '../errors/CustomErrors.js';

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;

  /** Initial delay in milliseconds */
  initialDelay: number;

  /** Maximum delay in milliseconds */
  maxDelay?: number;

  /** Backoff multiplier for exponential backoff */
  backoffMultiplier?: number;

  /** Add jitter to delays (prevents thundering herd) */
  jitter?: boolean;

  /** Only retry on specific error types */
  retryableErrors?: Array<new (...args: any[]) => Error>;

  /** Custom function to determine if error is retryable */
  shouldRetry?: (error: Error, attempt: number) => boolean;

  /** Callback called before each retry */
  onRetry?: (error: Error, attempt: number, delay: number) => void | Promise<void>;

  /** Timeout for each attempt in milliseconds */
  timeout?: number;
}

/**
 * Retry result
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
}

/**
 * Retry statistics
 */
export interface RetryStatistics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  averageAttempts: number;
  averageDuration: number;
}

/**
 * Retry handler with various strategies
 */
export class RetryHandler {
  private readonly logger: Logger;
  private readonly statistics: Map<string, RetryStatistics> = new Map();

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('RetryHandler');
  }

  /**
   * Execute operation with retry logic
   */
  async execute<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    operationName?: string
  ): Promise<RetryResult<T>> {
    const finalConfig = this.mergeConfig(config);
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt < finalConfig.maxAttempts) {
      attempt++;

      try {
        // Execute with timeout if configured
        const result = finalConfig.timeout
          ? await this.executeWithTimeout(operation, finalConfig.timeout)
          : await operation();

        const duration = Date.now() - startTime;

        this.updateStatistics(operationName, true, attempt, duration);

        this.logger.debug(`Operation succeeded on attempt ${attempt}`, {
          operationName,
          attempts: attempt,
          duration,
        });

        return {
          success: true,
          data: result,
          attempts: attempt,
          totalDuration: duration,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should retry
        if (!this.shouldRetry(lastError, attempt, finalConfig)) {
          this.logger.warn(`Operation failed, not retrying`, {
            operationName,
            attempt,
            error: lastError.message,
          });
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, finalConfig);

        this.logger.info(`Operation failed, retrying in ${delay}ms`, {
          operationName,
          attempt,
          maxAttempts: finalConfig.maxAttempts,
          error: lastError.message,
        });

        // Call onRetry callback if provided
        if (finalConfig.onRetry) {
          await finalConfig.onRetry(lastError, attempt, delay);
        }

        // Wait before next attempt
        await this.delay(delay);
      }
    }

    const duration = Date.now() - startTime;
    this.updateStatistics(operationName, false, attempt, duration);

    return {
      success: false,
      error: lastError,
      attempts: attempt,
      totalDuration: duration,
    };
  }

  /**
   * Execute with exponential backoff
   */
  async withExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    initialDelay: number = 1000,
    operationName?: string
  ): Promise<T> {
    const result = await this.execute(
      operation,
      {
        maxAttempts,
        initialDelay,
        backoffMultiplier: 2,
        jitter: true,
      },
      operationName
    );

    if (!result.success) {
      throw result.error || new Error('Operation failed after retries');
    }

    return result.data!;
  }

  /**
   * Execute with linear backoff
   */
  async withLinearBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000,
    operationName?: string
  ): Promise<T> {
    const result = await this.execute(
      operation,
      {
        maxAttempts,
        initialDelay: delay,
        backoffMultiplier: 1,
        jitter: false,
      },
      operationName
    );

    if (!result.success) {
      throw result.error || new Error('Operation failed after retries');
    }

    return result.data!;
  }

  /**
   * Execute with custom retry predicate
   */
  async withCustomRetry<T>(
    operation: () => Promise<T>,
    shouldRetry: (error: Error, attempt: number) => boolean,
    maxAttempts: number = 3,
    operationName?: string
  ): Promise<T> {
    const result = await this.execute(
      operation,
      {
        maxAttempts,
        initialDelay: 1000,
        shouldRetry,
      },
      operationName
    );

    if (!result.success) {
      throw result.error || new Error('Operation failed after retries');
    }

    return result.data!;
  }

  /**
   * Get retry statistics for an operation
   */
  getStatistics(operationName: string): RetryStatistics | undefined {
    return this.statistics.get(operationName);
  }

  /**
   * Get all retry statistics
   */
  getAllStatistics(): Map<string, RetryStatistics> {
    return new Map(this.statistics);
  }

  /**
   * Clear statistics
   */
  clearStatistics(operationName?: string): void {
    if (operationName) {
      this.statistics.delete(operationName);
    } else {
      this.statistics.clear();
    }
  }

  /**
   * Merge user config with defaults
   */
  private mergeConfig(config: Partial<RetryConfig>): RetryConfig {
    return {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      ...config,
    };
  }

  /**
   * Calculate delay for next retry attempt
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.initialDelay * Math.pow(config.backoffMultiplier || 1, attempt - 1);

    // Apply max delay cap
    if (config.maxDelay) {
      delay = Math.min(delay, config.maxDelay);
    }

    // Add jitter if enabled (±25% randomization)
    if (config.jitter) {
      const jitterFactor = 0.25;
      const jitterAmount = delay * jitterFactor;
      delay = delay + (Math.random() * 2 - 1) * jitterAmount;
    }

    return Math.floor(delay);
  }

  /**
   * Determine if should retry
   */
  private shouldRetry(error: Error, attempt: number, config: RetryConfig): boolean {
    // Check if we've exceeded max attempts
    if (attempt >= config.maxAttempts) {
      return false;
    }

    // Use custom predicate if provided
    if (config.shouldRetry) {
      return config.shouldRetry(error, attempt);
    }

    // Check if error type is in retryable list
    if (config.retryableErrors && config.retryableErrors.length > 0) {
      return config.retryableErrors.some((ErrorType) => error instanceof ErrorType);
    }

    // For ApplicationError, check retryable flag
    if (error instanceof ApplicationError) {
      return error.retryable;
    }

    // Default: retry on all errors
    return true;
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timeout after ${timeout}ms`)), timeout)
      ),
    ]);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update retry statistics
   */
  private updateStatistics(
    operationName: string | undefined,
    success: boolean,
    attempts: number,
    duration: number
  ): void {
    if (!operationName) return;

    const stats = this.statistics.get(operationName) || {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      averageAttempts: 0,
      averageDuration: 0,
    };

    stats.totalAttempts += attempts;
    if (success) {
      stats.successfulAttempts++;
    } else {
      stats.failedAttempts++;
    }

    const totalOperations = stats.successfulAttempts + stats.failedAttempts;
    stats.averageAttempts = stats.totalAttempts / totalOperations;
    stats.averageDuration =
      (stats.averageDuration * (totalOperations - 1) + duration) / totalOperations;

    this.statistics.set(operationName, stats);
  }
}

/**
 * Circuit Breaker for preventing cascading failures
 */
export class CircuitBreaker<T> {
  private readonly logger: Logger;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private nextAttemptTime?: number;

  constructor(
    private readonly operation: () => Promise<T>,
    private readonly config: {
      failureThreshold: number;
      resetTimeout: number;
      halfOpenRequests?: number;
      operationName?: string;
    }
  ) {
    this.logger = new Logger('CircuitBreaker');
  }

  /**
   * Execute operation with circuit breaker
   */
  async execute(): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        this.logger.info('Circuit breaker entering HALF_OPEN state', {
          operation: this.config.operationName,
        });
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await this.operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current state
   */
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      const halfOpenRequests = this.config.halfOpenRequests || 1;

      if (this.successCount >= halfOpenRequests) {
        this.logger.info('Circuit breaker closing after successful recovery', {
          operation: this.config.operationName,
        });
        this.reset();
      }
    } else {
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN' || this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.config.resetTimeout;
      this.logger.error('Circuit breaker opened', {
        operation: this.config.operationName,
        failureCount: this.failureCount,
        threshold: this.config.failureThreshold,
      });
    }
  }

  /**
   * Check if should attempt reset
   */
  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime !== undefined && Date.now() >= this.nextAttemptTime;
  }
}

/**
 * Global retry handler instance
 */
export const retryHandler = new RetryHandler();

/**
 * Convenience function for retrying operations
 */
export async function retry<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>,
  operationName?: string
): Promise<T> {
  const result = await retryHandler.execute(operation, config, operationName);

  if (!result.success) {
    throw result.error || new Error('Operation failed after retries');
  }

  return result.data!;
}

/**
 * Decorator for automatic retry
 */
export function Retry(config?: Partial<RetryConfig>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const operationName = `${target.constructor.name}.${propertyKey}`;
      return retry(
        () => originalMethod.apply(this, args),
        config,
        operationName
      );
    };

    return descriptor;
  };
}

/**
 * Circuit breaker decorator
 */
export function WithCircuitBreaker(config: {
  failureThreshold: number;
  resetTimeout: number;
}) {
  const breakers = new Map<string, CircuitBreaker<any>>();

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const breakerKey = `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      if (!breakers.has(breakerKey)) {
        breakers.set(
          breakerKey,
          new CircuitBreaker(
            () => originalMethod.apply(this, args),
            {
              ...config,
              operationName: breakerKey,
            }
          )
        );
      }

      const breaker = breakers.get(breakerKey)!;
      return breaker.execute();
    };

    return descriptor;
  };
}
