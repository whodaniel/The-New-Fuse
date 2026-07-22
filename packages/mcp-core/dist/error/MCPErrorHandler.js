/**
 * Comprehensive MCP Error Handling System
 * Implements error classification, recovery strategies, and monitoring
 */
import { EventEmitter } from 'events';
import { ErrorSeverity, } from '../types/error.js';
import { Logger } from '../utils/Logger.js';
/**
 * Main MCP Error Handler class
 */
export class MCPErrorHandler extends EventEmitter {
    constructor(config = {}, logger) {
        super();
        this.recoveryStrategies = new Map();
        this.errorHandlers = new Map();
        this.errorHistory = [];
        this.config = {
            enableAutoRecovery: true,
            maxRecoveryAttempts: 3,
            statisticsInterval: 60000, // 1 minute
            enableLogging: true,
            logLevel: 'error',
            ...config,
        };
        this.logger = logger || new Logger('MCPErrorHandler');
        this.statistics = {
            totalErrors: 0,
            errorsByCategory: {},
            errorsBySeverity: {},
            errorsByCode: {},
            errorRate: 0,
            lastError: undefined,
            mostCommonError: undefined,
        };
        // Note: initializeDefaultRecoveryStrategies() is intentionally not
        // called here. Its strategies are non-functional placeholders (each
        // recover() always returns false), so registering them by default only
        // wastes a recovery attempt and adds delay before any real, working
        // strategy a caller registers for the same error codes -- callers who
        // want it can opt in explicitly.
        this.initializeDefaultErrorHandlers();
        if (this.config.statisticsInterval > 0) {
            this.startStatisticsCollection();
        }
    }
    /**
     * Handle an MCP error
     */
    async handleError(error, context) {
        try {
            // Update statistics
            this.updateStatistics(error);
            // Log the error
            if (this.config.enableLogging) {
                this.logError(error, context);
            }
            // Emit error notification. Deliberately not named 'error': EventEmitter
            // treats an unlistened 'error' emit as a fatal, thrown exception, which
            // silently broke every handleError() call for any caller that hadn't
            // registered a listener (the exception was swallowed by the catch
            // block below, always returning null).
            this.emit('errorHandled', error, context);
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
        }
        catch (handlingError) {
            this.logger.error('Error in error handler:', handlingError);
            this.emit('handlerError', handlingError, error, context);
            return null;
        }
    }
    /**
     * Register a custom error recovery strategy
     */
    registerRecoveryStrategy(strategy) {
        this.recoveryStrategies.set(strategy.name, strategy);
        this.logger.debug(`Registered recovery strategy: ${strategy.name}`);
    }
    /**
     * Register a custom error handler
     */
    registerErrorHandler(errorCode, handler) {
        this.errorHandlers.set(errorCode, handler);
        this.logger.debug(`Registered error handler for code: ${errorCode}`);
    }
    /**
     * Get error statistics
     */
    getStatistics() {
        return { ...this.statistics };
    }
    /**
     * Get error history
     */
    getErrorHistory(limit) {
        return limit ? this.errorHistory.slice(-limit) : [...this.errorHistory];
    }
    /**
     * Clear error history
     */
    clearErrorHistory() {
        this.errorHistory.length = 0;
        this.logger.debug('Error history cleared');
    }
    /**
     * Shutdown the error handler
     */
    shutdown() {
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
    async attemptRecovery(error, context) {
        const startTime = Date.now();
        let attempts = 0;
        let lastError;
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
                this.logger.debug(`Attempting recovery with strategy: ${strategy.name} (attempt ${attempts})`);
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
            }
            catch (recoveryError) {
                lastError =
                    recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError));
                this.logger.warn(`Recovery strategy ${strategy.name} failed:`, lastError);
            }
        }
        const duration = Date.now() - startTime;
        if (this.config.enableLogging) {
            this.logger.error(`All recovery attempts failed for error code: ${error.code}`, {
                attempts,
                duration,
                lastError: lastError?.message,
            });
        }
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
    findErrorHandler(error) {
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
    updateStatistics(error) {
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
    logError(error, context) {
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
     * Initialize default recovery strategies
     */
    initializeDefaultRecoveryStrategies() {
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
            },
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
            },
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
            },
        });
    }
    /**
     * Initialize default error handlers
     */
    initializeDefaultErrorHandlers() {
        // Generic error handler
        this.registerErrorHandler(-1, {
            name: 'generic-handler',
            canHandle: () => true,
            handle: async (error, context) => {
                this.logger.debug(`Generic handler processing error: ${error.code}`);
                // Default handling logic
            },
        });
    }
    /**
     * Start statistics collection
     */
    startStatisticsCollection() {
        this.statisticsTimer = setInterval(() => {
            this.calculateErrorRate();
            this.emit('statisticsUpdate', this.statistics);
        }, this.config.statisticsInterval);
    }
    /**
     * Calculate error rate (errors per minute)
     */
    calculateErrorRate() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const recentErrors = this.errorHistory.filter((error) => error.timestamp.getTime() > oneMinuteAgo);
        this.statistics.errorRate = recentErrors.length;
    }
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
/**
 * Error handler factory for creating configured instances
 */
export class ErrorHandlerFactory {
    static create(config, logger) {
        return new MCPErrorHandler(config, logger);
    }
    static createWithDefaults() {
        return new MCPErrorHandler({
            enableAutoRecovery: true,
            maxRecoveryAttempts: 3,
            statisticsInterval: 60000,
            enableLogging: true,
            logLevel: 'error',
        });
    }
}
//# sourceMappingURL=MCPErrorHandler.js.map