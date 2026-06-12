'use strict';
/**
 * Error Factory
 *
 * @description
 * Factory class for creating standardized errors across the application.
 * Provides convenient methods for creating errors with proper typing and metadata.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ErrorFactory = void 0;
const CustomErrors_js_1 = require('../errors/CustomErrors.js');
const IErrorHandling_js_1 = require('../interfaces/IErrorHandling.js');
/**
 * Error Factory for creating standardized errors
 */
class ErrorFactory {
  /**
   * Create a generic application error
   */
  static createApplicationError(
    message,
    code,
    severity = IErrorHandling_js_1.ErrorSeverity.MEDIUM,
    category = IErrorHandling_js_1.ErrorCategory.UNKNOWN,
    retryable = false,
    metadata,
    originalError
  ) {
    return new CustomErrors_js_1.ApplicationError(
      message,
      code,
      severity,
      category,
      retryable,
      metadata,
      originalError
    );
  }
  /**
   * Create from HTTP response
   */
  static fromHttpResponse(statusCode, responseData, endpoint, method) {
    const message = responseData?.message || responseData?.error || `HTTP ${statusCode} error`;
    switch (statusCode) {
      case 400:
        return new CustomErrors_js_1.ValidationError(message, undefined, responseData?.errors);
      case 401:
        return new CustomErrors_js_1.AuthenticationError(message);
      case 403:
        return new CustomErrors_js_1.AuthorizationError(message);
      case 404:
        return new CustomErrors_js_1.NotFoundError(
          responseData?.resourceType,
          responseData?.resourceId
        );
      case 409:
        return new CustomErrors_js_1.ConflictError(message, responseData);
      case 429:
        return new CustomErrors_js_1.RateLimitError(responseData?.retryAfter);
      case 500:
      case 502:
      case 503:
        return new CustomErrors_js_1.SystemError(message, statusCode);
      default:
        return new CustomErrors_js_1.HttpError(statusCode, message, endpoint, method);
    }
  }
  /**
   * Create from generic Error
   */
  static fromError(error, context) {
    // If already an ApplicationError, return it
    if (error instanceof CustomErrors_js_1.ApplicationError) {
      return error;
    }
    // Check error name/type for common error patterns
    const errorName = error.name?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';
    // Network errors
    if (
      errorName.includes('network') ||
      errorMessage.includes('network') ||
      errorMessage.includes('fetch')
    ) {
      return new CustomErrors_js_1.NetworkError(error.message, 1000, context?.metadata, error);
    }
    // Timeout errors
    if (errorName.includes('timeout') || errorMessage.includes('timeout')) {
      return new CustomErrors_js_1.TimeoutError(
        context?.metadata?.endpoint,
        context?.metadata?.timeout,
        error
      );
    }
    // Auth errors
    if (errorName.includes('auth') || errorMessage.includes('auth')) {
      return new CustomErrors_js_1.AuthenticationError(
        error.message,
        2000,
        context?.metadata,
        error
      );
    }
    // Validation errors
    if (errorName.includes('validation') || errorMessage.includes('validation')) {
      return new CustomErrors_js_1.ValidationError(error.message, undefined, undefined, error);
    }
    // Database errors
    if (errorName.includes('database') || errorName.includes('sql')) {
      return new CustomErrors_js_1.DatabaseError(
        error.message,
        context?.operation,
        undefined,
        error
      );
    }
    // Default to generic system error
    return new CustomErrors_js_1.SystemError(
      error.message,
      5000,
      IErrorHandling_js_1.ErrorSeverity.HIGH,
      true,
      {
        ...context?.metadata,
        originalErrorName: error.name,
        component: context?.component,
        operation: context?.operation,
      },
      error
    );
  }
  /**
   * Create network error
   */
  static network(message, endpoint, method, statusCode) {
    return new CustomErrors_js_1.NetworkError(message, 1000, { endpoint, method, statusCode });
  }
  /**
   * Create timeout error
   */
  static timeout(endpoint, timeout) {
    return new CustomErrors_js_1.TimeoutError(endpoint, timeout);
  }
  /**
   * Create connection error
   */
  static connectionError(endpoint) {
    return new CustomErrors_js_1.ConnectionError(endpoint);
  }
  /**
   * Create HTTP error
   */
  static http(statusCode, message, endpoint) {
    return new CustomErrors_js_1.HttpError(statusCode, message, endpoint);
  }
  /**
   * Create authentication error
   */
  static authentication(message) {
    return new CustomErrors_js_1.AuthenticationError(message);
  }
  /**
   * Create token expired error
   */
  static tokenExpired() {
    return new CustomErrors_js_1.TokenExpiredError();
  }
  /**
   * Create invalid credentials error
   */
  static invalidCredentials() {
    return new CustomErrors_js_1.InvalidCredentialsError();
  }
  /**
   * Create authorization error
   */
  static authorization(message, requiredPermission, userRole) {
    return new CustomErrors_js_1.AuthorizationError(message, requiredPermission, userRole);
  }
  /**
   * Create insufficient permissions error
   */
  static insufficientPermissions(requiredPermission, userRole) {
    return new CustomErrors_js_1.InsufficientPermissionsError(requiredPermission, userRole);
  }
  /**
   * Create validation error
   */
  static validation(message, field, errors) {
    return new CustomErrors_js_1.ValidationError(message, field, errors);
  }
  /**
   * Create required field error
   */
  static requiredField(field) {
    return new CustomErrors_js_1.RequiredFieldError(field);
  }
  /**
   * Create invalid format error
   */
  static invalidFormat(field, expectedFormat, actualValue) {
    return new CustomErrors_js_1.InvalidFormatError(field, expectedFormat, actualValue);
  }
  /**
   * Create out of range error
   */
  static outOfRange(field, min, max, actualValue) {
    return new CustomErrors_js_1.OutOfRangeError(field, min, max, actualValue);
  }
  /**
   * Create business error
   */
  static business(message, code, severity, metadata) {
    return new CustomErrors_js_1.BusinessError(message, code, severity, metadata);
  }
  /**
   * Create not found error
   */
  static notFound(resourceType, resourceId) {
    return new CustomErrors_js_1.NotFoundError(resourceType, resourceId);
  }
  /**
   * Create conflict error
   */
  static conflict(message, metadata) {
    return new CustomErrors_js_1.ConflictError(message, metadata);
  }
  /**
   * Create duplicate resource error
   */
  static duplicateResource(resourceType, identifier) {
    return new CustomErrors_js_1.DuplicateResourceError(resourceType, identifier);
  }
  /**
   * Create operation not allowed error
   */
  static operationNotAllowed(operation, reason) {
    return new CustomErrors_js_1.OperationNotAllowedError(operation, reason);
  }
  /**
   * Create rate limit error
   */
  static rateLimit(retryAfter) {
    return new CustomErrors_js_1.RateLimitError(retryAfter);
  }
  /**
   * Create system error
   */
  static system(message, code, severity, retryable, metadata) {
    return new CustomErrors_js_1.SystemError(message, code, severity, retryable, metadata);
  }
  /**
   * Create database error
   */
  static database(message, operation, query, originalError) {
    return new CustomErrors_js_1.DatabaseError(message, operation, query, originalError);
  }
  /**
   * Create configuration error
   */
  static configuration(message, configKey) {
    return new CustomErrors_js_1.ConfigurationError(message, configKey);
  }
  /**
   * Create service unavailable error
   */
  static serviceUnavailable(serviceName) {
    return new CustomErrors_js_1.ServiceUnavailableError(serviceName);
  }
  /**
   * Create external service error
   */
  static externalService(serviceName, message, statusCode, originalError) {
    return new CustomErrors_js_1.ExternalServiceError(
      serviceName,
      message,
      statusCode,
      originalError
    );
  }
  /**
   * Create file system error
   */
  static fileSystem(message, path, operation, originalError) {
    return new CustomErrors_js_1.FileSystemError(message, path, operation, originalError);
  }
  /**
   * Create integration error
   */
  static integration(provider, message, operation, originalError) {
    return new CustomErrors_js_1.IntegrationError(provider, message, operation, originalError);
  }
  /**
   * Create API integration error
   */
  static apiIntegration(provider, endpoint, statusCode, message, originalError) {
    return new CustomErrors_js_1.ApiIntegrationError(
      provider,
      endpoint,
      statusCode,
      message,
      originalError
    );
  }
  /**
   * Create payment error
   */
  static payment(message, code, metadata) {
    return new CustomErrors_js_1.PaymentError(message, code, metadata);
  }
  /**
   * Create payment declined error
   */
  static paymentDeclined(reason, metadata) {
    return new CustomErrors_js_1.PaymentDeclinedError(reason, metadata);
  }
  /**
   * Create insufficient funds error
   */
  static insufficientFunds(required, available, metadata) {
    return new CustomErrors_js_1.InsufficientFundsError(required, available, metadata);
  }
}
exports.ErrorFactory = ErrorFactory;
//# sourceMappingURL=ErrorFactory.js.map
