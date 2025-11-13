"use strict";
/**
 * Base error handler implementation
 * Provides common functionality that can be extended by specific error handlers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseErrorHandler = void 0;
const events_1 = require("events");
const IErrorHandling_js_1 = require("../interfaces/IErrorHandling.js");
const Logger_js_1 = require("../utils/Logger.js");
/**
 * Base error handler that can be extended
 */
class BaseErrorHandler extends events_1.EventEmitter {
    config;
    logger;
    recoveryStrategies = new Map();
    errorHandlers = new Map();
    statistics;
    errorHistory = [];
    statisticsTimer;
    constructor(config = {}, logger) {
        super();
        this.config = {
            enableAutoRecovery: true,
            maxRecoveryAttempts: 3,
            statisticsInterval: 60000, // 1 minute
            enableLogging: true,
            logLevel: 'error',
            ...config
        };
        this.logger = logger || new Logger_js_1.Logger('BaseErrorHandler');
        this.statistics = {
            totalErrors: 0,
            errorsByCategory: {},
            errorsBySeverity: {},
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
     * Handle an error
     */
    async handleError(error, context) {
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
        this.logger.debug('BaseErrorHandler shutdown complete');
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
            }
            catch (recoveryError) {
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
    logError(error, context) {
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
            case IErrorHandling_js_1.ErrorSeverity.CRITICAL:
                this.logger.error(`CRITICAL ERROR: ${error.message}`, logData);
                break;
            case IErrorHandling_js_1.ErrorSeverity.HIGH:
                this.logger.error(`HIGH SEVERITY: ${error.message}`, logData);
                break;
            case IErrorHandling_js_1.ErrorSeverity.MEDIUM:
                this.logger.warn(`MEDIUM SEVERITY: ${error.message}`, logData);
                break;
            case IErrorHandling_js_1.ErrorSeverity.LOW:
                this.logger.info(`LOW SEVERITY: ${error.message}`, logData);
                break;
        }
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
        const recentErrors = this.errorHistory.filter(error => error.timestamp.getTime() > oneMinuteAgo);
        this.statistics.errorRate = recentErrors.length;
    }
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.BaseErrorHandler = BaseErrorHandler;
//# sourceMappingURL=BaseErrorHandler.js.map