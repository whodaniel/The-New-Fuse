"use strict";
/**
 * @fileoverview Production-ready error handling utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ErrorHandler = exports.SecurityError = exports.TimeoutError = exports.NetworkError = exports.ValidationError = exports.DatabaseError = exports.MemoryError = exports.WorkflowNotFoundError = exports.WorkflowError = exports.TaskNotFoundError = exports.TaskError = exports.AgentTimeoutError = exports.AgentNotFoundError = exports.AgentError = exports.ConfigurationError = exports.ServiceUnavailableError = exports.SystemInitializationError = exports.BaseError = void 0;
const types_js_1 = require("../constants/types.js");
class BaseError extends Error {
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
exports.BaseError = BaseError;
// Specific Error Classes
class SystemInitializationError extends BaseError {
    constructor(message, details) {
        super(message, types_js_1.ERROR_CODES.SYSTEM_INITIALIZATION_FAILED, details, 'critical', false);
    }
}
exports.SystemInitializationError = SystemInitializationError;
class ServiceUnavailableError extends BaseError {
    constructor(serviceName, details) {
        super(`Service ${serviceName} is unavailable`, types_js_1.ERROR_CODES.SERVICE_UNAVAILABLE, details, 'high', true);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
class ConfigurationError extends BaseError {
    constructor(message, details) {
        super(message, types_js_1.ERROR_CODES.CONFIGURATION_ERROR, details, 'high', false);
    }
}
exports.ConfigurationError = ConfigurationError;
class AgentError extends BaseError {
    constructor(message, code, agentId, details) {
        super(message, code, { agentId, ...details }, 'medium', true);
    }
}
exports.AgentError = AgentError;
class AgentNotFoundError extends AgentError {
    constructor(agentId) {
        super(`Agent ${agentId} not found`, types_js_1.ERROR_CODES.AGENT_NOT_FOUND, agentId);
    }
}
exports.AgentNotFoundError = AgentNotFoundError;
class AgentTimeoutError extends AgentError {
    constructor(agentId, timeout) {
        super(`Agent ${agentId} timed out after ${timeout}ms`, types_js_1.ERROR_CODES.AGENT_TIMEOUT, agentId, {
            timeout,
        });
    }
}
exports.AgentTimeoutError = AgentTimeoutError;
class TaskError extends BaseError {
    constructor(message, code, taskId, details) {
        super(message, code, { taskId, ...details }, 'medium', true);
    }
}
exports.TaskError = TaskError;
class TaskNotFoundError extends TaskError {
    constructor(taskId) {
        super(`Task ${taskId} not found`, types_js_1.ERROR_CODES.TASK_NOT_FOUND, taskId);
    }
}
exports.TaskNotFoundError = TaskNotFoundError;
class WorkflowError extends BaseError {
    constructor(message, code, workflowId, details) {
        super(message, code, { workflowId, ...details }, 'medium', true);
    }
}
exports.WorkflowError = WorkflowError;
class WorkflowNotFoundError extends WorkflowError {
    constructor(workflowId) {
        super(`Workflow ${workflowId} not found`, types_js_1.ERROR_CODES.WORKFLOW_NOT_FOUND, workflowId);
    }
}
exports.WorkflowNotFoundError = WorkflowNotFoundError;
class MemoryError extends BaseError {
    constructor(message, code, details) {
        super(message, code, details, 'medium', true);
    }
}
exports.MemoryError = MemoryError;
class DatabaseError extends BaseError {
    constructor(message, code, details) {
        super(message, code, details, 'high', true);
    }
}
exports.DatabaseError = DatabaseError;
class ValidationError extends BaseError {
    constructor(message, field, value) {
        super(message, types_js_1.ERROR_CODES.INVALID_INPUT, { field, value }, 'low', true);
    }
}
exports.ValidationError = ValidationError;
class NetworkError extends BaseError {
    constructor(message, url, statusCode) {
        super(message, types_js_1.ERROR_CODES.NETWORK_ERROR, { url, statusCode }, 'medium', true);
    }
}
exports.NetworkError = NetworkError;
class TimeoutError extends BaseError {
    constructor(operation, timeout) {
        super(`Operation ${operation} timed out after ${timeout}ms`, types_js_1.ERROR_CODES.TIMEOUT_ERROR, { operation, timeout }, 'medium', true);
    }
}
exports.TimeoutError = TimeoutError;
class SecurityError extends BaseError {
    constructor(message, details) {
        super(message, types_js_1.ERROR_CODES.UNAUTHORIZED, details, 'high', false);
    }
}
exports.SecurityError = SecurityError;
// Error Handler Utility
class ErrorHandler {
    constructor() {
        this.errorCallbacks = [];
    }
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
        this.errorCallbacks.forEach((callback) => {
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
            if (error.code === types_js_1.ERROR_CODES.INVALID_INPUT ||
                error.code === types_js_1.ERROR_CODES.MISSING_REQUIRED_FIELD ||
                error.code === types_js_1.ERROR_CODES.INVALID_FORMAT) {
                return false;
            }
            // Don't retry authorization errors
            if (error.code === types_js_1.ERROR_CODES.UNAUTHORIZED || error.code === types_js_1.ERROR_CODES.FORBIDDEN) {
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
exports.ErrorHandler = ErrorHandler;
// Global error handler instance
exports.errorHandler = ErrorHandler.getInstance();
//# sourceMappingURL=errors.js.map