"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorReporter = exports.CommandErrorHandler = void 0;
const interfaces_1 = require("../interfaces");
const base_command_1 = require("../base/base-command");
/**
 * Error handler for command execution errors
 */
class CommandErrorHandler {
    errorHandlers = new Map();
    globalHandlers = [];
    constructor() {
        this.registerDefaultHandlers();
    }
    /**
     * Handle an error
     */
    async handleError(error, context) {
        const commandError = this.ensureCommandError(error);
        // Try type-specific handler first
        const typeHandler = this.errorHandlers.get(commandError.type);
        if (typeHandler) {
            try {
                return await typeHandler(commandError, context);
            }
            catch (handlerError) {
                console.error('Error handler failed:', handlerError);
                // Fall back to global handlers
            }
        }
        // Try global handlers
        for (const globalHandler of this.globalHandlers) {
            try {
                return await globalHandler(commandError, context);
            }
            catch (handlerError) {
                console.error('Global error handler failed:', handlerError);
                continue;
            }
        }
        // Return original error if no handler succeeds
        return commandError;
    }
    /**
     * Register an error handler for a specific error type
     */
    registerHandler(errorType, handler) {
        this.errorHandlers.set(errorType, handler);
    }
    /**
     * Register a global error handler
     */
    registerGlobalHandler(handler) {
        this.globalHandlers.push(handler);
    }
    /**
     * Remove an error handler
     */
    removeHandler(errorType) {
        return this.errorHandlers.delete(errorType);
    }
    /**
     * Remove a global error handler
     */
    removeGlobalHandler(handler) {
        const index = this.globalHandlers.indexOf(handler);
        if (index >= 0) {
            this.globalHandlers.splice(index, 1);
            return true;
        }
        return false;
    }
    /**
     * Clear all error handlers
     */
    clear() {
        this.errorHandlers.clear();
        this.globalHandlers = [];
    }
    /**
     * Get registered error types
     */
    getRegisteredErrorTypes() {
        return Array.from(this.errorHandlers.keys());
    }
    /**
     * Get global handler count
     */
    getGlobalHandlerCount() {
        return this.globalHandlers.length;
    }
    /**
     * Ensure error is a CommandError
     */
    ensureCommandError(error) {
        if (error instanceof base_command_1.CommandError) {
            return error;
        }
        return new base_command_1.CommandError({
            code: 'UNKNOWN_ERROR',
            message: error.message,
            type: interfaces_1.ErrorType.INTERNAL,
            stack: error.stack,
            details: { originalError: error.name }
        });
    }
    /**
     * Register default error handlers
     */
    registerDefaultHandlers() {
        // Validation error handler
        this.registerHandler(interfaces_1.ErrorType.VALIDATION, async (error, context) => {
            // Log validation errors with context
            console.warn('Validation error:', {
                code: error.code,
                message: error.message,
                details: error.details,
                context
            });
            // Return enhanced validation error
            return new base_command_1.CommandError({
                ...error,
                details: {
                    ...error.details,
                    timestamp: new Date().toISOString(),
                    context: context ? 'provided' : 'none'
                }
            });
        });
        // Authorization error handler
        this.registerHandler(interfaces_1.ErrorType.AUTHORIZATION, async (error, context) => {
            // Log authorization errors
            console.error('Authorization error:', {
                code: error.code,
                message: error.message,
                userId: context?.userId,
                roles: context?.auth?.roles
            });
            // Return enhanced authorization error
            return new base_command_1.CommandError({
                ...error,
                details: {
                    ...error.details,
                    timestamp: new Date().toISOString(),
                    userId: context?.userId,
                    requiredPermissions: error.details?.requiredPermissions || []
                }
            });
        });
        // Business rule error handler
        this.registerHandler(interfaces_1.ErrorType.BUSINESS_RULE, async (error, context) => {
            // Log business rule violations
            console.warn('Business rule violation:', {
                code: error.code,
                message: error.message,
                details: error.details
            });
            return error;
        });
        // Not found error handler
        this.registerHandler(interfaces_1.ErrorType.NOT_FOUND, async (error, context) => {
            // Log not found errors
            console.info('Resource not found:', {
                code: error.code,
                message: error.message,
                details: error.details
            });
            return error;
        });
        // Conflict error handler
        this.registerHandler(interfaces_1.ErrorType.CONFLICT, async (error, context) => {
            // Log conflict errors
            console.warn('Conflict error:', {
                code: error.code,
                message: error.message,
                details: error.details
            });
            return error;
        });
        // Internal error handler
        this.registerHandler(interfaces_1.ErrorType.INTERNAL, async (error, context) => {
            // Log internal errors with full details
            console.error('Internal error:', {
                code: error.code,
                message: error.message,
                stack: error.stack,
                details: error.details
            });
            // Sanitize internal errors for external consumption
            return new base_command_1.CommandError({
                code: 'INTERNAL_ERROR',
                message: 'An internal error occurred',
                type: interfaces_1.ErrorType.INTERNAL,
                details: {
                    originalCode: error.code,
                    timestamp: new Date().toISOString()
                    // Don't expose internal details
                }
            });
        });
        // External error handler
        this.registerHandler(interfaces_1.ErrorType.EXTERNAL, async (error, context) => {
            // Log external errors
            console.error('External service error:', {
                code: error.code,
                message: error.message,
                details: error.details
            });
            return new base_command_1.CommandError({
                code: 'EXTERNAL_SERVICE_ERROR',
                message: 'An external service error occurred',
                type: interfaces_1.ErrorType.EXTERNAL,
                details: {
                    originalCode: error.code,
                    timestamp: new Date().toISOString()
                }
            });
        });
    }
}
exports.CommandErrorHandler = CommandErrorHandler;
/**
 * Error reporter for collecting and reporting errors
 */
class ErrorReporter {
    errors = [];
    maxErrors;
    onErrorCallback;
    constructor(maxErrors = 1000) {
        this.maxErrors = maxErrors;
    }
    /**
     * Report an error
     */
    reportError(error, context) {
        const reportedError = {
            id: this.generateErrorId(),
            error,
            context,
            timestamp: new Date(),
            reported: false
        };
        // Add to errors list
        this.errors.push(reportedError);
        // Trim if exceeding max
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(-this.maxErrors);
        }
        // Call callback if provided
        if (this.onErrorCallback) {
            try {
                this.onErrorCallback(reportedError);
            }
            catch (callbackError) {
                console.error('Error in error callback:', callbackError);
            }
        }
    }
    /**
     * Get all reported errors
     */
    getErrors() {
        return [...this.errors];
    }
    /**
     * Get errors by type
     */
    getErrorsByType(errorType) {
        return this.errors.filter(reported => reported.error.type === errorType);
    }
    /**
     * Get errors by code
     */
    getErrorsByCode(errorCode) {
        return this.errors.filter(reported => reported.error.code === errorCode);
    }
    /**
     * Get errors in time range
     */
    getErrorsInTimeRange(start, end) {
        return this.errors.filter(reported => reported.timestamp >= start && reported.timestamp <= end);
    }
    /**
     * Clear all errors
     */
    clear() {
        this.errors = [];
    }
    /**
     * Get error statistics
     */
    getStats() {
        const typeCounts = new Map();
        const codeCounts = new Map();
        for (const reported of this.errors) {
            // Count by type
            const typeCount = typeCounts.get(reported.error.type) || 0;
            typeCounts.set(reported.error.type, typeCount + 1);
            // Count by code
            const codeCount = codeCounts.get(reported.error.code) || 0;
            codeCounts.set(reported.error.code, codeCount + 1);
        }
        return {
            totalErrors: this.errors.length,
            errorsByType: Object.fromEntries(typeCounts),
            errorsByCode: Object.fromEntries(codeCounts),
            oldestError: this.errors.length > 0 ? this.errors[0].timestamp : null,
            newestError: this.errors.length > 0 ? this.errors[this.errors.length - 1].timestamp : null
        };
    }
    /**
     * Set error callback
     */
    onError(callback) {
        this.onErrorCallback = callback;
    }
    /**
     * Generate unique error ID
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.ErrorReporter = ErrorReporter;
//# sourceMappingURL=error-handler.js.map