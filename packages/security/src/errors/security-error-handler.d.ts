import { HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuditLoggerService } from '../audit-logging/audit-logger.service';
export interface SecurityErrorResponse {
    statusCode: number;
    message: string;
    error: string;
    timestamp: string;
    path: string;
    requestId?: string;
    details?: any;
}
export declare class SecurityError extends HttpException {
    errorCode?: string | undefined;
    details?: any | undefined;
    constructor(message: string, statusCode: HttpStatus, errorCode?: string | undefined, details?: any | undefined);
}
export declare class AuthenticationError extends SecurityError {
    constructor(message?: string, details?: any);
}
export declare class AuthorizationError extends SecurityError {
    constructor(message?: string, details?: any);
}
export declare class RateLimitError extends SecurityError {
    constructor(message?: string, details?: any);
}
export declare class TokenError extends SecurityError {
    constructor(message?: string, details?: any);
}
export declare class ValidationError extends SecurityError {
    constructor(message?: string, details?: any);
}
export declare class SecurityErrorHandler {
    private readonly auditService?;
    private readonly logger;
    constructor(auditService?: AuditLoggerService | undefined);
    handleError(error: Error, req: Request, res: Response): void;
    createExceptionFilter(): (error: Error, req: Request, res: Response, next: Function) => void;
}
export declare const createSecurityErrorHandler: (auditService?: AuditLoggerService) => SecurityErrorHandler;
export declare const securityErrorMiddleware: (auditService?: AuditLoggerService) => (error: Error, req: Request, res: Response, next: Function) => void;
//# sourceMappingURL=security-error-handler.d.ts.map