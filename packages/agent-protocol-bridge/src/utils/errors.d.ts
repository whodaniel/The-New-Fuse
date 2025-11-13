/**
 * Error utility functions for safe error message extraction
 */
/**
 * Safely converts an error to a string message
 * Handles both Error instances and other types of thrown values
 * @param error - The error value to convert
 * @returns A string representation of the error
 */
export declare function errorToMessage(error: unknown): string;
/**
 * Safely converts an error to a detailed string with stack trace
 * @param error - The error value to convert
 * @returns A detailed string representation of the error
 */
export declare function errorToDetailedMessage(error: unknown): string;
/**
 * Type guard to check if a value is an Error instance
 * @param value - The value to check
 * @returns True if the value is an Error instance
 */
export declare function isError(value: unknown): value is Error;
//# sourceMappingURL=errors.d.ts.map