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
export class ApplicationError extends Error implements BaseError {
  public readonly code: number;
  public readonly timestamp: Date;
  public readonly correlationId?: string;
  public readonly retryable: boolean;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly metadata?: Record<string, any>;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: number,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    retryable: boolean = false,
    metadata?: Record<string, any>,
    originalError?: Error
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
  toJSON(): Record<string, any> {
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
  public readonly statusCode?: number;
  public readonly endpoint?: string;
  public readonly method?: string;

  constructor(
    message: string,
    code: number = 1000,
    metadata?: Record<string, any> & {
      statusCode?: number;
      endpoint?: string;
      method?: string;
    },
    originalError?: Error
  ) {
    super(
      message,
      code,
      ErrorSeverity.HIGH,
      ErrorCategory.NETWORK,
      true, // Network errors are typically retryable
      metadata,
      originalError
    );
    this.statusCode = metadata?.statusCode;
    this.endpoint = metadata?.endpoint;
    this.method = metadata?.method;
  }
}

/**
 * Connection timeout error
 */
export class TimeoutError extends NetworkError {
  constructor(
    endpoint?: string,
    timeout?: number,
    originalError?: Error
  ) {
    super(
      `Request timeout${endpoint ? ` for ${endpoint}` : ''}${timeout ? ` after ${timeout}ms` : ''}`,
      1001,
      { endpoint, timeout },
      originalError
    );
  }
}

/**
 * Connection error
 */
export class ConnectionError extends NetworkError {
  constructor(
    endpoint?: string,
    originalError?: Error
  ) {
    super(
      `Failed to connect${endpoint ? ` to ${endpoint}` : ''}`,
      1002,
      { endpoint },
      originalError
    );
  }
}

/**
 * HTTP error with status code
 */
export class HttpError extends NetworkError {
  constructor(
    statusCode: number,
    message?: string,
    endpoint?: string,
    method?: string,
    originalError?: Error
  ) {
    super(
      message || `HTTP ${statusCode} error${endpoint ? ` for ${endpoint}` : ''}`,
      1000 + statusCode,
      { statusCode, endpoint, method },
      originalError
    );
  }
}

// ============================================================================
// Authentication & Authorization Errors
// ============================================================================

/**
 * Authentication error
 */
export class AuthenticationError extends ApplicationError {
  constructor(
    message: string = 'Authentication failed',
    code: number = 2000,
    metadata?: Record<string, any>,
    originalError?: Error
  ) {
    super(
      message,
      code,
      ErrorSeverity.HIGH,
      ErrorCategory.AUTHENTICATION,
      false, // Auth errors typically require user action
      metadata,
      originalError
    );
  }
}

/**
 * Token expired error
 */
export class TokenExpiredError extends AuthenticationError {
  constructor(originalError?: Error) {
    super('Authentication token has expired', 2001, {}, originalError);
  }
}

/**
 * Invalid credentials error
 */
export class InvalidCredentialsError extends AuthenticationError {
  constructor(originalError?: Error) {
    super('Invalid username or password', 2002, {}, originalError);
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends ApplicationError {
  public readonly requiredPermission?: string;
  public readonly userRole?: string;

  constructor(
    message: string = 'Access denied',
    requiredPermission?: string,
    userRole?: string,
    originalError?: Error
  ) {
    super(
      message,
      2100,
      ErrorSeverity.MEDIUM,
      ErrorCategory.AUTHORIZATION,
      false,
      { requiredPermission, userRole },
      originalError
    );
    this.requiredPermission = requiredPermission;
    this.userRole = userRole;
  }
}

/**
 * Insufficient permissions error
 */
export class InsufficientPermissionsError extends AuthorizationError {
  constructor(requiredPermission: string, userRole?: string) {
    super(
      `Insufficient permissions. Required: ${requiredPermission}`,
      requiredPermission,
      userRole
    );
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

/**
 * Validation error
 */
export class ValidationError extends ApplicationError {
  public readonly field?: string;
  public readonly validationErrors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;

  constructor(
    message: string,
    field?: string,
    validationErrors?: Array<{ field: string; message: string; value?: any }>,
    originalError?: Error
  ) {
    super(
      message,
      3000,
      ErrorSeverity.LOW,
      ErrorCategory.VALIDATION,
      false,
      { field, validationErrors },
      originalError
    );
    this.field = field;
    this.validationErrors = validationErrors;
  }
}

/**
 * Required field error
 */
export class RequiredFieldError extends ValidationError {
  constructor(field: string) {
    super(`Field '${field}' is required`, field);
    Object.defineProperty(this, 'code', { value: 3001, writable: false });
  }
}

/**
 * Invalid format error
 */
export class InvalidFormatError extends ValidationError {
  constructor(field: string, expectedFormat: string, actualValue?: any) {
    super(
      `Field '${field}' has invalid format. Expected: ${expectedFormat}`,
      field,
      [{ field, message: `Expected format: ${expectedFormat}`, value: actualValue }]
    );
    Object.defineProperty(this, 'code', { value: 3002, writable: false });
  }
}

/**
 * Out of range error
 */
export class OutOfRangeError extends ValidationError {
  constructor(field: string, min?: number, max?: number, actualValue?: any) {
    const rangeMsg = min !== undefined && max !== undefined
      ? `between ${min} and ${max}`
      : min !== undefined
      ? `at least ${min}`
      : max !== undefined
      ? `at most ${max}`
      : 'within valid range';

    super(
      `Field '${field}' must be ${rangeMsg}`,
      field,
      [{ field, message: rangeMsg, value: actualValue }]
    );
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
  constructor(
    message: string,
    code: number = 4000,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    metadata?: Record<string, any>,
    originalError?: Error
  ) {
    super(
      message,
      code,
      severity,
      ErrorCategory.BUSINESS,
      false,
      metadata,
      originalError
    );
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends BusinessError {
  public readonly resourceType?: string;
  public readonly resourceId?: string;

  constructor(resourceType?: string, resourceId?: string) {
    super(
      resourceType && resourceId
        ? `${resourceType} with ID '${resourceId}' not found`
        : resourceType
        ? `${resourceType} not found`
        : 'Resource not found',
      4001,
      ErrorSeverity.LOW,
      { resourceType, resourceId }
    );
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

/**
 * Conflict error (e.g., duplicate resource)
 */
export class ConflictError extends BusinessError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 4002, ErrorSeverity.MEDIUM, metadata);
  }
}

/**
 * Resource already exists error
 */
export class DuplicateResourceError extends ConflictError {
  constructor(resourceType: string, identifier: string) {
    super(
      `${resourceType} '${identifier}' already exists`,
      { resourceType, identifier }
    );
    Object.defineProperty(this, 'code', { value: 4003, writable: false });
  }
}

/**
 * Operation not allowed error
 */
export class OperationNotAllowedError extends BusinessError {
  constructor(operation: string, reason?: string) {
    super(
      `Operation '${operation}' is not allowed${reason ? `: ${reason}` : ''}`,
      4004,
      ErrorSeverity.MEDIUM,
      { operation, reason }
    );
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends BusinessError {
  public readonly retryAfter?: number;

  constructor(retryAfter?: number) {
    super(
      `Rate limit exceeded${retryAfter ? `. Retry after ${retryAfter} seconds` : ''}`,
      4005,
      ErrorSeverity.LOW,
      { retryAfter }
    );
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
  constructor(
    message: string,
    code: number = 5000,
    severity: ErrorSeverity = ErrorSeverity.CRITICAL,
    retryable: boolean = true,
    metadata?: Record<string, any>,
    originalError?: Error
  ) {
    super(
      message,
      code,
      severity,
      ErrorCategory.SYSTEM,
      retryable,
      metadata,
      originalError
    );
  }
}

/**
 * Database error
 */
export class DatabaseError extends SystemError {
  public readonly query?: string;
  public readonly operation?: string;

  constructor(
    message: string,
    operation?: string,
    query?: string,
    originalError?: Error
  ) {
    super(
      message,
      5001,
      ErrorSeverity.CRITICAL,
      true,
      { operation, query },
      originalError
    );
    this.query = query;
    this.operation = operation;
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends SystemError {
  public readonly configKey?: string;

  constructor(message: string, configKey?: string, originalError?: Error) {
    super(
      message,
      5002,
      ErrorSeverity.CRITICAL,
      false, // Config errors typically need manual fix
      { configKey },
      originalError
    );
    this.configKey = configKey;
  }
}

/**
 * Service unavailable error
 */
export class ServiceUnavailableError extends SystemError {
  public readonly serviceName?: string;

  constructor(serviceName?: string, originalError?: Error) {
    super(
      serviceName ? `Service '${serviceName}' is unavailable` : 'Service unavailable',
      5003,
      ErrorSeverity.HIGH,
      true,
      { serviceName },
      originalError
    );
    this.serviceName = serviceName;
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends SystemError {
  public readonly serviceName: string;
  public readonly statusCode?: number;

  constructor(
    serviceName: string,
    message?: string,
    statusCode?: number,
    originalError?: Error
  ) {
    super(
      message || `External service '${serviceName}' error`,
      5004,
      ErrorSeverity.HIGH,
      true,
      { serviceName, statusCode },
      originalError
    );
    this.serviceName = serviceName;
    this.statusCode = statusCode;
  }
}

/**
 * File system error
 */
export class FileSystemError extends SystemError {
  public readonly path?: string;
  public readonly operation?: string;

  constructor(
    message: string,
    path?: string,
    operation?: string,
    originalError?: Error
  ) {
    super(
      message,
      5005,
      ErrorSeverity.HIGH,
      false,
      { path, operation },
      originalError
    );
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
  public readonly provider: string;
  public readonly operation?: string;

  constructor(
    provider: string,
    message?: string,
    operation?: string,
    originalError?: Error
  ) {
    super(
      message || `Integration error with ${provider}`,
      6000,
      ErrorSeverity.HIGH,
      ErrorCategory.SYSTEM,
      true,
      { provider, operation },
      originalError
    );
    this.provider = provider;
    this.operation = operation;
  }
}

/**
 * API integration error
 */
export class ApiIntegrationError extends IntegrationError {
  public readonly endpoint?: string;
  public readonly statusCode?: number;

  constructor(
    provider: string,
    endpoint?: string,
    statusCode?: number,
    message?: string,
    originalError?: Error
  ) {
    super(
      provider,
      message || `API integration error with ${provider}`,
      endpoint,
      originalError
    );
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
  public readonly paymentMethod?: string;
  public readonly transactionId?: string;
  public readonly amount?: number;

  constructor(
    message: string,
    code: number = 7000,
    metadata?: Record<string, any> & {
      paymentMethod?: string;
      transactionId?: string;
      amount?: number;
    },
    originalError?: Error
  ) {
    super(
      message,
      code,
      ErrorSeverity.CRITICAL,
      ErrorCategory.BUSINESS,
      false,
      metadata,
      originalError
    );
    this.paymentMethod = metadata?.paymentMethod;
    this.transactionId = metadata?.transactionId;
    this.amount = metadata?.amount;
  }
}

/**
 * Payment declined error
 */
export class PaymentDeclinedError extends PaymentError {
  constructor(reason?: string, metadata?: Record<string, any>) {
    super(
      `Payment declined${reason ? `: ${reason}` : ''}`,
      7001,
      metadata
    );
  }
}

/**
 * Insufficient funds error
 */
export class InsufficientFundsError extends PaymentError {
  constructor(required: number, available: number, metadata?: Record<string, any>) {
    super(
      `Insufficient funds. Required: ${required}, Available: ${available}`,
      7002,
      { ...metadata, required, available }
    );
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
} as const;
