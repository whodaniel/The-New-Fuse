// @ts-nocheck
/**
 * Error handling utilities for the workflow engine
 */
/**
 * Safely extracts error message from unknown error types
 * @param error - The error object or any unknown type
 * @returns A string representation of the error
 */
export declare function getErrorMessage(error: unknown): string;
/**
 * Type guard to check if error is an Error instance
 * @param error - The error to check
 * @returns true if error is an Error instance
 */
export declare function isError(error: unknown): error is Error;
/**
 * Creates a standardized ExecutionError from any error type
 * @param error - The error to convert
 * @param nodeId - Optional node ID where the error occurred
 * @returns A standardized ExecutionError object
 */
export declare function createExecutionError(error: unknown, nodeId?: string): {
    code: string;
    message: string;
    stack?: string;
    nodeId?: string;
    timestamp: Date;
    recoverable: boolean;
    metadata: Record<string, any>;
};
//# sourceMappingURL=errorUtils.d.ts.map