/**
 * Custom Error Classes for Common Scenarios
 *
 * @description
 * Comprehensive error classes that extend the base Error class
 * with additional metadata and context for better error tracking
 * and handling across the application.
 */
import { ErrorSeverity, ErrorCategory } from '../interfaces/IErrorHandling.js';
/**
 * Base application error with enhanced metadata
 */
export class ApplicationError extends Error {
    constructor(message, code, severity = ErrorSeverity.MEDIUM, category = ErrorCategory.UNKNOWN, retryable = false, metadata, originalError) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.timestamp = new Date();
        this.severity = severity;
        this.category = category;
        this.retryable = retryable;
        this.metadata = metadata;
        this.originalError = originalError;
        // Maintain proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * Convert error to JSON for logging/transmission
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            timestamp: this.timestamp.toISOString(),
            correlationId: this.correlationId,
            severity: this.severity,
            category: this.category,
            retryable: this.retryable,
            metadata: this.metadata,
            stack: this.stack,
            originalError: this.originalError ? {
                message: this.originalError.message,
                stack: this.originalError.stack,
            } : undefined,
        };
    }
}
// ============================================================================
// Network Errors
// ============================================================================
/**
 * Network-related error
 */
export class NetworkError extends ApplicationError {
    constructor(message, code = 1000, metadata, originalError) {
        super(message, code, ErrorSeverity.HIGH, ErrorCategory.NETWORK, true, // Network errors are typically retryable
        metadata, originalError);
        this.statusCode = metadata?.statusCode;
        this.endpoint = metadata?.endpoint;
        this.method = metadata?.method;
    }
}
/**
 * Connection timeout error
 */
export class TimeoutError extends NetworkError {
    constructor(endpoint, timeout, originalError) {
        super(`Request timeout${endpoint ? ` for ${endpoint}` : ''}${timeout ? ` after ${timeout}ms` : ''}`, 1001, { endpoint, timeout }, originalError);
    }
}
/**
 * Connection error
 */
export class ConnectionError extends NetworkError {
    constructor(endpoint, originalError) {
        super(`Failed to connect${endpoint ? ` to ${endpoint}` : ''}`, 1002, { endpoint }, originalError);
    }
}
/**
 * HTTP error with status code
 */
export class HttpError extends NetworkError {
    constructor(statusCode, message, endpoint, method, originalError) {
        super(message || `HTTP ${statusCode} error${endpoint ? ` for ${endpoint}` : ''}`, 1000 + statusCode, { statusCode, endpoint, method }, originalError);
    }
}
// ============================================================================
// Authentication & Authorization Errors
// ============================================================================
/**
 * Authentication error
 */
export class AuthenticationError extends ApplicationError {
    constructor(message = 'Authentication failed', code = 2000, metadata, originalError) {
        super(message, code, ErrorSeverity.HIGH, ErrorCategory.AUTHENTICATION, false, // Auth errors typically require user action
        metadata, originalError);
    }
}
/**
 * Token expired error
 */
export class TokenExpiredError extends AuthenticationError {
    constructor(originalError) {
        super('Authentication token has expired', 2001, {}, originalError);
    }
}
/**
 * Invalid credentials error
 */
export class InvalidCredentialsError extends AuthenticationError {
    constructor(originalError) {
        super('Invalid username or password', 2002, {}, originalError);
    }
}
/**
 * Authorization error
 */
export class AuthorizationError extends ApplicationError {
    constructor(message = 'Access denied', requiredPermission, userRole, originalError) {
        super(message, 2100, ErrorSeverity.MEDIUM, ErrorCategory.AUTHORIZATION, false, { requiredPermission, userRole }, originalError);
        this.requiredPermission = requiredPermission;
        this.userRole = userRole;
    }
}
/**
 * Insufficient permissions error
 */
export class InsufficientPermissionsError extends AuthorizationError {
    constructor(requiredPermission, userRole) {
        super(`Insufficient permissions. Required: ${requiredPermission}`, requiredPermission, userRole);
    }
}
// ============================================================================
// Validation Errors
// ============================================================================
/**
 * Validation error
 */
export class ValidationError extends ApplicationError {
    constructor(message, field, validationErrors, originalError) {
        super(message, 3000, ErrorSeverity.LOW, ErrorCategory.VALIDATION, false, { field, validationErrors }, originalError);
        this.field = field;
        this.validationErrors = validationErrors;
    }
}
/**
 * Required field error
 */
export class RequiredFieldError extends ValidationError {
    constructor(field) {
        super(`Field '${field}' is required`, field);
        Object.defineProperty(this, 'code', { value: 3001, writable: false });
    }
}
/**
 * Invalid format error
 */
export class InvalidFormatError extends ValidationError {
    constructor(field, expectedFormat, actualValue) {
        super(`Field '${field}' has invalid format. Expected: ${expectedFormat}`, field, [{ field, message: `Expected format: ${expectedFormat}`, value: actualValue }]);
        Object.defineProperty(this, 'code', { value: 3002, writable: false });
    }
}
/**
 * Out of range error
 */
export class OutOfRangeError extends ValidationError {
    constructor(field, min, max, actualValue) {
        const rangeMsg = min !== undefined && max !== undefined
            ? `between ${min} and ${max}`
            : min !== undefined
                ? `at least ${min}`
                : max !== undefined
                    ? `at most ${max}`
                    : 'within valid range';
        super(`Field '${field}' must be ${rangeMsg}`, field, [{ field, message: rangeMsg, value: actualValue }]);
        Object.defineProperty(this, 'code', { value: 3003, writable: false });
    }
}
// ============================================================================
// Business Logic Errors
// ============================================================================
/**
 * Business logic error
 */
export class BusinessError extends ApplicationError {
    constructor(message, code = 4000, severity = ErrorSeverity.MEDIUM, metadata, originalError) {
        super(message, code, severity, ErrorCategory.BUSINESS, false, metadata, originalError);
    }
}
/**
 * Resource not found error
 */
export class NotFoundError extends BusinessError {
    constructor(resourceType, resourceId) {
        super(resourceType && resourceId
            ? `${resourceType} with ID '${resourceId}' not found`
            : resourceType
                ? `${resourceType} not found`
                : 'Resource not found', 4001, ErrorSeverity.LOW, { resourceType, resourceId });
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }
}
/**
 * Conflict error (e.g., duplicate resource)
 */
export class ConflictError extends BusinessError {
    constructor(message, metadata) {
        super(message, 4002, ErrorSeverity.MEDIUM, metadata);
    }
}
/**
 * Resource already exists error
 */
export class DuplicateResourceError extends ConflictError {
    constructor(resourceType, identifier) {
        super(`${resourceType} '${identifier}' already exists`, { resourceType, identifier });
        Object.defineProperty(this, 'code', { value: 4003, writable: false });
    }
}
/**
 * Operation not allowed error
 */
export class OperationNotAllowedError extends BusinessError {
    constructor(operation, reason) {
        super(`Operation '${operation}' is not allowed${reason ? `: ${reason}` : ''}`, 4004, ErrorSeverity.MEDIUM, { operation, reason });
    }
}
/**
 * Rate limit exceeded error
 */
export class RateLimitError extends BusinessError {
    constructor(retryAfter) {
        super(`Rate limit exceeded${retryAfter ? `. Retry after ${retryAfter} seconds` : ''}`, 4005, ErrorSeverity.LOW, { retryAfter });
        Object.defineProperty(this, 'retryable', { value: true, writable: false });
        this.retryAfter = retryAfter;
    }
}
// ============================================================================
// System Errors
// ============================================================================
/**
 * System error
 */
export class SystemError extends ApplicationError {
    constructor(message, code = 5000, severity = ErrorSeverity.CRITICAL, retryable = true, metadata, originalError) {
        super(message, code, severity, ErrorCategory.SYSTEM, retryable, metadata, originalError);
    }
}
/**
 * Database error
 */
export class DatabaseError extends SystemError {
    constructor(message, operation, query, originalError) {
        super(message, 5001, ErrorSeverity.CRITICAL, true, { operation, query }, originalError);
        this.query = query;
        this.operation = operation;
    }
}
/**
 * Configuration error
 */
export class ConfigurationError extends SystemError {
    constructor(message, configKey, originalError) {
        super(message, 5002, ErrorSeverity.CRITICAL, false, // Config errors typically need manual fix
        { configKey }, originalError);
        this.configKey = configKey;
    }
}
/**
 * Service unavailable error
 */
export class ServiceUnavailableError extends SystemError {
    constructor(serviceName, originalError) {
        super(serviceName ? `Service '${serviceName}' is unavailable` : 'Service unavailable', 5003, ErrorSeverity.HIGH, true, { serviceName }, originalError);
        this.serviceName = serviceName;
    }
}
/**
 * External service error
 */
export class ExternalServiceError extends SystemError {
    constructor(serviceName, message, statusCode, originalError) {
        super(message || `External service '${serviceName}' error`, 5004, ErrorSeverity.HIGH, true, { serviceName, statusCode }, originalError);
        this.serviceName = serviceName;
        this.statusCode = statusCode;
    }
}
/**
 * File system error
 */
export class FileSystemError extends SystemError {
    constructor(message, path, operation, originalError) {
        super(message, 5005, ErrorSeverity.HIGH, false, { path, operation }, originalError);
        this.path = path;
        this.operation = operation;
    }
}
// ============================================================================
// Integration Errors
// ============================================================================
/**
 * Third-party integration error
 */
export class IntegrationError extends ApplicationError {
    constructor(provider, message, operation, originalError) {
        super(message || `Integration error with ${provider}`, 6000, ErrorSeverity.HIGH, ErrorCategory.SYSTEM, true, { provider, operation }, originalError);
        this.provider = provider;
        this.operation = operation;
    }
}
/**
 * API integration error
 */
export class ApiIntegrationError extends IntegrationError {
    constructor(provider, endpoint, statusCode, message, originalError) {
        super(provider, message || `API integration error with ${provider}`, endpoint, originalError);
        Object.defineProperty(this, 'code', { value: 6001, writable: false });
        this.endpoint = endpoint;
        this.statusCode = statusCode;
    }
}
// ============================================================================
// Payment Errors
// ============================================================================
/**
 * Payment error
 */
export class PaymentError extends ApplicationError {
    constructor(message, code = 7000, metadata, originalError) {
        super(message, code, ErrorSeverity.CRITICAL, ErrorCategory.BUSINESS, false, metadata, originalError);
        this.paymentMethod = metadata?.paymentMethod;
        this.transactionId = metadata?.transactionId;
        this.amount = metadata?.amount;
    }
}
/**
 * Payment declined error
 */
export class PaymentDeclinedError extends PaymentError {
    constructor(reason, metadata) {
        super(`Payment declined${reason ? `: ${reason}` : ''}`, 7001, metadata);
    }
}
/**
 * Insufficient funds error
 */
export class InsufficientFundsError extends PaymentError {
    constructor(required, available, metadata) {
        super(`Insufficient funds. Required: ${required}, Available: ${available}`, 7002, { ...metadata, required, available });
    }
}
// ============================================================================
// Export all error classes
// ============================================================================
export const ErrorCodes = {
    // Network errors (1000-1999)
    NETWORK_ERROR: 1000,
    TIMEOUT: 1001,
    CONNECTION_ERROR: 1002,
    // Auth errors (2000-2999)
    AUTH_ERROR: 2000,
    TOKEN_EXPIRED: 2001,
    INVALID_CREDENTIALS: 2002,
    AUTHORIZATION_ERROR: 2100,
    // Validation errors (3000-3999)
    VALIDATION_ERROR: 3000,
    REQUIRED_FIELD: 3001,
    INVALID_FORMAT: 3002,
    OUT_OF_RANGE: 3003,
    // Business errors (4000-4999)
    BUSINESS_ERROR: 4000,
    NOT_FOUND: 4001,
    CONFLICT: 4002,
    DUPLICATE_RESOURCE: 4003,
    OPERATION_NOT_ALLOWED: 4004,
    RATE_LIMIT: 4005,
    // System errors (5000-5999)
    SYSTEM_ERROR: 5000,
    DATABASE_ERROR: 5001,
    CONFIGURATION_ERROR: 5002,
    SERVICE_UNAVAILABLE: 5003,
    EXTERNAL_SERVICE_ERROR: 5004,
    FILE_SYSTEM_ERROR: 5005,
    // Integration errors (6000-6999)
    INTEGRATION_ERROR: 6000,
    API_INTEGRATION_ERROR: 6001,
    // Payment errors (7000-7999)
    PAYMENT_ERROR: 7000,
    PAYMENT_DECLINED: 7001,
    INSUFFICIENT_FUNDS: 7002,
};
//# sourceMappingURL=CustomErrors.js.map