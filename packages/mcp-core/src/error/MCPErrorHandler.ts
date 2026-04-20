/**
 * Comprehensive MCP Error Handling System
 * Implements error classification, recovery strategies, and monitoring
 */

import { EventEmitter } from 'events';
import { MCPErrorClass, ErrorCategory, ErrorSeverity, ErrorRecoveryStrategy, ErrorStatistics } from '../types/error.js';
import { Logger } from '../utils/Logger.js';

export interface ErrorHandlerConfig {
  /** Enable automatic error recovery */
  enableAutoRecovery: boolean;
  /** Maximum recovery attempts per error */
  maxRecoveryAttempts: number;
  /** Error statistics collection interval (ms) */
  statisticsInterval: number;
  /** Enable error logging */
  enableLogging: boolean;
  /** Log level for errors */
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  /** Custom error handlers */
  customHandlers?: Map<number, ErrorHandler>;
}

export interface ErrorContext {
  /** Correlation ID for tracking */
  correlationId?: string;
  /** Component where error occurred */
  component: string;
  /** Operation being performed */
  operation: string;
  /** Additional context data */
  metadata?: Record<string, any>;
  /** Request ID if applicable */
  requestId?: string;
  /** User ID if applicable */
  userId?: string;
  /** Service ID if applicable */
  serviceId?: string;
}

export interface ErrorHandler {
  /** Handler name */
  name: string;
  /** Handle the error */
  handle: (error: MCPErrorClass, context: ErrorContext) => Promise<void>;
  /** Check if handler can handle this error */
  canHandle: (error: MCPErrorClass) => boolean;
}

export interface RecoveryResult {
  /** Whether recovery was successful */
  success: boolean;
  /** Recovery strategy used */
  strategy: string;
  /** Number of attempts made */
  attempts: number;
  /** Time taken for recovery (ms) */
  duration: number;
  /** Additional result data */
  data?: any;
  /** Error if recovery failed */
  error?: Error;
}

/**
 * Main MCP Error Handler class
 */
export class MCPErrorHandler extends EventEmitter {
  private readonly config: ErrorHandlerConfig;
  private readonly logger: Logger;
  private readonly recoveryStrategies: Map<string, ErrorRecoveryStrategy> = new Map();
  private readonly errorHandlers: Map<number, ErrorHandler> = new Map();
  private readonly statistics: ErrorStatistics;
  private readonly errorHistory: MCPErrorClass[] = [];
  private statisticsTimer?: NodeJS.Timeout;

  constructor(config: Partial<ErrorHandlerConfig> = {}, logger?: Logger) {
    super();
    
    this.config = {
      enableAutoRecovery: true,
      maxRecoveryAttempts: 3,
      statisticsInterval: 60000, // 1 minute
      enableLogging: true,
      logLevel: 'error',
      ...config
    };

    this.logger = logger || new Logger('MCPErrorHandler');
    
    this.statistics = {
      totalErrors: 0,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      errorsByCode: {},
      errorRate: 0,
      lastError: undefined,
      mostCommonError: undefined
    };

    this.initializeDefaultRecoveryStrategies();
    this.initializeDefaultErrorHandlers();
    
    if (this.config.statisticsInterval > 0) {
      this.startStatisticsCollection();
    }
  }

  /**
   * Handle an MCP error
   */
  async handleError(error: MCPErrorClass, context: ErrorContext): Promise<RecoveryResult | null> {
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
  registerRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.set(strategy.name, strategy);
    this.logger.debug(`Registered recovery strategy: ${strategy.name}`);
  }

  /**
   * Register a custom error handler
   */
  registerErrorHandler(errorCode: number, handler: ErrorHandler): void {
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
  getErrorHistory(limit?: number): MCPErrorClass[] {
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
    this.logger.debug('MCPErrorHandler shutdown complete');
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery(error: MCPErrorClass, context: ErrorContext): Promise<RecoveryResult> {
    const startTime = Date.now();
    let attempts = 0;
    let lastError: Error | undefined;

    // Find applicable recovery strategies
    const strategies = Array.from(this.recoveryStrategies.values())
      .filter(strategy => strategy.applicableErrorCodes.includes(error.code))
      .sort((a, b) => a.delay - b.delay); // Try faster strategies first

    for (const strategy of strategies) {
      if (attempts >= this.config.maxRecoveryAttempts) {
        break;
      }

      try {
        attempts++;
        this.logger.debug(`Attempting recovery with strategy: ${strategy.name} (attempt ${attempts})`);
        
        const success = await strategy.recover(error, context);
        
        if (success) {
          const duration = Date.now() - startTime;
          this.logger.info(`Recovery successful with strategy: ${strategy.name}`, {
            attempts,
            duration,
            errorCode: error.code
          });
          
          this.emit('recoverySuccess', {
            error,
            context,
            strategy: strategy.name,
            attempts,
            duration
          });

          return {
            success: true,
            strategy: strategy.name,
            attempts,
            duration,
            data: { strategyUsed: strategy.name }
          };
        }

        // Wait before next attempt if strategy has delay
        if (strategy.delay > 0 && attempts < this.config.maxRecoveryAttempts) {
          await this.delay(strategy.delay);
        }

      } catch (recoveryError) {
        lastError = recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError));
        this.logger.warn(`Recovery strategy ${strategy.name} failed:`, lastError);
      }
    }

    const duration = Date.now() - startTime;
    this.logger.error(`All recovery attempts failed for error code: ${error.code}`, {
      attempts,
      duration,
      lastError: lastError?.message
    });

    this.emit('recoveryFailure', {
      error,
      context,
      attempts,
      duration,
      lastError
    });

    return {
      success: false,
      strategy: 'none',
      attempts,
      duration,
      error: lastError
    };
  }

  /**
   * Find appropriate error handler
   */
  private findErrorHandler(error: MCPErrorClass): ErrorHandler | null {
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
  private updateStatistics(error: MCPErrorClass): void {
    this.statistics.totalErrors++;
    this.statistics.lastError = error.timestamp;

    // Update category statistics
    this.statistics.errorsByCategory[error.category] = 
      (this.statistics.errorsByCategory[error.category] || 0) + 1;

    // Update severity statistics
    this.statistics.errorsBySeverity[error.severity] = 
      (this.statistics.errorsBySeverity[error.severity] || 0) + 1;

    // Update code statistics
    this.statistics.errorsByCode[error.code] = 
      (this.statistics.errorsByCode[error.code] || 0) + 1;

    // Update most common error
    const currentCount = this.statistics.errorsByCode[error.code];
    if (!this.statistics.mostCommonError || currentCount > this.statistics.mostCommonError.count) {
      this.statistics.mostCommonError = {
        code: error.code,
        message: error.message,
        count: currentCount
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
  private logError(error: MCPErrorClass, context: ErrorContext): void {
    const logData = {
      code: error.code,
      category: error.category,
      severity: error.severity,
      retryable: error.retryable,
      correlationId: error.correlationId || context.correlationId,
      component: context.component,
      operation: context.operation,
      metadata: context.metadata
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
   * Initialize default recovery strategies
   */
  private initializeDefaultRecoveryStrategies(): void {
    // Connection retry strategy
    this.registerRecoveryStrategy({
      name: 'connection-retry',
      applicableErrorCodes: [-32401, -32402, -32403], // Connection errors
      maxAttempts: 3,
      delay: 1000,
      recover: async (error, context) => {
        // Implement connection retry logic
        this.logger.debug('Attempting connection recovery');
        // This would be implemented by the specific component
        return false; // Placeholder
      }
    });

    // Service retry strategy
    this.registerRecoveryStrategy({
      name: 'service-retry',
      applicableErrorCodes: [-32201, -32202], // Service unavailable/overloaded
      maxAttempts: 2,
      delay: 2000,
      recover: async (error, context) => {
        this.logger.debug('Attempting service recovery');
        // This would be implemented by the specific component
        return false; // Placeholder
      }
    });

    // Authentication refresh strategy
    this.registerRecoveryStrategy({
      name: 'auth-refresh',
      applicableErrorCodes: [-32303], // Token expired
      maxAttempts: 1,
      delay: 0,
      recover: async (error, context) => {
        this.logger.debug('Attempting authentication refresh');
        // This would be implemented by the auth component
        return false; // Placeholder
      }
    });
  }

  /**
   * Initialize default error handlers
   */
  private initializeDefaultErrorHandlers(): void {
    // Generic error handler
    this.registerErrorHandler(-1, {
      name: 'generic-handler',
      canHandle: () => true,
      handle: async (error, context) => {
        this.logger.debug(`Generic handler processing error: ${error.code}`);
        // Default handling logic
      }
    });
  }

  /**
   * Start statistics collection
   */
  private startStatisticsCollection(): void {
    this.statisticsTimer = setInterval(() => {
      this.calculateErrorRate();
      this.emit('statisticsUpdate', this.statistics);
    }, this.config.statisticsInterval);
  }

  /**
   * Calculate error rate (errors per minute)
   */
  private calculateErrorRate(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    const recentErrors = this.errorHistory.filter(
      error => error.timestamp.getTime() > oneMinuteAgo
    );
    
    this.statistics.errorRate = recentErrors.length;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Error handler factory for creating configured instances
 */
export class ErrorHandlerFactory {
  static create(config?: Partial<ErrorHandlerConfig>, logger?: Logger): MCPErrorHandler {
    return new MCPErrorHandler(config, logger);
  }

  static createWithDefaults(): MCPErrorHandler {
    return new MCPErrorHandler({
      enableAutoRecovery: true,
      maxRecoveryAttempts: 3,
      statisticsInterval: 60000,
      enableLogging: true,
      logLevel: 'error'
    });
  }
}