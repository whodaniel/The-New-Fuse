"use strict";
/**
 * Unit tests for MCPErrorHandler
 */
Object.defineProperty(exports, "__esModule", { value: true });
const MCPErrorHandler_1 = require("./MCPErrorHandler");
const error_1 = require("../types/error");
describe('MCPErrorHandler', () => {
    let errorHandler;
    let mockLogger;
    beforeEach(() => {
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            setLogLevel: jest.fn(),
            getLogLevel: jest.fn()
        };
        const config = {
            enableAutoRecovery: true,
            maxRecoveryAttempts: 2,
            statisticsInterval: 0, // Disable for tests
            enableLogging: true,
            logLevel: 'debug'
        };
        errorHandler = new MCPErrorHandler_1.MCPErrorHandler(config, mockLogger);
    });
    afterEach(() => {
        errorHandler.shutdown();
    });
    describe('Error Handling', () => {
        it('should handle errors and update statistics', async () => {
            const error = new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_NOT_FOUND, 'Resource not found');
            const context = {
                component: 'test',
                operation: 'read',
                correlationId: 'test-123'
            };
            await errorHandler.handleError(error, context);
            const stats = errorHandler.getStatistics();
            expect(stats.totalErrors).toBe(1);
            expect(stats.errorsByCategory[error_1.ErrorCategory.RESOURCE]).toBe(1);
            expect(stats.errorsBySeverity[error_1.ErrorSeverity.LOW]).toBe(1);
        });
        it('should emit error events', async () => {
            const error = new error_1.MCPErrorClass(error_1.MCPErrorCode.TOOL_EXECUTION_FAILED, 'Tool failed');
            const context = {
                component: 'test',
                operation: 'execute'
            };
            const errorEventPromise = new Promise((resolve) => {
                errorHandler.once('error', (emittedError, emittedContext) => {
                    resolve({ error: emittedError, context: emittedContext });
                });
            });
            await errorHandler.handleError(error, context);
            const result = await errorEventPromise;
            expect(result).toEqual({ error, context });
        });
        it('should log errors with appropriate severity', async () => {
            const criticalError = new error_1.MCPErrorClass(error_1.MCPErrorCode.SYSTEM_OVERLOADED, 'System overloaded', { severity: error_1.ErrorSeverity.CRITICAL });
            const context = {
                component: 'test',
                operation: 'process'
            };
            await errorHandler.handleError(criticalError, context);
            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('CRITICAL ERROR'), expect.any(Object));
        });
    });
    describe('Recovery Strategies', () => {
        it('should attempt recovery for retryable errors', async () => {
            const retryableError = new error_1.MCPErrorClass(error_1.MCPErrorCode.CONNECTION_TIMEOUT, 'Connection timeout', { retryable: true });
            const context = {
                component: 'test',
                operation: 'connect'
            };
            // Register a mock recovery strategy
            errorHandler.registerRecoveryStrategy({
                name: 'test-recovery',
                applicableErrorCodes: [error_1.MCPErrorCode.CONNECTION_TIMEOUT],
                maxAttempts: 1,
                delay: 0,
                recover: jest.fn().mockResolvedValue(true)
            });
            const result = await errorHandler.handleError(retryableError, context);
            expect(result).toBeTruthy();
            expect(result?.success).toBe(true);
            expect(result?.strategy).toBe('test-recovery');
        });
        it('should not attempt recovery for non-retryable errors', async () => {
            const nonRetryableError = new error_1.MCPErrorClass(error_1.MCPErrorCode.AUTHENTICATION_FAILED, 'Auth failed', { retryable: false });
            const context = {
                component: 'test',
                operation: 'authenticate'
            };
            const result = await errorHandler.handleError(nonRetryableError, context);
            expect(result).toBeNull();
        });
        it('should try multiple recovery strategies', async () => {
            const error = new error_1.MCPErrorClass(error_1.MCPErrorCode.SERVICE_UNAVAILABLE, 'Service down');
            const context = {
                component: 'test',
                operation: 'call'
            };
            const failingStrategy = jest.fn().mockResolvedValue(false);
            const successfulStrategy = jest.fn().mockResolvedValue(true);
            errorHandler.registerRecoveryStrategy({
                name: 'failing-strategy',
                applicableErrorCodes: [error_1.MCPErrorCode.SERVICE_UNAVAILABLE],
                maxAttempts: 1,
                delay: 0,
                recover: failingStrategy
            });
            errorHandler.registerRecoveryStrategy({
                name: 'successful-strategy',
                applicableErrorCodes: [error_1.MCPErrorCode.SERVICE_UNAVAILABLE],
                maxAttempts: 1,
                delay: 0,
                recover: successfulStrategy
            });
            const result = await errorHandler.handleError(error, context);
            expect(failingStrategy).toHaveBeenCalled();
            expect(successfulStrategy).toHaveBeenCalled();
            expect(result?.success).toBe(true);
            expect(result?.strategy).toBe('successful-strategy');
        });
        it('should respect max recovery attempts', async () => {
            const config = {
                maxRecoveryAttempts: 1
            };
            const limitedHandler = new MCPErrorHandler_1.MCPErrorHandler(config, mockLogger);
            const error = new error_1.MCPErrorClass(error_1.MCPErrorCode.CONNECTION_FAILED, 'Connection failed');
            const context = {
                component: 'test',
                operation: 'connect'
            };
            const recoveryFn = jest.fn().mockResolvedValue(false);
            limitedHandler.registerRecoveryStrategy({
                name: 'test-strategy-1',
                applicableErrorCodes: [error_1.MCPErrorCode.CONNECTION_FAILED],
                maxAttempts: 1,
                delay: 0,
                recover: recoveryFn
            });
            limitedHandler.registerRecoveryStrategy({
                name: 'test-strategy-2',
                applicableErrorCodes: [error_1.MCPErrorCode.CONNECTION_FAILED],
                maxAttempts: 1,
                delay: 0,
                recover: recoveryFn
            });
            const result = await limitedHandler.handleError(error, context);
            expect(recoveryFn).toHaveBeenCalledTimes(1); // Should only try first strategy
            expect(result?.success).toBe(false);
            expect(result?.attempts).toBe(1);
            limitedHandler.shutdown();
        });
    });
    describe('Custom Error Handlers', () => {
        it('should use custom error handlers', async () => {
            const customHandler = {
                name: 'custom-handler',
                canHandle: (error) => error.code === error_1.MCPErrorCode.TOOL_NOT_FOUND,
                handle: jest.fn()
            };
            errorHandler.registerErrorHandler(error_1.MCPErrorCode.TOOL_NOT_FOUND, customHandler);
            const error = new error_1.MCPErrorClass(error_1.MCPErrorCode.TOOL_NOT_FOUND, 'Tool not found');
            const context = {
                component: 'test',
                operation: 'execute'
            };
            await errorHandler.handleError(error, context);
            expect(customHandler.handle).toHaveBeenCalledWith(error, context);
        });
        it('should fall back to generic handler if no specific handler found', async () => {
            const error = new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_CORRUPTED, 'Resource corrupted');
            const context = {
                component: 'test',
                operation: 'read'
            };
            // Should not throw and should handle with generic handler
            await expect(errorHandler.handleError(error, context)).resolves.not.toThrow();
        });
    });
    describe('Statistics', () => {
        it('should track error statistics correctly', async () => {
            const errors = [
                new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_NOT_FOUND, 'Not found'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_NOT_FOUND, 'Not found again'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.TOOL_EXECUTION_FAILED, 'Tool failed'),
                new error_1.MCPErrorClass(error_1.MCPErrorCode.SYSTEM_OVERLOADED, 'Overloaded', { severity: error_1.ErrorSeverity.CRITICAL })
            ];
            const context = {
                component: 'test',
                operation: 'various'
            };
            for (const error of errors) {
                await errorHandler.handleError(error, context);
            }
            const stats = errorHandler.getStatistics();
            expect(stats.totalErrors).toBe(4);
            expect(stats.errorsByCategory[error_1.ErrorCategory.RESOURCE]).toBe(2);
            expect(stats.errorsByCategory[error_1.ErrorCategory.TOOL]).toBe(1);
            expect(stats.errorsByCategory[error_1.ErrorCategory.SYSTEM]).toBe(1);
            expect(stats.errorsBySeverity[error_1.ErrorSeverity.LOW]).toBe(3);
            expect(stats.errorsBySeverity[error_1.ErrorSeverity.CRITICAL]).toBe(1);
            expect(stats.mostCommonError?.code).toBe(error_1.MCPErrorCode.RESOURCE_NOT_FOUND);
            expect(stats.mostCommonError?.count).toBe(2);
        });
        it('should maintain error history with limit', async () => {
            // Create many errors to test history limit
            const context = {
                component: 'test',
                operation: 'bulk'
            };
            // Add more than 1000 errors to test limit
            for (let i = 0; i < 1005; i++) {
                const error = new error_1.MCPErrorClass(error_1.MCPErrorCode.RATE_LIMIT_EXCEEDED, `Error ${i}`);
                await errorHandler.handleError(error, context);
            }
            const history = errorHandler.getErrorHistory();
            expect(history.length).toBe(1000); // Should be limited to 1000
            // Should keep the most recent errors
            expect(history[history.length - 1].message).toBe('Error 1004');
        });
        it('should clear error history', async () => {
            const error = new error_1.MCPErrorClass(error_1.MCPErrorCode.TIMEOUT, 'Timeout');
            const context = {
                component: 'test',
                operation: 'clear'
            };
            await errorHandler.handleError(error, context);
            expect(errorHandler.getErrorHistory().length).toBe(1);
            errorHandler.clearErrorHistory();
            expect(errorHandler.getErrorHistory().length).toBe(0);
        });
    });
    describe('Configuration', () => {
        it('should respect logging configuration', async () => {
            const noLogConfig = {
                enableLogging: false
            };
            const noLogHandler = new MCPErrorHandler_1.MCPErrorHandler(noLogConfig, mockLogger);
            const error = new error_1.MCPErrorClass(error_1.MCPErrorCode.INTERNAL_ERROR, 'Internal error');
            const context = {
                component: 'test',
                operation: 'log-test'
            };
            await noLogHandler.handleError(error, context);
            expect(mockLogger.error).not.toHaveBeenCalled();
            noLogHandler.shutdown();
        });
        it('should respect auto-recovery configuration', async () => {
            const noRecoveryConfig = {
                enableAutoRecovery: false
            };
            const noRecoveryHandler = new MCPErrorHandler_1.MCPErrorHandler(noRecoveryConfig, mockLogger);
            const error = new error_1.MCPErrorClass(error_1.MCPErrorCode.CONNECTION_TIMEOUT, 'Timeout');
            const context = {
                component: 'test',
                operation: 'recovery-test'
            };
            const result = await noRecoveryHandler.handleError(error, context);
            expect(result).toBeNull(); // No recovery attempted
            noRecoveryHandler.shutdown();
        });
    });
    describe('Event Handling', () => {
        it('should emit recovery success events', async () => {
            const error = new error_1.MCPErrorClass(error_1.MCPErrorCode.SERVICE_UNAVAILABLE, 'Service down');
            const context = {
                component: 'test',
                operation: 'event-test'
            };
            errorHandler.registerRecoveryStrategy({
                name: 'success-strategy',
                applicableErrorCodes: [error_1.MCPErrorCode.SERVICE_UNAVAILABLE],
                maxAttempts: 1,
                delay: 0,
                recover: jest.fn().mockResolvedValue(true)
            });
            const recoverySuccessPromise = new Promise((resolve) => {
                errorHandler.once('recoverySuccess', resolve);
            });
            await errorHandler.handleError(error, context);
            const result = await recoverySuccessPromise;
            expect(result).toMatchObject({
                error,
                context,
                strategy: 'success-strategy'
            });
        });
        it('should emit recovery failure events', async () => {
            const error = new error_1.MCPErrorClass(error_1.MCPErrorCode.CONNECTION_FAILED, 'Connection failed');
            const context = {
                component: 'test',
                operation: 'failure-test'
            };
            errorHandler.registerRecoveryStrategy({
                name: 'failing-strategy',
                applicableErrorCodes: [error_1.MCPErrorCode.CONNECTION_FAILED],
                maxAttempts: 1,
                delay: 0,
                recover: jest.fn().mockResolvedValue(false)
            });
            const recoveryFailurePromise = new Promise((resolve) => {
                errorHandler.once('recoveryFailure', resolve);
            });
            await errorHandler.handleError(error, context);
            const result = await recoveryFailurePromise;
            expect(result).toMatchObject({
                error,
                context,
                attempts: 1
            });
        });
    });
    describe('Error Classification', () => {
        it('should correctly classify errors by category', () => {
            const resourceError = new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_NOT_FOUND, 'Not found');
            const toolError = new error_1.MCPErrorClass(error_1.MCPErrorCode.TOOL_EXECUTION_FAILED, 'Tool failed');
            const authError = new error_1.MCPErrorClass(error_1.MCPErrorCode.AUTHENTICATION_FAILED, 'Auth failed');
            const connectionError = new error_1.MCPErrorClass(error_1.MCPErrorCode.CONNECTION_TIMEOUT, 'Timeout');
            expect(resourceError.category).toBe(error_1.ErrorCategory.RESOURCE);
            expect(toolError.category).toBe(error_1.ErrorCategory.TOOL);
            expect(authError.category).toBe(error_1.ErrorCategory.AUTH);
            expect(connectionError.category).toBe(error_1.ErrorCategory.CONNECTION);
        });
        it('should correctly classify errors by severity', () => {
            const criticalError = new error_1.MCPErrorClass(error_1.MCPErrorCode.SYSTEM_OVERLOADED, 'Overloaded');
            const highError = new error_1.MCPErrorClass(error_1.MCPErrorCode.CONNECTION_LOST, 'Connection lost');
            const mediumError = new error_1.MCPErrorClass(error_1.MCPErrorCode.AUTHENTICATION_FAILED, 'Auth failed');
            const lowError = new error_1.MCPErrorClass(error_1.MCPErrorCode.RESOURCE_NOT_FOUND, 'Not found');
            expect(criticalError.severity).toBe(error_1.ErrorSeverity.HIGH); // System overloaded is high severity
            expect(highError.severity).toBe(error_1.ErrorSeverity.HIGH);
            expect(mediumError.severity).toBe(error_1.ErrorSeverity.MEDIUM);
            expect(lowError.severity).toBe(error_1.ErrorSeverity.LOW);
        });
        it('should correctly identify retryable errors', () => {
            const retryableError = new error_1.MCPErrorClass(error_1.MCPErrorCode.CONNECTION_TIMEOUT, 'Timeout');
            const nonRetryableError = new error_1.MCPErrorClass(error_1.MCPErrorCode.AUTHENTICATION_FAILED, 'Auth failed');
            expect(retryableError.retryable).toBe(true);
            expect(nonRetryableError.retryable).toBe(false);
        });
    });
});
//# sourceMappingURL=MCPErrorHandler.test.js.map