/**
 * Error handling utilities for TypeScript
 */
export interface ErrorDetails {
    message: string;
    code?: string;
    stack?: string;
}
/**
 * Type guard to check if an error is an Error instance
 */
export declare function isError(error: unknown): error is Error;
/**
 * Type guard to check if an error has a message property
 */
export declare function hasMessage(error: unknown): error is {
    message: string;
};
/**
 * Type guard to check if an error has a code property
 */
export declare function hasCode(error: unknown): error is {
    code: string;
};
/**
 * Safe error message extraction
 */
export declare function getErrorMessage(error: unknown): string;
/**
 * Safe error code extraction
 */
export declare function getErrorCode(error: unknown): string | undefined;
/**
 * Convert unknown error to ErrorDetails
 */
export declare function parseError(error: unknown): ErrorDetails;
/**
 * Log error safely with proper formatting
 */
export declare function logError(context: string, error: unknown, logger?: {
    error: (message: string, ...args: any[]) => void;
}): void;
/**
 * Create a standardized error response
 */
export declare function createErrorResponse(error: unknown, fallbackMessage: string): {
    success: boolean;
    message: string;
    code: string | undefined;
};
//# sourceMappingURL=error-handling.d.ts.map