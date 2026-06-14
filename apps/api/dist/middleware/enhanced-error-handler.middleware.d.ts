import { ErrorRequestHandler } from 'express';
import { SecurityLoggingService } from '../security/security-logging.service';
export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        statusCode: number;
        timestamp: string;
        requestId?: string;
        details?: any;
    };
}
export declare class EnhancedErrorHandlerMiddleware {
    private securityLogging;
    private readonly logger;
    constructor(securityLogging: SecurityLoggingService);
    getHandler(): ErrorRequestHandler;
    /**
     * Create standardized error response
     */
    private createErrorResponse;
    /**
     * Handle validation errors
     */
    private handleValidationError;
    /**
     * Handle unauthorized errors
     */
    private handleUnauthorizedError;
    /**
     * Handle forbidden errors
     */
    private handleForbiddenError;
    /**
     * Handle not found errors
     */
    private handleNotFoundError;
    /**
     * Handle rate limit errors
     */
    private handleRateLimitError;
    /**
     * Handle bad request errors
     */
    private handleBadRequestError;
    /**
     * Handle server errors
     */
    private handleServerError;
    /**
     * Log error for monitoring and debugging
     */
    private logError;
    /**
     * Sanitize error details to avoid exposing sensitive information
     */
    private sanitizeErrorDetails;
}
//# sourceMappingURL=enhanced-error-handler.middleware.d.ts.map