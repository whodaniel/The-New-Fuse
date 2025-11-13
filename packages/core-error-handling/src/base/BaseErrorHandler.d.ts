/**
 * Base error handler implementation
 * Provides common functionality that can be extended by specific error handlers
 */
import { EventEmitter } from 'events';
import { IErrorHandlerSystem, BaseError, ErrorContext, ErrorHandler, RecoveryStrategy, RecoveryResult, ErrorStatistics } from '../interfaces/IErrorHandling.js';
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
export declare abstract class BaseErrorHandler<TError extends BaseError = BaseError, TContext extends ErrorContext = ErrorContext> extends EventEmitter implements IErrorHandlerSystem<TError, TContext> {
    protected readonly config: BaseErrorHandlerConfig;
    protected readonly logger: Logger;
    protected readonly recoveryStrategies: Map<string, RecoveryStrategy<TError, TContext>>;
    protected readonly errorHandlers: Map<number, ErrorHandler<TError, TContext>>;
    protected readonly statistics: ErrorStatistics;
    protected readonly errorHistory: TError[];
    protected statisticsTimer?: NodeJS.Timeout;
    constructor(config?: Partial<BaseErrorHandlerConfig>, logger?: Logger);
    /**
     * Handle an error
     */
    handleError(error: TError, context: TContext): Promise<RecoveryResult | null>;
    /**
     * Register a custom error recovery strategy
     */
    registerRecoveryStrategy(strategy: RecoveryStrategy<TError, TContext>): void;
    /**
     * Register a custom error handler
     */
    registerErrorHandler(errorCode: number, handler: ErrorHandler<TError, TContext>): void;
    /**
     * Get error statistics
     */
    getStatistics(): ErrorStatistics;
    /**
     * Get error history
     */
    getErrorHistory(limit?: number): TError[];
    /**
     * Clear error history
     */
    clearErrorHistory(): void;
    /**
     * Shutdown the error handler
     */
    shutdown(): void;
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
    protected attemptRecovery(error: TError, context: TContext): Promise<RecoveryResult>;
    /**
     * Find appropriate error handler
     */
    protected findErrorHandler(error: TError): ErrorHandler<TError, TContext> | null;
    /**
     * Update error statistics
     */
    protected updateStatistics(error: TError): void;
    /**
     * Log error with appropriate level
     */
    protected logError(error: TError, context: TContext): void;
    /**
     * Start statistics collection
     */
    protected startStatisticsCollection(): void;
    /**
     * Calculate error rate (errors per minute)
     */
    protected calculateErrorRate(): void;
    /**
     * Utility delay function
     */
    protected delay(ms: number): Promise<void>;
}
//# sourceMappingURL=BaseErrorHandler.d.ts.map