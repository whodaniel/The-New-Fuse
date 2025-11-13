"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MFAError = exports.TokenError = exports.ValidationError = exports.RateLimitError = exports.AuthorizationError = exports.AuthenticationError = exports.SecurityError = void 0;
exports.createErrorResponse = createErrorResponse;
exports.handleSecurityError = handleSecurityError;
class SecurityError extends Error {
    code;
    statusCode;
    details;
    constructor(message, code, statusCode = 400, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'SecurityError';
    }
}
exports.SecurityError = SecurityError;
class AuthenticationError extends SecurityError {
    constructor(message = 'Authentication failed', code = 'AUTH_FAILED', details) {
        super(message, code, 401, details);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends SecurityError {
    constructor(message = 'Access denied', code = 'ACCESS_DENIED', details) {
        super(message, code, 403, details);
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
class RateLimitError extends SecurityError {
    constructor(message = 'Rate limit exceeded', code = 'RATE_LIMIT_EXCEEDED', details) {
        super(message, code, 429, details);
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
class ValidationError extends SecurityError {
    constructor(message = 'Validation failed', code = 'VALIDATION_ERROR', details) {
        super(message, code, 422, details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class TokenError extends SecurityError {
    constructor(message = 'Token validation failed', code = 'TOKEN_ERROR', details) {
        super(message, code, 401, details);
        this.name = 'TokenError';
    }
}
exports.TokenError = TokenError;
class MFAError extends SecurityError {
    constructor(message = 'MFA verification failed', code = 'MFA_ERROR', details) {
        super(message, code, 401, details);
        this.name = 'MFAError';
    }
}
exports.MFAError = MFAError;
function createErrorResponse(error) {
    if (error instanceof SecurityError) {
        return {
            success: false,
            error: error.message,
            code: error.code,
            details: error.details
        };
    }
    return {
        success: false,
        error: error.message || 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
    };
}
function handleSecurityError(error) {
    if (error instanceof SecurityError) {
        return error;
    }
    if (error.name === 'JsonWebTokenError') {
        return new TokenError('Invalid token format', 'INVALID_TOKEN');
    }
    if (error.name === 'TokenExpiredError') {
        return new TokenError('Token has expired', 'TOKEN_EXPIRED');
    }
    if (error.name === 'ValidationError') {
        return new ValidationError(error.message, 'VALIDATION_ERROR', error.errors);
    }
    return new SecurityError(error.message || 'An unexpected security error occurred', 'SECURITY_ERROR', 500);
}
//# sourceMappingURL=index.js.map