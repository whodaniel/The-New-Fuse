"use strict";
/**
 * Error utility functions for safe error message extraction
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorToMessage = errorToMessage;
exports.errorToDetailedMessage = errorToDetailedMessage;
exports.isError = isError;
/**
 * Safely converts an error to a string message
 * Handles both Error instances and other types of thrown values
 * @param error - The error value to convert
 * @returns A string representation of the error
 */
function errorToMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
/**
 * Safely converts an error to a detailed string with stack trace
 * @param error - The error value to convert
 * @returns A detailed string representation of the error
 */
function errorToDetailedMessage(error) {
    if (error instanceof Error) {
        return error.stack || error.message;
    }
    return String(error);
}
/**
 * Type guard to check if a value is an Error instance
 * @param value - The value to check
 * @returns True if the value is an Error instance
 */
function isError(value) {
    return value instanceof Error;
}
//# sourceMappingURL=errors.js.map