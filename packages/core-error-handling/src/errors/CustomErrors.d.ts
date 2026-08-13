/**
 * Custom Error Classes for Common Scenarios
 *
 * @description
 * Comprehensive error classes that extend the base Error class
 * with additional metadata and context for better error tracking
 * and handling across the application.
 */
import { BaseError, ErrorSeverity, ErrorCategory } from '../interfaces/IErrorHandling.js';
/**
 * Base application error with enhanced metadata
 */
export declare class ApplicationError extends Error implements BaseError {
    readonly code: number;
    readonly timestamp: Date;
    readonly correlationId?: string;
    readonly retryable: boolean;
    readonly severity: ErrorSeverity;
    readonly category: ErrorCategory;
    readonly metadata?: Record<string, any>;
    readonly originalError?: Error;
    constructor(message: string, code: number, severity?: ErrorSeverity, category?: ErrorCategory, retryable?: boolean, metadata?: Record<string, any>, originalError?: Error);
    /**
     * Convert error to JSON for logging/transmission
     */
    toJSON(): Record<string, any>;
}
/**
 * Network-related error
 */
export declare class NetworkError extends ApplicationError {
    readonly statusCode?: number;
    readonly endpoint?: string;
    readonly method?: string;
    constructor(message: string, code?: number, metadata?: Record<string, any> & {
        statusCode?: number;
        endpoint?: string;
        method?: string;
    }, originalError?: Error);
}
/**
 * Connection timeout error
 */
export declare class TimeoutError extends NetworkError {
    constructor(endpoint?: string, timeout?: number, originalError?: Error);
}
/**
 * Connection error
 */
export declare class ConnectionError extends NetworkError {
    constructor(endpoint?: string, originalError?: Error);
}
/**
 * HTTP error with status code
 */
export declare class HttpError extends NetworkError {
    constructor(statusCode: number, message?: string, endpoint?: string, method?: string, originalError?: Error);
}
/**
 * Authentication error
 */
export declare class AuthenticationError extends ApplicationError {
    constructor(message?: string, code?: number, metadata?: Record<string, any>, originalError?: Error);
}
/**
 * Token expired error
 */
export declare class TokenExpiredError extends AuthenticationError {
    constructor(originalError?: Error);
}
/**
 * Invalid credentials error
 */
export declare class InvalidCredentialsError extends AuthenticationError {
    constructor(originalError?: Error);
}
/**
 * Authorization error
 */
export declare class AuthorizationError extends ApplicationError {
    readonly requiredPermission?: string;
    readonly userRole?: string;
    constructor(message?: string, requiredPermission?: string, userRole?: string, originalError?: Error);
}
/**
 * Insufficient permissions error
 */
export declare class InsufficientPermissionsError extends AuthorizationError {
    constructor(requiredPermission: string, userRole?: string);
}
/**
 * Validation error
 */
export declare class ValidationError extends ApplicationError {
    readonly field?: string;
    readonly validationErrors?: Array<{
        field: string;
        message: string;
        value?: any;
    }>;
    constructor(message: string, field?: string, validationErrors?: Array<{
        field: string;
        message: string;
        value?: any;
    }>, originalError?: Error);
}
/**
 * Required field error
 */
export declare class RequiredFieldError extends ValidationError {
    constructor(field: string);
}
/**
 * Invalid format error
 */
export declare class InvalidFormatError extends ValidationError {
    constructor(field: string, expectedFormat: string, actualValue?: any);
}
/**
 * Out of range error
 */
export declare class OutOfRangeError extends ValidationError {
    constructor(field: string, min?: number, max?: number, actualValue?: any);
}
/**
 * Business logic error
 */
export declare class BusinessError extends ApplicationError {
    constructor(message: string, code?: number, severity?: ErrorSeverity, metadata?: Record<string, any>, originalError?: Error);
}
/**
 * Resource not found error
 */
export declare class NotFoundError extends BusinessError {
    readonly resourceType?: string;
    readonly resourceId?: string;
    constructor(resourceType?: string, resourceId?: string);
}
/**
 * Conflict error (e.g., duplicate resource)
 */
export declare class ConflictError extends BusinessError {
    constructor(message: string, metadata?: Record<string, any>);
}
/**
 * Resource already exists error
 */
export declare class DuplicateResourceError extends ConflictError {
    constructor(resourceType: string, identifier: string);
}
/**
 * Operation not allowed error
 */
export declare class OperationNotAllowedError extends BusinessError {
    constructor(operation: string, reason?: string);
}
/**
 * Rate limit exceeded error
 */
export declare class RateLimitError extends BusinessError {
    readonly retryAfter?: number;
    constructor(retryAfter?: number);
}
/**
 * System error
 */
export declare class SystemError extends ApplicationError {
    constructor(message: string, code?: number, severity?: ErrorSeverity, retryable?: boolean, metadata?: Record<string, any>, originalError?: Error);
}
/**
 * Database error
 */
export declare class DatabaseError extends SystemError {
    readonly query?: string;
    readonly operation?: string;
    constructor(message: string, operation?: string, query?: string, originalError?: Error);
}
/**
 * Configuration error
 */
export declare class ConfigurationError extends SystemError {
    readonly configKey?: string;
    constructor(message: string, configKey?: string, originalError?: Error);
}
/**
 * Service unavailable error
 */
export declare class ServiceUnavailableError extends SystemError {
    readonly serviceName?: string;
    constructor(serviceName?: string, originalError?: Error);
}
/**
 * External service error
 */
export declare class ExternalServiceError extends SystemError {
    readonly serviceName: string;
    readonly statusCode?: number;
    constructor(serviceName: string, message?: string, statusCode?: number, originalError?: Error);
}
/**
 * File system error
 */
export declare class FileSystemError extends SystemError {
    readonly path?: string;
    readonly operation?: string;
    constructor(message: string, path?: string, operation?: string, originalError?: Error);
}
/**
 * Third-party integration error
 */
export declare class IntegrationError extends ApplicationError {
    readonly provider: string;
    readonly operation?: string;
    constructor(provider: string, message?: string, operation?: string, originalError?: Error);
}
/**
 * API integration error
 */
export declare class ApiIntegrationError extends IntegrationError {
    readonly endpoint?: string;
    readonly statusCode?: number;
    constructor(provider: string, endpoint?: string, statusCode?: number, message?: string, originalError?: Error);
}
/**
 * Payment error
 */
export declare class PaymentError extends ApplicationError {
    readonly paymentMethod?: string;
    readonly transactionId?: string;
    readonly amount?: number;
    constructor(message: string, code?: number, metadata?: Record<string, any> & {
        paymentMethod?: string;
        transactionId?: string;
        amount?: number;
    }, originalError?: Error);
}
/**
 * Payment declined error
 */
export declare class PaymentDeclinedError extends PaymentError {
    constructor(reason?: string, metadata?: Record<string, any>);
}
/**
 * Insufficient funds error
 */
export declare class InsufficientFundsError extends PaymentError {
    constructor(required: number, available: number, metadata?: Record<string, any>);
}
export declare const ErrorCodes: {
    readonly NETWORK_ERROR: 1000;
    readonly TIMEOUT: 1001;
    readonly CONNECTION_ERROR: 1002;
    readonly AUTH_ERROR: 2000;
    readonly TOKEN_EXPIRED: 2001;
    readonly INVALID_CREDENTIALS: 2002;
    readonly AUTHORIZATION_ERROR: 2100;
    readonly VALIDATION_ERROR: 3000;
    readonly REQUIRED_FIELD: 3001;
    readonly INVALID_FORMAT: 3002;
    readonly OUT_OF_RANGE: 3003;
    readonly BUSINESS_ERROR: 4000;
    readonly NOT_FOUND: 4001;
    readonly CONFLICT: 4002;
    readonly DUPLICATE_RESOURCE: 4003;
    readonly OPERATION_NOT_ALLOWED: 4004;
    readonly RATE_LIMIT: 4005;
    readonly SYSTEM_ERROR: 5000;
    readonly DATABASE_ERROR: 5001;
    readonly CONFIGURATION_ERROR: 5002;
    readonly SERVICE_UNAVAILABLE: 5003;
    readonly EXTERNAL_SERVICE_ERROR: 5004;
    readonly FILE_SYSTEM_ERROR: 5005;
    readonly INTEGRATION_ERROR: 6000;
    readonly API_INTEGRATION_ERROR: 6001;
    readonly PAYMENT_ERROR: 7000;
    readonly PAYMENT_DECLINED: 7001;
    readonly INSUFFICIENT_FUNDS: 7002;
};
//# sourceMappingURL=CustomErrors.d.ts.map