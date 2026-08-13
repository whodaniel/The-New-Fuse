/**
 * Error Factory
 *
 * @description
 * Factory class for creating standardized errors across the application.
 * Provides convenient methods for creating errors with proper typing and metadata.
 */
import { ApplicationError, NetworkError, TimeoutError, ConnectionError, HttpError, AuthenticationError, TokenExpiredError, InvalidCredentialsError, AuthorizationError, InsufficientPermissionsError, ValidationError, RequiredFieldError, InvalidFormatError, OutOfRangeError, BusinessError, NotFoundError, ConflictError, DuplicateResourceError, OperationNotAllowedError, RateLimitError, SystemError, DatabaseError, ConfigurationError, ServiceUnavailableError, ExternalServiceError, FileSystemError, IntegrationError, ApiIntegrationError, PaymentError, PaymentDeclinedError, InsufficientFundsError } from '../errors/CustomErrors.js';
import { ErrorCategory, ErrorSeverity } from '../interfaces/IErrorHandling.js';
/**
 * Error Factory for creating standardized errors
 */
export declare class ErrorFactory {
    /**
     * Create a generic application error
     */
    static createApplicationError(message: string, code: number, severity?: ErrorSeverity, category?: ErrorCategory, retryable?: boolean, metadata?: Record<string, any>, originalError?: Error): ApplicationError;
    /**
     * Create from HTTP response
     */
    static fromHttpResponse(statusCode: number, responseData?: any, endpoint?: string, method?: string): ApplicationError;
    /**
     * Create from generic Error
     */
    static fromError(error: Error, context?: {
        component?: string;
        operation?: string;
        metadata?: Record<string, any>;
    }): ApplicationError;
    /**
     * Create network error
     */
    static network(message: string, endpoint?: string, method?: string, statusCode?: number): NetworkError;
    /**
     * Create timeout error
     */
    static timeout(endpoint?: string, timeout?: number): TimeoutError;
    /**
     * Create connection error
     */
    static connectionError(endpoint?: string): ConnectionError;
    /**
     * Create HTTP error
     */
    static http(statusCode: number, message?: string, endpoint?: string): HttpError;
    /**
     * Create authentication error
     */
    static authentication(message?: string): AuthenticationError;
    /**
     * Create token expired error
     */
    static tokenExpired(): TokenExpiredError;
    /**
     * Create invalid credentials error
     */
    static invalidCredentials(): InvalidCredentialsError;
    /**
     * Create authorization error
     */
    static authorization(message?: string, requiredPermission?: string, userRole?: string): AuthorizationError;
    /**
     * Create insufficient permissions error
     */
    static insufficientPermissions(requiredPermission: string, userRole?: string): InsufficientPermissionsError;
    /**
     * Create validation error
     */
    static validation(message: string, field?: string, errors?: Array<{
        field: string;
        message: string;
        value?: any;
    }>): ValidationError;
    /**
     * Create required field error
     */
    static requiredField(field: string): RequiredFieldError;
    /**
     * Create invalid format error
     */
    static invalidFormat(field: string, expectedFormat: string, actualValue?: any): InvalidFormatError;
    /**
     * Create out of range error
     */
    static outOfRange(field: string, min?: number, max?: number, actualValue?: any): OutOfRangeError;
    /**
     * Create business error
     */
    static business(message: string, code?: number, severity?: ErrorSeverity, metadata?: Record<string, any>): BusinessError;
    /**
     * Create not found error
     */
    static notFound(resourceType?: string, resourceId?: string): NotFoundError;
    /**
     * Create conflict error
     */
    static conflict(message: string, metadata?: Record<string, any>): ConflictError;
    /**
     * Create duplicate resource error
     */
    static duplicateResource(resourceType: string, identifier: string): DuplicateResourceError;
    /**
     * Create operation not allowed error
     */
    static operationNotAllowed(operation: string, reason?: string): OperationNotAllowedError;
    /**
     * Create rate limit error
     */
    static rateLimit(retryAfter?: number): RateLimitError;
    /**
     * Create system error
     */
    static system(message: string, code?: number, severity?: ErrorSeverity, retryable?: boolean, metadata?: Record<string, any>): SystemError;
    /**
     * Create database error
     */
    static database(message: string, operation?: string, query?: string, originalError?: Error): DatabaseError;
    /**
     * Create configuration error
     */
    static configuration(message: string, configKey?: string): ConfigurationError;
    /**
     * Create service unavailable error
     */
    static serviceUnavailable(serviceName?: string): ServiceUnavailableError;
    /**
     * Create external service error
     */
    static externalService(serviceName: string, message?: string, statusCode?: number, originalError?: Error): ExternalServiceError;
    /**
     * Create file system error
     */
    static fileSystem(message: string, path?: string, operation?: string, originalError?: Error): FileSystemError;
    /**
     * Create integration error
     */
    static integration(provider: string, message?: string, operation?: string, originalError?: Error): IntegrationError;
    /**
     * Create API integration error
     */
    static apiIntegration(provider: string, endpoint?: string, statusCode?: number, message?: string, originalError?: Error): ApiIntegrationError;
    /**
     * Create payment error
     */
    static payment(message: string, code?: number, metadata?: Record<string, any>): PaymentError;
    /**
     * Create payment declined error
     */
    static paymentDeclined(reason?: string, metadata?: Record<string, any>): PaymentDeclinedError;
    /**
     * Create insufficient funds error
     */
    static insufficientFunds(required: number, available: number, metadata?: Record<string, any>): InsufficientFundsError;
}
//# sourceMappingURL=ErrorFactory.d.ts.map