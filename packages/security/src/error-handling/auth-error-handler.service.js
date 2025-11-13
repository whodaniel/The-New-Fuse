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
var AuthErrorHandlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthErrors = exports.AuthErrorHandlerService = void 0;
const common_1 = require("@nestjs/common");
const audit_integration_service_1 = require("../audit-logging/audit-integration.service");
let AuthErrorHandlerService = AuthErrorHandlerService_1 = class AuthErrorHandlerService {
    auditService;
    logger = new common_1.Logger(AuthErrorHandlerService_1.name);
    constructor(auditService) {
        this.auditService = auditService;
    }
    async handleAuthError(error, request, userId) {
        const authError = this.normalizeError(error);
        // Log security event
        await this.auditService.logAuthenticationEvent({
            action: 'AUTH_ERROR',
            resource: request?.path || 'auth/unknown',
            request,
            user: userId ? { id: userId } : undefined,
            success: false,
            error: authError.message,
            metadata: {
                errorCode: authError.code,
                statusCode: authError.statusCode,
            },
        });
        this.logger.error(`Auth error: ${authError.code} - ${authError.message}`, {
            error: authError,
            path: request?.path,
            method: request?.method,
            userId,
        });
        return {
            success: false,
            error: {
                code: authError.code,
                message: authError.message,
                details: authError.details,
                timestamp: new Date().toISOString(),
                path: request?.path,
                method: request?.method,
            },
        };
    }
    normalizeError(error) {
        if ('code' in error && 'statusCode' in error) {
            return error;
        }
        // Map common errors to standardized codes
        const message = error.message.toLowerCase();
        if (message.includes('invalid credentials') || message.includes('wrong password')) {
            return {
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password',
                statusCode: common_1.HttpStatus.UNAUTHORIZED,
            };
        }
        if (message.includes('user not found') || message.includes('no user')) {
            return {
                code: 'USER_NOT_FOUND',
                message: 'User not found',
                statusCode: common_1.HttpStatus.NOT_FOUND,
            };
        }
        if (message.includes('email already exists') || message.includes('duplicate')) {
            return {
                code: 'EMAIL_ALREADY_EXISTS',
                message: 'Email address is already registered',
                statusCode: common_1.HttpStatus.CONFLICT,
            };
        }
        if (message.includes('token expired') || message.includes('jwt expired')) {
            return {
                code: 'TOKEN_EXPIRED',
                message: 'Authentication token has expired',
                statusCode: common_1.HttpStatus.UNAUTHORIZED,
            };
        }
        if (message.includes('invalid token') || message.includes('malformed token')) {
            return {
                code: 'INVALID_TOKEN',
                message: 'Invalid authentication token',
                statusCode: common_1.HttpStatus.UNAUTHORIZED,
            };
        }
        if (message.includes('rate limit') || message.includes('too many requests')) {
            return {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later',
                statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
            };
        }
        if (message.includes('mfa') || message.includes('two-factor')) {
            return {
                code: 'MFA_REQUIRED',
                message: 'Multi-factor authentication is required',
                statusCode: common_1.HttpStatus.FORBIDDEN,
            };
        }
        // Default error
        return {
            code: 'AUTH_ERROR',
            message: 'Authentication failed',
            statusCode: common_1.HttpStatus.UNAUTHORIZED,
        };
    }
    createError(code, message, statusCode = common_1.HttpStatus.BAD_REQUEST, details) {
        return {
            code,
            message,
            statusCode,
            details,
        };
    }
    throwError(code, message, statusCode, details) {
        const error = this.createError(code, message, statusCode, details);
        throw new common_1.HttpException({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details,
                timestamp: new Date().toISOString(),
            },
        }, error.statusCode);
    }
};
exports.AuthErrorHandlerService = AuthErrorHandlerService;
exports.AuthErrorHandlerService = AuthErrorHandlerService = AuthErrorHandlerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_integration_service_1.AuthAuditIntegrationService])
], AuthErrorHandlerService);
// Predefined error constants
exports.AuthErrors = {
    INVALID_CREDENTIALS: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        statusCode: common_1.HttpStatus.UNAUTHORIZED,
    },
    USER_NOT_FOUND: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        statusCode: common_1.HttpStatus.NOT_FOUND,
    },
    EMAIL_ALREADY_EXISTS: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email address is already registered',
        statusCode: common_1.HttpStatus.CONFLICT,
    },
    TOKEN_EXPIRED: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
        statusCode: common_1.HttpStatus.UNAUTHORIZED,
    },
    INVALID_TOKEN: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
        statusCode: common_1.HttpStatus.UNAUTHORIZED,
    },
    RATE_LIMIT_EXCEEDED: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later',
        statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
    },
    MFA_REQUIRED: {
        code: 'MFA_REQUIRED',
        message: 'Multi-factor authentication is required',
        statusCode: common_1.HttpStatus.FORBIDDEN,
    },
    INSUFFICIENT_PERMISSIONS: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Insufficient permissions to perform this action',
        statusCode: common_1.HttpStatus.FORBIDDEN,
    },
    ACCOUNT_LOCKED: {
        code: 'ACCOUNT_LOCKED',
        message: 'Account has been locked due to security concerns',
        statusCode: common_1.HttpStatus.FORBIDDEN,
    },
    PASSWORD_TOO_WEAK: {
        code: 'PASSWORD_TOO_WEAK',
        message: 'Password does not meet security requirements',
        statusCode: common_1.HttpStatus.BAD_REQUEST,
    },
    INVALID_MFA_CODE: {
        code: 'INVALID_MFA_CODE',
        message: 'Invalid multi-factor authentication code',
        statusCode: common_1.HttpStatus.UNAUTHORIZED,
    },
    BACKUP_CODE_USED: {
        code: 'BACKUP_CODE_USED',
        message: 'Backup code has already been used',
        statusCode: common_1.HttpStatus.BAD_REQUEST,
    },
};
//# sourceMappingURL=auth-error-handler.service.js.map