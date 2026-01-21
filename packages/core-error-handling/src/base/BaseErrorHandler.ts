/**
 * Base error handler implementation
 * Provides common functionality that can be extended by specific error handlers
 */

import { EventEmitter } from 'events';
import {
  BaseError,
  ErrorCategory,
  ErrorContext,
  ErrorHandler,
  ErrorSeverity,
  ErrorStatistics,
  IErrorHandlerSystem,
  RecoveryResult,
  RecoveryStrategy,
} from '../interfaces/IErrorHandling.js';
import { Logger } from '../utils/Logger.js';

/**
 * Base error handler configuration
 */
export interface BaseErrorHandlerConfig {
  enableAutoRecovery: boolean;
  maxRecoveryAttempts: number;
  statisticsInterval: number;
  enableLogging: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Base error handler that can be extended
 */
export abstract class BaseErrorHandler<
  TError extends BaseError = BaseError,
  TContext extends ErrorContext = ErrorContext,
>
  extends EventEmitter
  implements IErrorHandlerSystem<TError, TContext>
{
  protected readonly config: BaseErrorHandlerConfig;
  public readonly logger: Logger;
  protected readonly recoveryStrategies: Map<string, RecoveryStrategy<TError, TContext>> =
    new Map();
  protected readonly errorHandlers: Map<number, ErrorHandler<TError, TContext>> = new Map();
  protected readonly statistics: ErrorStatistics;
  protected readonly errorHistory: TError[] = [];
  protected statisticsTimer?: NodeJS.Timeout;

  constructor(config: Partial<BaseErrorHandlerConfig> = {}, logger?: Logger) {
    super();

    this.config = {
      enableAutoRecovery: true,
      maxRecoveryAttempts: 3,
      statisticsInterval: 60000, // 1 minute
      enableLogging: true,
      logLevel: 'error',
      ...config,
    };

    this.logger = logger || new Logger('BaseErrorHandler');

    this.statistics = {
      totalErrors: 0,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      errorsByCode: {},
      errorRate: 0,
      lastError: undefined,
      mostCommonError: undefined,
    };

    this.initializeDefaultRecoveryStrategies();
    this.initializeDefaultErrorHandlers();

    if (this.config.statisticsInterval > 0) {
      this.startStatisticsCollection();
    }
  }

  /**
   * Handle an error
   */
  async handleError(error: TError, context: TContext): Promise<RecoveryResult | null> {
    try {
      // Update statistics
      this.updateStatistics(error);

      // Log the error
      if (this.config.enableLogging) {
        this.logError(error, context);
      }

      // Emit error event
      this.emit('error', error, context);

      // Find and execute error handler
      const handler = this.findErrorHandler(error);
      if (handler) {
        await handler.handle(error, context);
      }

      // Attempt recovery if enabled and error is retryable
      if (this.config.enableAutoRecovery && error.retryable) {
        return await this.attemptRecovery(error, context);
      }

      return null;
    } catch (handlingError) {
      this.logger.error('Error in error handler:', handlingError);
      this.emit('handlerError', handlingError, error, context);
      return null;
    }
  }

  /**
   * Register a custom error recovery strategy
   */
  registerRecoveryStrategy(strategy: RecoveryStrategy<TError, TContext>): void {
    this.recoveryStrategies.set(strategy.name, strategy);
    this.logger.debug(`Registered recovery strategy: ${strategy.name}`);
  }

  /**
   * Register a custom error handler
   */
  registerErrorHandler(errorCode: number, handler: ErrorHandler<TError, TContext>): void {
    this.errorHandlers.set(errorCode, handler);
    this.logger.debug(`Registered error handler for code: ${errorCode}`);
  }

  /**
   * Get error statistics
   */
  getStatistics(): ErrorStatistics {
    return { ...this.statistics };
  }

  /**
   * Get error history
   */
  getErrorHistory(limit?: number): TError[] {
    return limit ? this.errorHistory.slice(-limit) : [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory.length = 0;
    this.logger.debug('Error history cleared');
  }

  /**
   * Shutdown the error handler
   */
  shutdown(): void {
    if (this.statisticsTimer) {
      clearInterval(this.statisticsTimer);
      this.statisticsTimer = undefined;
    }
    this.removeAllListeners();
    this.logger.debug('BaseErrorHandler shutdown complete');
  }

  /**
   * Abstract method to initialize default recovery strategies
   * Must be implemented by subclasses
   */
  protected abstract initializeDefaultRecoveryStrategies(): void;

  /**
   * Abstract method to initialize default error handlers
   * Must be implemented by subclasses
   */
  protected abstract initializeDefaultErrorHandlers(): void;

  /**
   * Attempt error recovery
   */
  protected async attemptRecovery(error: TError, context: TContext): Promise<RecoveryResult> {
    const startTime = Date.now();
    let attempts = 0;
    let lastError: Error | undefined;

    // Find applicable recovery strategies
    const strategies = Array.from(this.recoveryStrategies.values())
      .filter((strategy) => strategy.applicableErrorCodes.includes(error.code))
      .sort((a, b) => a.delay - b.delay); // Try faster strategies first

    for (const strategy of strategies) {
      if (attempts >= this.config.maxRecoveryAttempts) {
        break;
      }

      try {
        attempts++;
        this.logger.debug(
          `Attempting recovery with strategy: ${strategy.name} (attempt ${attempts})`
        );

        const success = await strategy.recover(error, context);

        if (success) {
          const duration = Date.now() - startTime;
          this.logger.info(`Recovery successful with strategy: ${strategy.name}`, {
            attempts,
            duration,
            errorCode: error.code,
          });

          this.emit('recoverySuccess', {
            error,
            context,
            strategy: strategy.name,
            attempts,
            duration,
          });

          return {
            success: true,
            strategy: strategy.name,
            attempts,
            duration,
            data: { strategyUsed: strategy.name },
          };
        }

        // Wait before next attempt if strategy has delay
        if (strategy.delay > 0 && attempts < this.config.maxRecoveryAttempts) {
          await this.delay(strategy.delay);
        }
      } catch (recoveryError) {
        lastError =
          recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError));
        this.logger.warn(`Recovery strategy ${strategy.name} failed:`, lastError);
      }
    }

    const duration = Date.now() - startTime;
    this.logger.error(`All recovery attempts failed for error code: ${error.code}`, {
      attempts,
      duration,
      lastError: lastError?.message,
    });

    this.emit('recoveryFailure', {
      error,
      context,
      attempts,
      duration,
      lastError,
    });

    return {
      success: false,
      strategy: 'none',
      attempts,
      duration,
      error: lastError,
    };
  }

  /**
   * Find appropriate error handler
   */
  protected findErrorHandler(error: TError): ErrorHandler<TError, TContext> | null {
    // Check for specific error code handler
    const specificHandler = this.errorHandlers.get(error.code);
    if (specificHandler && specificHandler.canHandle(error)) {
      return specificHandler;
    }

    // Check for generic handlers
    for (const [, handler] of this.errorHandlers) {
      if (handler.canHandle(error)) {
        return handler;
      }
    }

    return null;
  }

  /**
   * Update error statistics
   */
  protected updateStatistics(error: TError): void {
    this.statistics.totalErrors++;
    this.statistics.lastError = error.timestamp;

    // Update category statistics
    this.statistics.errorsByCategory[error.category] =
      (this.statistics.errorsByCategory[error.category] || 0) + 1;

    // Update severity statistics
    this.statistics.errorsBySeverity[error.severity] =
      (this.statistics.errorsBySeverity[error.severity] || 0) + 1;

    // Update code statistics
    this.statistics.errorsByCode[error.code] = (this.statistics.errorsByCode[error.code] || 0) + 1;

    // Update most common error
    const currentCount = this.statistics.errorsByCode[error.code];
    if (!this.statistics.mostCommonError || currentCount > this.statistics.mostCommonError.count) {
      this.statistics.mostCommonError = {
        code: error.code,
        message: error.message,
        count: currentCount,
      };
    }

    // Add to history (keep last 1000 errors)
    this.errorHistory.push(error);
    if (this.errorHistory.length > 1000) {
      this.errorHistory.shift();
    }
  }

  /**
   * Log error with appropriate level
   */
  protected logError(error: TError, context: TContext): void {
    const logData = {
      code: error.code,
      category: error.category,
      severity: error.severity,
      retryable: error.retryable,
      correlationId: error.correlationId || context.correlationId,
      component: context.component,
      operation: context.operation,
      metadata: context.metadata,
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        this.logger.error(`CRITICAL ERROR: ${error.message}`, logData);
        break;
      case ErrorSeverity.HIGH:
        this.logger.error(`HIGH SEVERITY: ${error.message}`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn(`MEDIUM SEVERITY: ${error.message}`, logData);
        break;
      case ErrorSeverity.LOW:
        this.logger.info(`LOW SEVERITY: ${error.message}`, logData);
        break;
    }
  }

  /**
   * Start statistics collection
   */
  protected startStatisticsCollection(): void {
    this.statisticsTimer = setInterval(() => {
      this.calculateErrorRate();
      this.emit('statisticsUpdate', this.statistics);
    }, this.config.statisticsInterval);
  }

  /**
   * Calculate error rate (errors per minute)
   */
  protected calculateErrorRate(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentErrors = this.errorHistory.filter(
      (error) => error.timestamp.getTime() > oneMinuteAgo
    );

    this.statistics.errorRate = recentErrors.length;
  }

  /**
   * Utility delay function
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
