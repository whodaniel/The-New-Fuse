/**
 * @fileoverview Production-ready error handling utilities
 */
import { SystemError } from '../types/core';
export declare class BaseError extends Error {
    readonly code: string;
    readonly details: Record<string, any>;
    readonly timestamp: Date;
    readonly source: string;
    readonly severity: 'low' | 'medium' | 'high' | 'critical';
    readonly recoverable: boolean;
    constructor(message: string, code: string, details?: Record<string, any>, severity?: 'low' | 'medium' | 'high' | 'critical', recoverable?: boolean);
    private getSource;
    toSystemError(): SystemError;
    toJSON(): Record<string, any>;
}
export declare class SystemInitializationError extends BaseError {
    constructor(message: string, details?: Record<string, any>);
}
export declare class ServiceUnavailableError extends BaseError {
    constructor(serviceName: string, details?: Record<string, any>);
}
export declare class ConfigurationError extends BaseError {
    constructor(message: string, details?: Record<string, any>);
}
export declare class AgentError extends BaseError {
    constructor(message: string, code: string, agentId?: string, details?: Record<string, any>);
}
export declare class AgentNotFoundError extends AgentError {
    constructor(agentId: string);
}
export declare class AgentTimeoutError extends AgentError {
    constructor(agentId: string, timeout: number);
}
export declare class TaskError extends BaseError {
    constructor(message: string, code: string, taskId?: string, details?: Record<string, any>);
}
export declare class TaskNotFoundError extends TaskError {
    constructor(taskId: string);
}
export declare class WorkflowError extends BaseError {
    constructor(message: string, code: string, workflowId?: string, details?: Record<string, any>);
}
export declare class WorkflowNotFoundError extends WorkflowError {
    constructor(workflowId: string);
}
export declare class MemoryError extends BaseError {
    constructor(message: string, code: string, details?: Record<string, any>);
}
export declare class DatabaseError extends BaseError {
    constructor(message: string, code: string, details?: Record<string, any>);
}
export declare class ValidationError extends BaseError {
    constructor(message: string, field?: string, value?: any);
}
export declare class NetworkError extends BaseError {
    constructor(message: string, url?: string, statusCode?: number);
}
export declare class TimeoutError extends BaseError {
    constructor(operation: string, timeout: number);
}
export declare class ErrorHandler {
    private static instance;
    private errorCallbacks;
    static getInstance(): ErrorHandler;
    onError(callback: (error: BaseError) => void): void;
    handle(error: Error | BaseError): BaseError;
    isRecoverable(error: Error | BaseError): boolean;
    shouldRetry(error: Error | BaseError, attempt: number, maxAttempts: number): boolean;
    getRetryDelay(attempt: number, strategy?: 'fixed' | 'exponential' | 'linear', baseDelay?: number): number;
}
export declare const errorHandler: ErrorHandler;
//# sourceMappingURL=errors.d.ts.map