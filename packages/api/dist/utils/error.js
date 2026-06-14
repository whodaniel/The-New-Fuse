/**
 * Error handling utilities
 */
export function toError(error) {
    if (error instanceof Error) {
        return error;
    }
    if (typeof error === 'string') {
        return new Error(error);
    }
    if (error && typeof error === 'object' && 'message' in error) {
        return new Error(String(error.message));
    }
    return new Error('Unknown error occurred');
}
export function isError(error) {
    return error instanceof Error;
}
//# sourceMappingURL=error.js.map