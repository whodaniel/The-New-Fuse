"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    data;
    constructor(statusCode, message, data = {}) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
        this.name = 'ApiError';
    }
}
exports.ApiError = ApiError;
const errorHandler = (err, _req, res, _next) => {
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
exports.errorHandler = errorHandler;
