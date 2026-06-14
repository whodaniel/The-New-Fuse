"use strict";
/**
 * Error handling utilities for the workflow engine
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorMessage = getErrorMessage;
exports.isError = isError;
exports.createExecutionError = createExecutionError;
/**
 * Safely extracts error message from unknown error types
 * @param error - The error object or any unknown type
 * @returns A string representation of the error
 */
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    if (typeof error === 'object' && error !== null) {
        // Try to access message property safely
        const errorObj = error;
        if (typeof errorObj.message === 'string') {
            return errorObj.message;
        }
        // Try to stringify the object
        try {
            return JSON.stringify(error);
        }
        catch {
            return '[Object object]';
        }
    }
    return String(error);
}
/**
 * Type guard to check if error is an Error instance
 * @param error - The error to check
 * @returns true if error is an Error instance
 */
function isError(error) {
    return error instanceof Error;
}
/**
 * Creates a standardized ExecutionError from any error type
 * @param error - The error to convert
 * @param nodeId - Optional node ID where the error occurred
 * @returns A standardized ExecutionError object
 */
function createExecutionError(error, nodeId) {
    const message = getErrorMessage(error);
    const stack = isError(error) ? error.stack : undefined;
    return {
        code: 'EXECUTION_ERROR',
        message,
        stack,
        nodeId,
        timestamp: new Date(),
        recoverable: false,
        metadata: {}
    };
}
//# sourceMappingURL=errorUtils.js.map