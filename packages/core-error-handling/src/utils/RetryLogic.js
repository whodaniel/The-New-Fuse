'use strict';
/**
 * Retry Logic for Critical Operations
 *
 * @description
 * Provides utilities for implementing retry logic with various strategies
 * including exponential backoff, jitter, and circuit breaker patterns.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.retryHandler = exports.CircuitBreaker = exports.RetryHandler = void 0;
exports.retry = retry;
exports.Retry = Retry;
exports.WithCircuitBreaker = WithCircuitBreaker;
const Logger_js_1 = require('./Logger.js');
const CustomErrors_js_1 = require('../errors/CustomErrors.js');
/**
 * Retry handler with various strategies
 */
class RetryHandler {
  logger;
  statistics = new Map();
  constructor(logger) {
    this.logger = logger || new Logger_js_1.Logger('RetryHandler');
  }
  /**
   * Execute operation with retry logic
   */
  async execute(operation, config = {}, operationName) {
    const finalConfig = this.mergeConfig(config);
    const startTime = Date.now();
    let lastError;
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
  async withExponentialBackoff(operation, maxAttempts = 3, initialDelay = 1000, operationName) {
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
    return result.data;
  }
  /**
   * Execute with linear backoff
   */
  async withLinearBackoff(operation, maxAttempts = 3, delay = 1000, operationName) {
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
    return result.data;
  }
  /**
   * Execute with custom retry predicate
   */
  async withCustomRetry(operation, shouldRetry, maxAttempts = 3, operationName) {
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
    return result.data;
  }
  /**
   * Get retry statistics for an operation
   */
  getStatistics(operationName) {
    return this.statistics.get(operationName);
  }
  /**
   * Get all retry statistics
   */
  getAllStatistics() {
    return new Map(this.statistics);
  }
  /**
   * Clear statistics
   */
  clearStatistics(operationName) {
    if (operationName) {
      this.statistics.delete(operationName);
    } else {
      this.statistics.clear();
    }
  }
  /**
   * Merge user config with defaults
   */
  mergeConfig(config) {
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
  calculateDelay(attempt, config) {
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
  shouldRetry(error, attempt, config) {
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
    if (error instanceof CustomErrors_js_1.ApplicationError) {
      return error.retryable;
    }
    // Default: retry on all errors
    return true;
  }
  /**
   * Execute operation with timeout
   */
  async executeWithTimeout(operation, timeout) {
    return Promise.race([
      operation(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timeout after ${timeout}ms`)), timeout)
      ),
    ]);
  }
  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Update retry statistics
   */
  updateStatistics(operationName, success, attempts, duration) {
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
exports.RetryHandler = RetryHandler;
/**
 * Circuit Breaker for preventing cascading failures
 */
class CircuitBreaker {
  operation;
  config;
  logger;
  state = 'CLOSED';
  failureCount = 0;
  successCount = 0;
  lastFailureTime;
  nextAttemptTime;
  constructor(operation, config) {
    this.operation = operation;
    this.config = config;
    this.logger = new Logger_js_1.Logger('CircuitBreaker');
  }
  /**
   * Execute operation with circuit breaker
   */
  async execute() {
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
  getState() {
    return this.state;
  }
  /**
   * Reset circuit breaker
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
  }
  /**
   * Handle successful execution
   */
  onSuccess() {
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
  onFailure() {
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
  shouldAttemptReset() {
    return this.nextAttemptTime !== undefined && Date.now() >= this.nextAttemptTime;
  }
}
exports.CircuitBreaker = CircuitBreaker;
/**
 * Global retry handler instance
 */
exports.retryHandler = new RetryHandler();
/**
 * Convenience function for retrying operations
 */
async function retry(operation, config, operationName) {
  const result = await exports.retryHandler.execute(operation, config, operationName);
  if (!result.success) {
    throw result.error || new Error('Operation failed after retries');
  }
  return result.data;
}
/**
 * Decorator for automatic retry
 */
function Retry(config) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args) {
      const operationName = `${target.constructor.name}.${propertyKey}`;
      return retry(() => originalMethod.apply(this, args), config, operationName);
    };
    return descriptor;
  };
}
/**
 * Circuit breaker decorator
 */
function WithCircuitBreaker(config) {
  const breakers = new Map();
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const breakerKey = `${target.constructor.name}.${propertyKey}`;
    descriptor.value = async function (...args) {
      if (!breakers.has(breakerKey)) {
        breakers.set(
          breakerKey,
          new CircuitBreaker(() => originalMethod.apply(this, args), {
            ...config,
            operationName: breakerKey,
          })
        );
      }
      const breaker = breakers.get(breakerKey);
      return breaker.execute();
    };
    return descriptor;
  };
}
//# sourceMappingURL=RetryLogic.js.map
