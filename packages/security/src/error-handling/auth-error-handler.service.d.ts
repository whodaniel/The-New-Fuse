import { HttpStatus } from '@nestjs/common';
import { AuthAuditIntegrationService } from '../audit-logging/audit-integration.service';
import { Request } from 'express';
export interface AuthError {
    code: string;
    message: string;
    statusCode: HttpStatus;
    details?: any;
}
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
        timestamp: string;
        path?: string;
        method?: string;
    };
}
export declare class AuthErrorHandlerService {
    private readonly auditService;
    private readonly logger;
    constructor(auditService: AuthAuditIntegrationService);
    handleAuthError(error: Error | AuthError, request?: Request, userId?: string): Promise<ErrorResponse>;
    private normalizeError;
    createError(code: string, message: string, statusCode?: HttpStatus, details?: any): AuthError;
    throwError(code: string, message: string, statusCode?: HttpStatus, details?: any): never;
}
export declare const AuthErrors: {
    readonly INVALID_CREDENTIALS: {
        readonly code: "INVALID_CREDENTIALS";
        readonly message: "Invalid email or password";
        readonly statusCode: HttpStatus.UNAUTHORIZED;
    };
    readonly USER_NOT_FOUND: {
        readonly code: "USER_NOT_FOUND";
        readonly message: "User not found";
        readonly statusCode: HttpStatus.NOT_FOUND;
    };
    readonly EMAIL_ALREADY_EXISTS: {
        readonly code: "EMAIL_ALREADY_EXISTS";
        readonly message: "Email address is already registered";
        readonly statusCode: HttpStatus.CONFLICT;
    };
    readonly TOKEN_EXPIRED: {
        readonly code: "TOKEN_EXPIRED";
        readonly message: "Authentication token has expired";
        readonly statusCode: HttpStatus.UNAUTHORIZED;
    };
    readonly INVALID_TOKEN: {
        readonly code: "INVALID_TOKEN";
        readonly message: "Invalid authentication token";
        readonly statusCode: HttpStatus.UNAUTHORIZED;
    };
    readonly RATE_LIMIT_EXCEEDED: {
        readonly code: "RATE_LIMIT_EXCEEDED";
        readonly message: "Too many requests. Please try again later";
        readonly statusCode: HttpStatus.TOO_MANY_REQUESTS;
    };
    readonly MFA_REQUIRED: {
        readonly code: "MFA_REQUIRED";
        readonly message: "Multi-factor authentication is required";
        readonly statusCode: HttpStatus.FORBIDDEN;
    };
    readonly INSUFFICIENT_PERMISSIONS: {
        readonly code: "INSUFFICIENT_PERMISSIONS";
        readonly message: "Insufficient permissions to perform this action";
        readonly statusCode: HttpStatus.FORBIDDEN;
    };
    readonly ACCOUNT_LOCKED: {
        readonly code: "ACCOUNT_LOCKED";
        readonly message: "Account has been locked due to security concerns";
        readonly statusCode: HttpStatus.FORBIDDEN;
    };
    readonly PASSWORD_TOO_WEAK: {
        readonly code: "PASSWORD_TOO_WEAK";
        readonly message: "Password does not meet security requirements";
        readonly statusCode: HttpStatus.BAD_REQUEST;
    };
    readonly INVALID_MFA_CODE: {
        readonly code: "INVALID_MFA_CODE";
        readonly message: "Invalid multi-factor authentication code";
        readonly statusCode: HttpStatus.UNAUTHORIZED;
    };
    readonly BACKUP_CODE_USED: {
        readonly code: "BACKUP_CODE_USED";
        readonly message: "Backup code has already been used";
        readonly statusCode: HttpStatus.BAD_REQUEST;
    };
};
//# sourceMappingURL=auth-error-handler.service.d.ts.map