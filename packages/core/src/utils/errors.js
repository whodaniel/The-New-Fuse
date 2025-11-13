/**
 * @fileoverview Production-ready error handling utilities
 */
import { ERROR_CODES } from '../constants/types';
export class BaseError extends Error {
    code;
    details;
    timestamp;
    source;
    severity;
    recoverable;
    constructor(message, code, details = {}, severity = 'medium', recoverable = true) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;
        this.timestamp = new Date();
        this.source = this.getSource();
        this.severity = severity;
        this.recoverable = recoverable;
        // Maintains proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    getSource() {
        const stack = this.stack;
        if (!stack)
            return 'unknown';
        const lines = stack.split('\n');
        const callerLine = lines[2]; // Skip Error and constructor lines
        if (!callerLine)
            return 'unknown';
        const match = callerLine.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
        if (match) {
            const [, , filePath, lineNumber] = match;
            const fileName = filePath.split('/').pop() || filePath;
            return `${fileName}:${lineNumber}`;
        }
        return 'unknown';
    }
    toSystemError() {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp,
            source: this.source,
            severity: this.severity,
        };
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            details: this.details,
            timestamp: this.timestamp,
            source: this.source,
            severity: this.severity,
            recoverable: this.recoverable,
            stack: this.stack,
        };
    }
}
// Specific Error Classes
export class SystemInitializationError extends BaseError {
    constructor(message, details) {
        super(message, ERROR_CODES.SYSTEM_INITIALIZATION_FAILED, details, 'critical', false);
    }
}
export class ServiceUnavailableError extends BaseError {
    constructor(serviceName, details) {
        super(`Service ${serviceName} is unavailable`, ERROR_CODES.SERVICE_UNAVAILABLE, details, 'high', true);
    }
}
export class ConfigurationError extends BaseError {
    constructor(message, details) {
        super(message, ERROR_CODES.CONFIGURATION_ERROR, details, 'high', false);
    }
}
export class AgentError extends BaseError {
    constructor(message, code, agentId, details) {
        super(message, code, { agentId, ...details }, 'medium', true);
    }
}
export class AgentNotFoundError extends AgentError {
    constructor(agentId) {
        super(`Agent ${agentId} not found`, ERROR_CODES.AGENT_NOT_FOUND, agentId);
    }
}
export class AgentTimeoutError extends AgentError {
    constructor(agentId, timeout) {
        super(`Agent ${agentId} timed out after ${timeout}ms`, ERROR_CODES.AGENT_TIMEOUT, agentId, { timeout });
    }
}
export class TaskError extends BaseError {
    constructor(message, code, taskId, details) {
        super(message, code, { taskId, ...details }, 'medium', true);
    }
}
export class TaskNotFoundError extends TaskError {
    constructor(taskId) {
        super(`Task ${taskId} not found`, ERROR_CODES.TASK_NOT_FOUND, taskId);
    }
}
export class WorkflowError extends BaseError {
    constructor(message, code, workflowId, details) {
        super(message, code, { workflowId, ...details }, 'medium', true);
    }
}
export class WorkflowNotFoundError extends WorkflowError {
    constructor(workflowId) {
        super(`Workflow ${workflowId} not found`, ERROR_CODES.WORKFLOW_NOT_FOUND, workflowId);
    }
}
export class MemoryError extends BaseError {
    constructor(message, code, details) {
        super(message, code, details, 'medium', true);
    }
}
export class DatabaseError extends BaseError {
    constructor(message, code, details) {
        super(message, code, details, 'high', true);
    }
}
export class ValidationError extends BaseError {
    constructor(message, field, value) {
        super(message, ERROR_CODES.INVALID_INPUT, { field, value }, 'low', true);
    }
}
export class NetworkError extends BaseError {
    constructor(message, url, statusCode) {
        super(message, ERROR_CODES.NETWORK_ERROR, { url, statusCode }, 'medium', true);
    }
}
export class TimeoutError extends BaseError {
    constructor(operation, timeout) {
        super(`Operation ${operation} timed out after ${timeout}ms`, ERROR_CODES.TIMEOUT_ERROR, { operation, timeout }, 'medium', true);
    }
}
// Error Handler Utility
export class ErrorHandler {
    static instance;
    errorCallbacks = [];
    static getInstance() {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }
    onError(callback) {
        this.errorCallbacks.push(callback);
    }
    handle(error) {
        let baseError;
        if (error instanceof BaseError) {
            baseError = error;
        }
        else {
            // Convert regular Error to BaseError
            baseError = new BaseError(error.message, 'UNKNOWN_ERROR', { originalError: error.name }, 'medium', true);
            baseError.stack = error.stack;
        }
        // Notify all registered callbacks
        this.errorCallbacks.forEach(callback => {
            try {
                callback(baseError);
            }
            catch (callbackError) {
                console.error('Error in error callback:', callbackError);
            }
        });
        return baseError;
    }
    isRecoverable(error) {
        if (error instanceof BaseError) {
            return error.recoverable;
        }
        return true; // Assume regular errors are recoverable
    }
    shouldRetry(error, attempt, maxAttempts) {
        if (attempt >= maxAttempts) {
            return false;
        }
        if (!this.isRecoverable(error)) {
            return false;
        }
        if (error instanceof BaseError) {
            // Don't retry validation errors
            if (error.code === ERROR_CODES.INVALID_INPUT ||
                error.code === ERROR_CODES.MISSING_REQUIRED_FIELD ||
                error.code === ERROR_CODES.INVALID_FORMAT) {
                return false;
            }
            // Don't retry authorization errors
            if (error.code === ERROR_CODES.UNAUTHORIZED ||
                error.code === ERROR_CODES.FORBIDDEN) {
                return false;
            }
        }
        return true;
    }
    getRetryDelay(attempt, strategy = 'exponential', baseDelay = 1000) {
        switch (strategy) {
            case 'fixed':
                return baseDelay;
            case 'linear':
                return baseDelay * attempt;
            case 'exponential':
                return baseDelay * Math.pow(2, attempt - 1);
            default:
                return baseDelay;
        }
    }
}
// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();
//# sourceMappingURL=errors.js.map