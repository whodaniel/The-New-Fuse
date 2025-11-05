/**
 * Error handling utilities for TypeScript
 */
/**
 * Type guard to check if an error is an Error instance
 */
export function isError(error) {
    return error instanceof Error;
}
/**
 * Type guard to check if an error has a message property
 */
export function hasMessage(error) {
    return typeof error === 'object' && error !== null && 'message' in error;
}
/**
 * Type guard to check if an error has a code property
 */
export function hasCode(error) {
    return typeof error === 'object' && error !== null && 'code' in error;
}
/**
 * Safe error message extraction
 */
export function getErrorMessage(error) {
    if (isError(error)) {
        return error.message;
    }
    if (hasMessage(error)) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    if (error === null || error === undefined) {
        return 'Unknown error occurred';
    }
    return String(error);
}
/**
 * Safe error code extraction
 */
export function getErrorCode(error) {
    if (hasCode(error)) {
        return error.code;
    }
    return undefined;
}
/**
 * Convert unknown error to ErrorDetails
 */
export function parseError(error) {
    return {
        message: getErrorMessage(error),
        code: getErrorCode(error),
        stack: isError(error) ? error.stack : undefined,
    };
}
/**
 * Log error safely with proper formatting
 */
export function logError(context, error, logger) {
    const errorDetails = parseError(error);
    const logMessage = `${context}: ${errorDetails.message}`;
    if (logger) {
        logger.error(logMessage, errorDetails.stack);
    }
    else {
        console.error(logMessage, errorDetails);
    }
}
/**
 * Create a standardized error response
 */
export function createErrorResponse(error, fallbackMessage) {
    const errorDetails = parseError(error);
    return {
        success: false,
        message: errorDetails.message || fallbackMessage,
        code: errorDetails.code,
    };
}
//# sourceMappingURL=error-handling.js.map