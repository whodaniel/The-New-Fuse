'use strict';
/**
 * Custom Error Classes for Common Scenarios
 *
 * @description
 * Comprehensive error classes that extend the base Error class
 * with additional metadata and context for better error tracking
 * and handling across the application.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ErrorCodes =
  exports.InsufficientFundsError =
  exports.PaymentDeclinedError =
  exports.PaymentError =
  exports.ApiIntegrationError =
  exports.IntegrationError =
  exports.FileSystemError =
  exports.ExternalServiceError =
  exports.ServiceUnavailableError =
  exports.ConfigurationError =
  exports.DatabaseError =
  exports.SystemError =
  exports.RateLimitError =
  exports.OperationNotAllowedError =
  exports.DuplicateResourceError =
  exports.ConflictError =
  exports.NotFoundError =
  exports.BusinessError =
  exports.OutOfRangeError =
  exports.InvalidFormatError =
  exports.RequiredFieldError =
  exports.ValidationError =
  exports.InsufficientPermissionsError =
  exports.AuthorizationError =
  exports.InvalidCredentialsError =
  exports.TokenExpiredError =
  exports.AuthenticationError =
  exports.HttpError =
  exports.ConnectionError =
  exports.TimeoutError =
  exports.NetworkError =
  exports.ApplicationError =
    void 0;
const IErrorHandling_js_1 = require('../interfaces/IErrorHandling.js');
/**
 * Base application error with enhanced metadata
 */
class ApplicationError extends Error {
  code;
  timestamp;
  correlationId;
  retryable;
  severity;
  category;
  metadata;
  originalError;
  constructor(
    message,
    code,
    severity = IErrorHandling_js_1.ErrorSeverity.MEDIUM,
    category = IErrorHandling_js_1.ErrorCategory.UNKNOWN,
    retryable = false,
    metadata,
    originalError
  ) {
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
      originalError: this.originalError
        ? {
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : undefined,
    };
  }
}
exports.ApplicationError = ApplicationError;
// ============================================================================
// Network Errors
// ============================================================================
/**
 * Network-related error
 */
class NetworkError extends ApplicationError {
  statusCode;
  endpoint;
  method;
  constructor(message, code = 1000, metadata, originalError) {
    super(
      message,
      code,
      IErrorHandling_js_1.ErrorSeverity.HIGH,
      IErrorHandling_js_1.ErrorCategory.NETWORK,
      true, // Network errors are typically retryable
      metadata,
      originalError
    );
    this.statusCode = metadata?.statusCode;
    this.endpoint = metadata?.endpoint;
    this.method = metadata?.method;
  }
}
exports.NetworkError = NetworkError;
/**
 * Connection timeout error
 */
class TimeoutError extends NetworkError {
  constructor(endpoint, timeout, originalError) {
    super(
      `Request timeout${endpoint ? ` for ${endpoint}` : ''}${timeout ? ` after ${timeout}ms` : ''}`,
      1001,
      { endpoint, timeout },
      originalError
    );
  }
}
exports.TimeoutError = TimeoutError;
/**
 * Connection error
 */
class ConnectionError extends NetworkError {
  constructor(endpoint, originalError) {
    super(
      `Failed to connect${endpoint ? ` to ${endpoint}` : ''}`,
      1002,
      { endpoint },
      originalError
    );
  }
}
exports.ConnectionError = ConnectionError;
/**
 * HTTP error with status code
 */
class HttpError extends NetworkError {
  constructor(statusCode, message, endpoint, method, originalError) {
    super(
      message || `HTTP ${statusCode} error${endpoint ? ` for ${endpoint}` : ''}`,
      1000 + statusCode,
      { statusCode, endpoint, method },
      originalError
    );
  }
}
exports.HttpError = HttpError;
// ============================================================================
// Authentication & Authorization Errors
// ============================================================================
/**
 * Authentication error
 */
class AuthenticationError extends ApplicationError {
  constructor(message = 'Authentication failed', code = 2000, metadata, originalError) {
    super(
      message,
      code,
      IErrorHandling_js_1.ErrorSeverity.HIGH,
      IErrorHandling_js_1.ErrorCategory.AUTHENTICATION,
      false, // Auth errors typically require user action
      metadata,
      originalError
    );
  }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Token expired error
 */
class TokenExpiredError extends AuthenticationError {
  constructor(originalError) {
    super('Authentication token has expired', 2001, {}, originalError);
  }
}
exports.TokenExpiredError = TokenExpiredError;
/**
 * Invalid credentials error
 */
class InvalidCredentialsError extends AuthenticationError {
  constructor(originalError) {
    super('Invalid username or password', 2002, {}, originalError);
  }
}
exports.InvalidCredentialsError = InvalidCredentialsError;
/**
 * Authorization error
 */
class AuthorizationError extends ApplicationError {
  requiredPermission;
  userRole;
  constructor(message = 'Access denied', requiredPermission, userRole, originalError) {
    super(
      message,
      2100,
      IErrorHandling_js_1.ErrorSeverity.MEDIUM,
      IErrorHandling_js_1.ErrorCategory.AUTHORIZATION,
      false,
      { requiredPermission, userRole },
      originalError
    );
    this.requiredPermission = requiredPermission;
    this.userRole = userRole;
  }
}
exports.AuthorizationError = AuthorizationError;
/**
 * Insufficient permissions error
 */
class InsufficientPermissionsError extends AuthorizationError {
  constructor(requiredPermission, userRole) {
    super(
      `Insufficient permissions. Required: ${requiredPermission}`,
      requiredPermission,
      userRole
    );
  }
}
exports.InsufficientPermissionsError = InsufficientPermissionsError;
// ============================================================================
// Validation Errors
// ============================================================================
/**
 * Validation error
 */
class ValidationError extends ApplicationError {
  field;
  validationErrors;
  constructor(message, field, validationErrors, originalError) {
    super(
      message,
      3000,
      IErrorHandling_js_1.ErrorSeverity.LOW,
      IErrorHandling_js_1.ErrorCategory.VALIDATION,
      false,
      { field, validationErrors },
      originalError
    );
    this.field = field;
    this.validationErrors = validationErrors;
  }
}
exports.ValidationError = ValidationError;
/**
 * Required field error
 */
class RequiredFieldError extends ValidationError {
  constructor(field) {
    super(`Field '${field}' is required`, field);
    Object.defineProperty(this, 'code', { value: 3001, writable: false });
  }
}
exports.RequiredFieldError = RequiredFieldError;
/**
 * Invalid format error
 */
class InvalidFormatError extends ValidationError {
  constructor(field, expectedFormat, actualValue) {
    super(`Field '${field}' has invalid format. Expected: ${expectedFormat}`, field, [
      { field, message: `Expected format: ${expectedFormat}`, value: actualValue },
    ]);
    Object.defineProperty(this, 'code', { value: 3002, writable: false });
  }
}
exports.InvalidFormatError = InvalidFormatError;
/**
 * Out of range error
 */
class OutOfRangeError extends ValidationError {
  constructor(field, min, max, actualValue) {
    const rangeMsg =
      min !== undefined && max !== undefined
        ? `between ${min} and ${max}`
        : min !== undefined
          ? `at least ${min}`
          : max !== undefined
            ? `at most ${max}`
            : 'within valid range';
    super(`Field '${field}' must be ${rangeMsg}`, field, [
      { field, message: rangeMsg, value: actualValue },
    ]);
    Object.defineProperty(this, 'code', { value: 3003, writable: false });
  }
}
exports.OutOfRangeError = OutOfRangeError;
// ============================================================================
// Business Logic Errors
// ============================================================================
/**
 * Business logic error
 */
class BusinessError extends ApplicationError {
  constructor(
    message,
    code = 4000,
    severity = IErrorHandling_js_1.ErrorSeverity.MEDIUM,
    metadata,
    originalError
  ) {
    super(
      message,
      code,
      severity,
      IErrorHandling_js_1.ErrorCategory.BUSINESS,
      false,
      metadata,
      originalError
    );
  }
}
exports.BusinessError = BusinessError;
/**
 * Resource not found error
 */
class NotFoundError extends BusinessError {
  resourceType;
  resourceId;
  constructor(resourceType, resourceId) {
    super(
      resourceType && resourceId
        ? `${resourceType} with ID '${resourceId}' not found`
        : resourceType
          ? `${resourceType} not found`
          : 'Resource not found',
      4001,
      IErrorHandling_js_1.ErrorSeverity.LOW,
      { resourceType, resourceId }
    );
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}
exports.NotFoundError = NotFoundError;
/**
 * Conflict error (e.g., duplicate resource)
 */
class ConflictError extends BusinessError {
  constructor(message, metadata) {
    super(message, 4002, IErrorHandling_js_1.ErrorSeverity.MEDIUM, metadata);
  }
}
exports.ConflictError = ConflictError;
/**
 * Resource already exists error
 */
class DuplicateResourceError extends ConflictError {
  constructor(resourceType, identifier) {
    super(`${resourceType} '${identifier}' already exists`, { resourceType, identifier });
    Object.defineProperty(this, 'code', { value: 4003, writable: false });
  }
}
exports.DuplicateResourceError = DuplicateResourceError;
/**
 * Operation not allowed error
 */
class OperationNotAllowedError extends BusinessError {
  constructor(operation, reason) {
    super(
      `Operation '${operation}' is not allowed${reason ? `: ${reason}` : ''}`,
      4004,
      IErrorHandling_js_1.ErrorSeverity.MEDIUM,
      { operation, reason }
    );
  }
}
exports.OperationNotAllowedError = OperationNotAllowedError;
/**
 * Rate limit exceeded error
 */
class RateLimitError extends BusinessError {
  retryAfter;
  constructor(retryAfter) {
    super(
      `Rate limit exceeded${retryAfter ? `. Retry after ${retryAfter} seconds` : ''}`,
      4005,
      IErrorHandling_js_1.ErrorSeverity.LOW,
      { retryAfter }
    );
    Object.defineProperty(this, 'retryable', { value: true, writable: false });
    this.retryAfter = retryAfter;
  }
}
exports.RateLimitError = RateLimitError;
// ============================================================================
// System Errors
// ============================================================================
/**
 * System error
 */
class SystemError extends ApplicationError {
  constructor(
    message,
    code = 5000,
    severity = IErrorHandling_js_1.ErrorSeverity.CRITICAL,
    retryable = true,
    metadata,
    originalError
  ) {
    super(
      message,
      code,
      severity,
      IErrorHandling_js_1.ErrorCategory.SYSTEM,
      retryable,
      metadata,
      originalError
    );
  }
}
exports.SystemError = SystemError;
/**
 * Database error
 */
class DatabaseError extends SystemError {
  query;
  operation;
  constructor(message, operation, query, originalError) {
    super(
      message,
      5001,
      IErrorHandling_js_1.ErrorSeverity.CRITICAL,
      true,
      { operation, query },
      originalError
    );
    this.query = query;
    this.operation = operation;
  }
}
exports.DatabaseError = DatabaseError;
/**
 * Configuration error
 */
class ConfigurationError extends SystemError {
  configKey;
  constructor(message, configKey, originalError) {
    super(
      message,
      5002,
      IErrorHandling_js_1.ErrorSeverity.CRITICAL,
      false, // Config errors typically need manual fix
      { configKey },
      originalError
    );
    this.configKey = configKey;
  }
}
exports.ConfigurationError = ConfigurationError;
/**
 * Service unavailable error
 */
class ServiceUnavailableError extends SystemError {
  serviceName;
  constructor(serviceName, originalError) {
    super(
      serviceName ? `Service '${serviceName}' is unavailable` : 'Service unavailable',
      5003,
      IErrorHandling_js_1.ErrorSeverity.HIGH,
      true,
      { serviceName },
      originalError
    );
    this.serviceName = serviceName;
  }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
/**
 * External service error
 */
class ExternalServiceError extends SystemError {
  serviceName;
  statusCode;
  constructor(serviceName, message, statusCode, originalError) {
    super(
      message || `External service '${serviceName}' error`,
      5004,
      IErrorHandling_js_1.ErrorSeverity.HIGH,
      true,
      { serviceName, statusCode },
      originalError
    );
    this.serviceName = serviceName;
    this.statusCode = statusCode;
  }
}
exports.ExternalServiceError = ExternalServiceError;
/**
 * File system error
 */
class FileSystemError extends SystemError {
  path;
  operation;
  constructor(message, path, operation, originalError) {
    super(
      message,
      5005,
      IErrorHandling_js_1.ErrorSeverity.HIGH,
      false,
      { path, operation },
      originalError
    );
    this.path = path;
    this.operation = operation;
  }
}
exports.FileSystemError = FileSystemError;
// ============================================================================
// Integration Errors
// ============================================================================
/**
 * Third-party integration error
 */
class IntegrationError extends ApplicationError {
  provider;
  operation;
  constructor(provider, message, operation, originalError) {
    super(
      message || `Integration error with ${provider}`,
      6000,
      IErrorHandling_js_1.ErrorSeverity.HIGH,
      IErrorHandling_js_1.ErrorCategory.SYSTEM,
      true,
      { provider, operation },
      originalError
    );
    this.provider = provider;
    this.operation = operation;
  }
}
exports.IntegrationError = IntegrationError;
/**
 * API integration error
 */
class ApiIntegrationError extends IntegrationError {
  endpoint;
  statusCode;
  constructor(provider, endpoint, statusCode, message, originalError) {
    super(provider, message || `API integration error with ${provider}`, endpoint, originalError);
    Object.defineProperty(this, 'code', { value: 6001, writable: false });
    this.endpoint = endpoint;
    this.statusCode = statusCode;
  }
}
exports.ApiIntegrationError = ApiIntegrationError;
// ============================================================================
// Payment Errors
// ============================================================================
/**
 * Payment error
 */
class PaymentError extends ApplicationError {
  paymentMethod;
  transactionId;
  amount;
  constructor(message, code = 7000, metadata, originalError) {
    super(
      message,
      code,
      IErrorHandling_js_1.ErrorSeverity.CRITICAL,
      IErrorHandling_js_1.ErrorCategory.BUSINESS,
      false,
      metadata,
      originalError
    );
    this.paymentMethod = metadata?.paymentMethod;
    this.transactionId = metadata?.transactionId;
    this.amount = metadata?.amount;
  }
}
exports.PaymentError = PaymentError;
/**
 * Payment declined error
 */
class PaymentDeclinedError extends PaymentError {
  constructor(reason, metadata) {
    super(`Payment declined${reason ? `: ${reason}` : ''}`, 7001, metadata);
  }
}
exports.PaymentDeclinedError = PaymentDeclinedError;
/**
 * Insufficient funds error
 */
class InsufficientFundsError extends PaymentError {
  constructor(required, available, metadata) {
    super(`Insufficient funds. Required: ${required}, Available: ${available}`, 7002, {
      ...metadata,
      required,
      available,
    });
  }
}
exports.InsufficientFundsError = InsufficientFundsError;
// ============================================================================
// Export all error classes
// ============================================================================
exports.ErrorCodes = {
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
