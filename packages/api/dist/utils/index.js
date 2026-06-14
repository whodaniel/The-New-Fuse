/**
 * API utilities
 */
/**
 * Format error response consistent with API standards
 */
export function formatError(error) {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;
    return {
        success: false,
        error: message,
        ...(stack ? { stack } : {})
    };
}
/**
 * Format success response consistent with API standards
 */
export function formatSuccess(data, meta) {
    return {
        success: true,
        data,
        ...(meta ? { meta } : {})
    };
}
//# sourceMappingURL=index.js.map