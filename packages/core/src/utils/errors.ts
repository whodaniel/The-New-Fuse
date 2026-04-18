/**
 * @fileoverview Production-ready error handling utilities
 */

import { SystemError } from '../types/core.js';
import { ERROR_CODES } from '../constants/types.js';

export class BaseError extends Error {
  public readonly code: string;
  public readonly details: Record<string, any>;
  public readonly timestamp: Date;
  public readonly source: string;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly recoverable: boolean;

  constructor(
    message: string,
    code: string,
    details: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    recoverable: boolean = true,
  ) {
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

  private getSource(): string {
    const stack = this.stack;
    if (!stack) return 'unknown';

    const lines = stack.split('\n');
    const callerLine = lines[2]; // Skip Error and constructor lines
    if (!callerLine) return 'unknown';

    const match = callerLine.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
    if (match) {
      const [, , filePath, lineNumber] = match;
      const fileName = filePath.split('/').pop() || filePath;
      return `${fileName}:${lineNumber}`;
    }

    return 'unknown';
  }

  toSystemError(): SystemError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      source: this.source,
      severity: this.severity,
    };
  }

  toJSON(): Record<string, any> {
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
  constructor(message: string, details?: Record<string, any>) {
    super(message, ERROR_CODES.SYSTEM_INITIALIZATION_FAILED, details, 'critical', false);
  }
}

export class ServiceUnavailableError extends BaseError {
  constructor(serviceName: string, details?: Record<string, any>) {
    super(
      `Service ${serviceName} is unavailable`,
      ERROR_CODES.SERVICE_UNAVAILABLE,
      details,
      'high',
      true,
    );
  }
}

export class ConfigurationError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ERROR_CODES.CONFIGURATION_ERROR, details, 'high', false);
  }
}

export class AgentError extends BaseError {
  constructor(message: string, code: string, agentId?: string, details?: Record<string, any>) {
    super(message, code, { agentId, ...details }, 'medium', true);
  }
}

export class AgentNotFoundError extends AgentError {
  constructor(agentId: string) {
    super(`Agent ${agentId} not found`, ERROR_CODES.AGENT_NOT_FOUND, agentId);
  }
}

export class AgentTimeoutError extends AgentError {
  constructor(agentId: string, timeout: number) {
    super(`Agent ${agentId} timed out after ${timeout}ms`, ERROR_CODES.AGENT_TIMEOUT, agentId, {
      timeout,
    });
  }
}

export class TaskError extends BaseError {
  constructor(message: string, code: string, taskId?: string, details?: Record<string, any>) {
    super(message, code, { taskId, ...details }, 'medium', true);
  }
}

export class TaskNotFoundError extends TaskError {
  constructor(taskId: string) {
    super(`Task ${taskId} not found`, ERROR_CODES.TASK_NOT_FOUND, taskId);
  }
}

export class WorkflowError extends BaseError {
  constructor(message: string, code: string, workflowId?: string, details?: Record<string, any>) {
    super(message, code, { workflowId, ...details }, 'medium', true);
  }
}

export class WorkflowNotFoundError extends WorkflowError {
  constructor(workflowId: string) {
    super(`Workflow ${workflowId} not found`, ERROR_CODES.WORKFLOW_NOT_FOUND, workflowId);
  }
}

export class MemoryError extends BaseError {
  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message, code, details, 'medium', true);
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message, code, details, 'high', true);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, field?: string, value?: any) {
    super(message, ERROR_CODES.INVALID_INPUT, { field, value }, 'low', true);
  }
}

export class NetworkError extends BaseError {
  constructor(message: string, url?: string, statusCode?: number) {
    super(message, ERROR_CODES.NETWORK_ERROR, { url, statusCode }, 'medium', true);
  }
}

export class TimeoutError extends BaseError {
  constructor(operation: string, timeout: number) {
    super(
      `Operation ${operation} timed out after ${timeout}ms`,
      ERROR_CODES.TIMEOUT_ERROR,
      { operation, timeout },
      'medium',
      true,
    );
  }
}

export class SecurityError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ERROR_CODES.UNAUTHORIZED, details, 'high', false);
  }
}

// Error Handler Utility
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCallbacks: Array<(error: BaseError) => void> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  onError(callback: (error: BaseError) => void): void {
    this.errorCallbacks.push(callback);
  }

  handle(error: Error | BaseError): BaseError {
    let baseError: BaseError;

    if (error instanceof BaseError) {
      baseError = error;
    } else {
      // Convert regular Error to BaseError
      baseError = new BaseError(
        error.message,
        'UNKNOWN_ERROR',
        { originalError: error.name },
        'medium',
        true,
      );
      baseError.stack = error.stack;
    }

    // Notify all registered callbacks
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(baseError);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });

    return baseError;
  }

  isRecoverable(error: Error | BaseError): boolean {
    if (error instanceof BaseError) {
      return error.recoverable;
    }
    return true; // Assume regular errors are recoverable
  }

  shouldRetry(error: Error | BaseError, attempt: number, maxAttempts: number): boolean {
    if (attempt >= maxAttempts) {
      return false;
    }

    if (!this.isRecoverable(error)) {
      return false;
    }

    if (error instanceof BaseError) {
      // Don't retry validation errors
      if (
        error.code === ERROR_CODES.INVALID_INPUT ||
        error.code === ERROR_CODES.MISSING_REQUIRED_FIELD ||
        error.code === ERROR_CODES.INVALID_FORMAT
      ) {
        return false;
      }

      // Don't retry authorization errors
      if (error.code === ERROR_CODES.UNAUTHORIZED || error.code === ERROR_CODES.FORBIDDEN) {
        return false;
      }
    }

    return true;
  }

  getRetryDelay(
    attempt: number,
    strategy: 'fixed' | 'exponential' | 'linear' = 'exponential',
    baseDelay: number = 1000,
  ): number {
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
