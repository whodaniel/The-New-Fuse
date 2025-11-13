/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode = 500, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'ApiError';
    }
}
/**
 * Global error handling middleware
 */
export function errorMiddleware(err, _req, res, _next) {
    console.error('Error caught by middleware:', err);
    const statusCode = err instanceof ApiError ? err.statusCode : 500;
    const errorResponse = {
        success: false,
        error: err.message || 'Internal Server Error',
    };
    if (err instanceof ApiError) {
        if (err.code) {
            errorResponse.code = err.code;
        }
        if (err.details) {
            errorResponse.details = err.details;
        }
    }
    res.status(statusCode).json(errorResponse);
}
//# sourceMappingURL=error.middleware.js.map