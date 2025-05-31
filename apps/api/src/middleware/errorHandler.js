export class ApiError extends Error {
    constructor(statusCode, message, data = {}) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
        this.name = 'ApiError';
    }
}
export const errorHandler = (err, _req, res, _next) => {
    console.error(err);
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...err.data
        });
    }
    return res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
};
