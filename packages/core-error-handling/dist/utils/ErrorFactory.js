/**
 * Error Factory
 *
 * @description
 * Factory class for creating standardized errors across the application.
 * Provides convenient methods for creating errors with proper typing and metadata.
 */
import { ApplicationError, NetworkError, TimeoutError, ConnectionError, HttpError, AuthenticationError, TokenExpiredError, InvalidCredentialsError, AuthorizationError, InsufficientPermissionsError, ValidationError, RequiredFieldError, InvalidFormatError, OutOfRangeError, BusinessError, NotFoundError, ConflictError, DuplicateResourceError, OperationNotAllowedError, RateLimitError, SystemError, DatabaseError, ConfigurationError, ServiceUnavailableError, ExternalServiceError, FileSystemError, IntegrationError, ApiIntegrationError, PaymentError, PaymentDeclinedError, InsufficientFundsError, } from '../errors/CustomErrors.js';
import { ErrorCategory, ErrorSeverity } from '../interfaces/IErrorHandling.js';
/**
 * Error Factory for creating standardized errors
 */
export class ErrorFactory {
    /**
     * Create a generic application error
     */
    static createApplicationError(message, code, severity = ErrorSeverity.MEDIUM, category = ErrorCategory.UNKNOWN, retryable = false, metadata, originalError) {
        return new ApplicationError(message, code, severity, category, retryable, metadata, originalError);
    }
    /**
     * Create from HTTP response
     */
    static fromHttpResponse(statusCode, responseData, endpoint, method) {
        const message = responseData?.message || responseData?.error || `HTTP ${statusCode} error`;
        switch (statusCode) {
            case 400:
                return new ValidationError(message, undefined, responseData?.errors);
            case 401:
                return new AuthenticationError(message);
            case 403:
                return new AuthorizationError(message);
            case 404:
                return new NotFoundError(responseData?.resourceType, responseData?.resourceId);
            case 409:
                return new ConflictError(message, responseData);
            case 429:
                return new RateLimitError(responseData?.retryAfter);
            case 500:
            case 502:
            case 503:
                return new SystemError(message, statusCode);
            default:
                return new HttpError(statusCode, message, endpoint, method);
        }
    }
    /**
     * Create from generic Error
     */
    static fromError(error, context) {
        // If already an ApplicationError, return it
        if (error instanceof ApplicationError) {
            return error;
        }
        // Check error name/type for common error patterns
        const errorName = error.name?.toLowerCase() || '';
        const errorMessage = error.message?.toLowerCase() || '';
        // Network errors
        if (errorName.includes('network') ||
            errorMessage.includes('network') ||
            errorMessage.includes('fetch')) {
            return new NetworkError(error.message, 1000, context?.metadata, error);
        }
        // Timeout errors
        if (errorName.includes('timeout') || errorMessage.includes('timeout')) {
            return new TimeoutError(context?.metadata?.endpoint, context?.metadata?.timeout, error);
        }
        // Auth errors
        if (errorName.includes('auth') || errorMessage.includes('auth')) {
            return new AuthenticationError(error.message, 2000, context?.metadata, error);
        }
        // Validation errors
        if (errorName.includes('validation') || errorMessage.includes('validation')) {
            return new ValidationError(error.message, undefined, undefined, error);
        }
        // Database errors
        if (errorName.includes('database') || errorName.includes('sql')) {
            return new DatabaseError(error.message, context?.operation, undefined, error);
        }
        // Default to generic system error
        return new SystemError(error.message, 5000, ErrorSeverity.HIGH, true, {
            ...context?.metadata,
            originalErrorName: error.name,
            component: context?.component,
            operation: context?.operation,
        }, error);
    }
    /**
     * Create network error
     */
    static network(message, endpoint, method, statusCode) {
        return new NetworkError(message, 1000, { endpoint, method, statusCode });
    }
    /**
     * Create timeout error
     */
    static timeout(endpoint, timeout) {
        return new TimeoutError(endpoint, timeout);
    }
    /**
     * Create connection error
     */
    static connectionError(endpoint) {
        return new ConnectionError(endpoint);
    }
    /**
     * Create HTTP error
     */
    static http(statusCode, message, endpoint) {
        return new HttpError(statusCode, message, endpoint);
    }
    /**
     * Create authentication error
     */
    static authentication(message) {
        return new AuthenticationError(message);
    }
    /**
     * Create token expired error
     */
    static tokenExpired() {
        return new TokenExpiredError();
    }
    /**
     * Create invalid credentials error
     */
    static invalidCredentials() {
        return new InvalidCredentialsError();
    }
    /**
     * Create authorization error
     */
    static authorization(message, requiredPermission, userRole) {
        return new AuthorizationError(message, requiredPermission, userRole);
    }
    /**
     * Create insufficient permissions error
     */
    static insufficientPermissions(requiredPermission, userRole) {
        return new InsufficientPermissionsError(requiredPermission, userRole);
    }
    /**
     * Create validation error
     */
    static validation(message, field, errors) {
        return new ValidationError(message, field, errors);
    }
    /**
     * Create required field error
     */
    static requiredField(field) {
        return new RequiredFieldError(field);
    }
    /**
     * Create invalid format error
     */
    static invalidFormat(field, expectedFormat, actualValue) {
        return new InvalidFormatError(field, expectedFormat, actualValue);
    }
    /**
     * Create out of range error
     */
    static outOfRange(field, min, max, actualValue) {
        return new OutOfRangeError(field, min, max, actualValue);
    }
    /**
     * Create business error
     */
    static business(message, code, severity, metadata) {
        return new BusinessError(message, code, severity, metadata);
    }
    /**
     * Create not found error
     */
    static notFound(resourceType, resourceId) {
        return new NotFoundError(resourceType, resourceId);
    }
    /**
     * Create conflict error
     */
    static conflict(message, metadata) {
        return new ConflictError(message, metadata);
    }
    /**
     * Create duplicate resource error
     */
    static duplicateResource(resourceType, identifier) {
        return new DuplicateResourceError(resourceType, identifier);
    }
    /**
     * Create operation not allowed error
     */
    static operationNotAllowed(operation, reason) {
        return new OperationNotAllowedError(operation, reason);
    }
    /**
     * Create rate limit error
     */
    static rateLimit(retryAfter) {
        return new RateLimitError(retryAfter);
    }
    /**
     * Create system error
     */
    static system(message, code, severity, retryable, metadata) {
        return new SystemError(message, code, severity, retryable, metadata);
    }
    /**
     * Create database error
     */
    static database(message, operation, query, originalError) {
        return new DatabaseError(message, operation, query, originalError);
    }
    /**
     * Create configuration error
     */
    static configuration(message, configKey) {
        return new ConfigurationError(message, configKey);
    }
    /**
     * Create service unavailable error
     */
    static serviceUnavailable(serviceName) {
        return new ServiceUnavailableError(serviceName);
    }
    /**
     * Create external service error
     */
    static externalService(serviceName, message, statusCode, originalError) {
        return new ExternalServiceError(serviceName, message, statusCode, originalError);
    }
    /**
     * Create file system error
     */
    static fileSystem(message, path, operation, originalError) {
        return new FileSystemError(message, path, operation, originalError);
    }
    /**
     * Create integration error
     */
    static integration(provider, message, operation, originalError) {
        return new IntegrationError(provider, message, operation, originalError);
    }
    /**
     * Create API integration error
     */
    static apiIntegration(provider, endpoint, statusCode, message, originalError) {
        return new ApiIntegrationError(provider, endpoint, statusCode, message, originalError);
    }
    /**
     * Create payment error
     */
    static payment(message, code, metadata) {
        return new PaymentError(message, code, metadata);
    }
    /**
     * Create payment declined error
     */
    static paymentDeclined(reason, metadata) {
        return new PaymentDeclinedError(reason, metadata);
    }
    /**
     * Create insufficient funds error
     */
    static insufficientFunds(required, available, metadata) {
        return new InsufficientFundsError(required, available, metadata);
    }
}
//# sourceMappingURL=ErrorFactory.js.map