"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EnhancedErrorHandlerMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedErrorHandlerMiddleware = void 0;
const common_1 = require("@nestjs/common");
const security_logging_service_1 = require("../security/security-logging.service");
let EnhancedErrorHandlerMiddleware = EnhancedErrorHandlerMiddleware_1 = class EnhancedErrorHandlerMiddleware {
    constructor(securityLogging) {
        this.securityLogging = securityLogging;
        this.logger = new common_1.Logger(EnhancedErrorHandlerMiddleware_1.name);
    }
    // Error handling middleware function (4 parameters)
    getHandler() {
        return ((err, req, res, _next) => {
            // Log the error with security context
            this.logError(err, req, res);
            // Determine error response based on error type and security context
            const errorResponse = this.createErrorResponse(err, req);
            // Send the response
            res.status(errorResponse.error.statusCode).json(errorResponse);
        });
    }
    /**
     * Create standardized error response
     */
    createErrorResponse(error, req) {
        const timestamp = new Date().toISOString();
        const requestId = req.requestId;
        // Handle different error types
        if (error.name === 'ValidationError') {
            return this.handleValidationError(error, timestamp, requestId);
        }
        if (error.name === 'UnauthorizedException' || error.status === 401) {
            return this.handleUnauthorizedError(error, timestamp, requestId, req);
        }
        if (error.name === 'ForbiddenException' || error.status === 403) {
            return this.handleForbiddenError(error, timestamp, requestId, req);
        }
        if (error.name === 'NotFoundException' || error.status === 404) {
            return this.handleNotFoundError(error, timestamp, requestId, req);
        }
        if (error.name === 'TooManyRequestsException' || error.status === 429) {
            return this.handleRateLimitError(error, timestamp, requestId, req);
        }
        if (error.name === 'BadRequestException' || error.status === 400) {
            return this.handleBadRequestError(error, timestamp, requestId, req);
        }
        if (error.status >= 500) {
            return this.handleServerError(error, timestamp, requestId, req);
        }
        // Default error handling
        return {
            success: false,
            error: {
                code: error.code || 'UNKNOWN_ERROR',
                message: error.message || 'An unexpected error occurred',
                statusCode: error.status || 500,
                timestamp,
                requestId,
                details: this.sanitizeErrorDetails(error),
            },
        };
    }
    /**
     * Handle validation errors
     */
    handleValidationError(error, timestamp, requestId) {
        return {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Request validation failed',
                statusCode: 400,
                timestamp,
                requestId,
                details: {
                    validationErrors: error.message || 'Invalid input data',
                    suggestion: 'Please check your request data and try again',
                },
            },
        };
    }
    /**
     * Handle unauthorized errors
     */
    handleUnauthorizedError(error, timestamp, requestId, req) {
        this.securityLogging.logAuthEvent('auth_failure', {
            ip: req.clientIP,
            userAgent: req.headers['user-agent'],
            method: req.method,
            endpoint: req.path,
            success: false,
            reason: error.message || 'Authentication required',
            metadata: { requestId },
        });
        return {
            success: false,
            error: {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication is required to access this resource',
                statusCode: 401,
                timestamp,
                requestId,
                details: {
                    authType: 'Bearer token',
                    hint: 'Please include a valid JWT token in the Authorization header',
                },
            },
        };
    }
    /**
     * Handle forbidden errors
     */
    handleForbiddenError(error, timestamp, requestId, req) {
        this.securityLogging.logAuthZEvent('access_denied', {
            userId: req.user?.id,
            ip: req.clientIP,
            userAgent: req.headers['user-agent'],
            method: req.method,
            endpoint: req.path,
            success: false,
            reason: error.message || 'Insufficient permissions',
        });
        return {
            success: false,
            error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'You do not have permission to access this resource',
                statusCode: 403,
                timestamp,
                requestId,
                details: {
                    requiredRole: error.requiredRole,
                    userRoles: req.user?.roles,
                    hint: 'Contact an administrator if you believe this is an error',
                },
            },
        };
    }
    /**
     * Handle not found errors
     */
    handleNotFoundError(error, timestamp, requestId, req) {
        return {
            success: false,
            error: {
                code: 'RESOURCE_NOT_FOUND',
                message: 'The requested resource was not found',
                statusCode: 404,
                timestamp,
                requestId,
                details: {
                    resource: req.path,
                    method: req.method,
                    hint: 'Please verify the URL and ensure the resource exists',
                },
            },
        };
    }
    /**
     * Handle rate limit errors
     */
    handleRateLimitError(error, timestamp, requestId, req) {
        return {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later',
                statusCode: 429,
                timestamp,
                requestId,
                details: {
                    limit: error.limit || 100,
                    window: '1 minute',
                    resetTime: error.resetTime,
                    hint: 'Wait before making more requests or upgrade your plan',
                },
            },
        };
    }
    /**
     * Handle bad request errors
     */
    handleBadRequestError(error, timestamp, requestId, req) {
        this.securityLogging.logInputValidation(req.path, req.method, {
            ip: req.clientIP,
            reason: error.message || 'Bad request',
            severity: 'medium',
        });
        return {
            success: false,
            error: {
                code: 'BAD_REQUEST',
                message: 'The request could not be understood or was missing required parameters',
                statusCode: 400,
                timestamp,
                requestId,
                details: {
                    hint: 'Please check your request format and required parameters',
                },
            },
        };
    }
    /**
     * Handle server errors
     */
    handleServerError(error, timestamp, requestId, req) {
        // Log server errors for monitoring
        this.logger.error('Server Error', {
            error: error.message,
            stack: error.stack,
            requestId,
            path: req.path,
            method: req.method,
            ip: req.clientIP,
        });
        return {
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An internal server error occurred',
                statusCode: 500,
                timestamp,
                requestId,
                details: {
                    referenceId: requestId,
                    hint: 'Please try again later or contact support if the problem persists',
                },
            },
        };
    }
    /**
     * Log error for monitoring and debugging
     */
    logError(error, req, res) {
        const errorInfo = {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code,
                status: error.status,
            },
            request: {
                id: req.requestId,
                method: req.method,
                path: req.path,
                ip: req.clientIP,
                userAgent: req.userAgent,
                userId: req.user?.id,
                timestamp: req.timestamp,
            },
            response: {
                statusCode: res.statusCode,
            },
        };
        if (error.status >= 500) {
            this.logger.error('Server Error', errorInfo);
        }
        else if (error.status === 401 || error.status === 403) {
            this.logger.warn('Auth Error', errorInfo);
        }
        else {
            this.logger.warn('Client Error', errorInfo);
        }
    }
    /**
     * Sanitize error details to avoid exposing sensitive information
     */
    sanitizeErrorDetails(error) {
        const sanitized = { ...error };
        // Remove sensitive fields
        delete sanitized.password;
        delete sanitized.token;
        delete sanitized.secret;
        delete sanitized.key;
        // Truncate long messages
        if (sanitized.message && sanitized.message.length > 500) {
            sanitized.message = sanitized.message.substring(0, 500) + '...';
        }
        return sanitized;
    }
};
exports.EnhancedErrorHandlerMiddleware = EnhancedErrorHandlerMiddleware;
exports.EnhancedErrorHandlerMiddleware = EnhancedErrorHandlerMiddleware = EnhancedErrorHandlerMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [security_logging_service_1.SecurityLoggingService])
], EnhancedErrorHandlerMiddleware);
//# sourceMappingURL=enhanced-error-handler.middleware.js.map