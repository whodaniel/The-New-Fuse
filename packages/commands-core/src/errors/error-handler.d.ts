import { ErrorType } from '../interfaces';
import { CommandError } from '../base/base-command';
/**
 * Error handler for command execution errors
 */
export declare class CommandErrorHandler {
    private errorHandlers;
    private globalHandlers;
    constructor();
    /**
     * Handle an error
     */
    handleError(error: Error | CommandError, context?: any): Promise<CommandError>;
    /**
     * Register an error handler for a specific error type
     */
    registerHandler(errorType: ErrorType, handler: ErrorHandlerFunction): void;
    /**
     * Register a global error handler
     */
    registerGlobalHandler(handler: GlobalErrorHandlerFunction): void;
    /**
     * Remove an error handler
     */
    removeHandler(errorType: ErrorType): boolean;
    /**
     * Remove a global error handler
     */
    removeGlobalHandler(handler: GlobalErrorHandlerFunction): boolean;
    /**
     * Clear all error handlers
     */
    clear(): void;
    /**
     * Get registered error types
     */
    getRegisteredErrorTypes(): ErrorType[];
    /**
     * Get global handler count
     */
    getGlobalHandlerCount(): number;
    /**
     * Ensure error is a CommandError
     */
    private ensureCommandError;
    /**
     * Register default error handlers
     */
    private registerDefaultHandlers;
}
/**
 * Error handler function type
 */
export type ErrorHandlerFunction = (error: CommandError, context?: any) => Promise<CommandError>;
/**
 * Global error handler function type
 */
export type GlobalErrorHandlerFunction = (error: CommandError, context?: any) => Promise<CommandError>;
/**
 * Error context for detailed error information
 */
export interface ErrorContext {
    readonly commandType?: string;
    readonly executionId?: string;
    readonly userId?: string;
    readonly timestamp?: Date;
    readonly stack?: string;
    readonly [key: string]: any;
}
/**
 * Error reporter for collecting and reporting errors
 */
export declare class ErrorReporter {
    private errors;
    private maxErrors;
    private onErrorCallback?;
    constructor(maxErrors?: number);
    /**
     * Report an error
     */
    reportError(error: CommandError, context?: ErrorContext): void;
    /**
     * Get all reported errors
     */
    getErrors(): ReportedError[];
    /**
     * Get errors by type
     */
    getErrorsByType(errorType: ErrorType): ReportedError[];
    /**
     * Get errors by code
     */
    getErrorsByCode(errorCode: string): ReportedError[];
    /**
     * Get errors in time range
     */
    getErrorsInTimeRange(start: Date, end: Date): ReportedError[];
    /**
     * Clear all errors
     */
    clear(): void;
    /**
     * Get error statistics
     */
    getStats(): ErrorStats;
    /**
     * Set error callback
     */
    onError(callback: (error: ReportedError) => void): void;
    /**
     * Generate unique error ID
     */
    private generateErrorId;
}
/**
 * Reported error interface
 */
export interface ReportedError {
    readonly id: string;
    readonly error: CommandError;
    readonly context?: ErrorContext;
    readonly timestamp: Date;
    reported: boolean;
}
/**
 * Error statistics
 */
export interface ErrorStats {
    readonly totalErrors: number;
    readonly errorsByType: Partial<Record<ErrorType, number>>;
    readonly errorsByCode: Record<string, number>;
    readonly oldestError: Date | null;
    readonly newestError: Date | null;
}
//# sourceMappingURL=error-handler.d.ts.map