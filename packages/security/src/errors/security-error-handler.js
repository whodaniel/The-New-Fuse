"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityErrorMiddleware = exports.createSecurityErrorHandler = exports.SecurityErrorHandler = exports.ValidationError = exports.TokenError = exports.RateLimitError = exports.AuthorizationError = exports.AuthenticationError = exports.SecurityError = void 0;
const common_1 = require("@nestjs/common");
class SecurityError extends common_1.HttpException {
    errorCode;
    details;
    constructor(message, statusCode, errorCode, details) {
        super(message, statusCode);
        this.errorCode = errorCode;
        this.details = details;
    }
}
exports.SecurityError = SecurityError;
class AuthenticationError extends SecurityError {
    constructor(message = 'Authentication failed', details) {
        super(message, common_1.HttpStatus.UNAUTHORIZED, 'AUTH_ERROR', details);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends SecurityError {
    constructor(message = 'Access denied', details) {
        super(message, common_1.HttpStatus.FORBIDDEN, 'AUTHZ_ERROR', details);
    }
}
exports.AuthorizationError = AuthorizationError;
class RateLimitError extends SecurityError {
    constructor(message = 'Rate limit exceeded', details) {
        super(message, common_1.HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT_ERROR', details);
    }
}
exports.RateLimitError = RateLimitError;
class TokenError extends SecurityError {
    constructor(message = 'Invalid or expired token', details) {
        super(message, common_1.HttpStatus.UNAUTHORIZED, 'TOKEN_ERROR', details);
    }
}
exports.TokenError = TokenError;
class ValidationError extends SecurityError {
    constructor(message = 'Validation failed', details) {
        super(message, common_1.HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', details);
    }
}
exports.ValidationError = ValidationError;
class SecurityErrorHandler {
    auditService;
    logger = new common_1.Logger(SecurityErrorHandler.name);
    constructor(auditService) {
        this.auditService = auditService;
    }
    handleError(error, req, res) {
        let securityError;
        if (error instanceof SecurityError) {
            securityError = error;
        }
        else if (error.name === 'JsonWebTokenError') {
            securityError = new TokenError('Invalid token format');
        }
        else if (error.name === 'TokenExpiredError') {
            securityError = new TokenError('Token has expired');
        }
        else if (error.message?.includes('rate limit')) {
            securityError = new RateLimitError();
        }
        else if (error.message?.includes('permission') || error.message?.includes('access')) {
            securityError = new AuthorizationError();
        }
        else {
            securityError = new SecurityError('Internal server error', common_1.HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR');
        }
        const response = {
            statusCode: securityError.getStatus(),
            message: securityError.message,
            error: securityError.errorCode || 'UNKNOWN_ERROR',
            timestamp: new Date().toISOString(),
            path: req.path,
            requestId: req.headers['x-request-id'],
            details: securityError.details
        };
        // Log security events for audit
        if (this.auditService) {
            this.auditService.logSecurityEvent({
                action: 'security_error',
                userId: req.user?.id || 'anonymous',
                resource: req.path,
                outcome: 'failure',
                details: {
                    errorCode: securityError.errorCode,
                    statusCode: securityError.getStatus(),
                    userAgent: req.headers['user-agent'],
                    ipAddress: req.ip || req.connection.remoteAddress
                }
            }).catch(err => {
                this.logger.error('Failed to log security event', err);
            });
        }
        this.logger.error(`Security error: ${securityError.message}`, {
            error: securityError,
            request: {
                method: req.method,
                url: req.url,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            }
        });
        res.status(securityError.getStatus()).json(response);
    }
    createExceptionFilter() {
        return (error, req, res, next) => {
            this.handleError(error, req, res);
        };
    }
}
exports.SecurityErrorHandler = SecurityErrorHandler;
// Global error handler factory
const createSecurityErrorHandler = (auditService) => {
    return new SecurityErrorHandler(auditService);
};
exports.createSecurityErrorHandler = createSecurityErrorHandler;
// Express middleware for security error handling
const securityErrorMiddleware = (auditService) => {
    const handler = new SecurityErrorHandler(auditService);
    return (error, req, res, next) => {
        handler.handleError(error, req, res);
    };
};
exports.securityErrorMiddleware = securityErrorMiddleware;
//# sourceMappingURL=security-error-handler.js.map