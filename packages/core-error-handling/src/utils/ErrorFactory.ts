/**
 * Error Factory
 *
 * @description
 * Factory class for creating standardized errors across the application.
 * Provides convenient methods for creating errors with proper typing and metadata.
 */

import {
  ApiIntegrationError,
  ApplicationError,
  AuthenticationError,
  AuthorizationError,
  BusinessError,
  ConfigurationError,
  ConflictError,
  ConnectionError,
  DatabaseError,
  DuplicateResourceError,
  ExternalServiceError,
  FileSystemError,
  HttpError,
  InsufficientFundsError,
  InsufficientPermissionsError,
  IntegrationError,
  InvalidCredentialsError,
  InvalidFormatError,
  NetworkError,
  NotFoundError,
  OperationNotAllowedError,
  OutOfRangeError,
  PaymentDeclinedError,
  PaymentError,
  RateLimitError,
  RequiredFieldError,
  ServiceUnavailableError,
  SystemError,
  TimeoutError,
  TokenExpiredError,
  ValidationError,
} from '../errors/CustomErrors.js';
import { ErrorCategory, ErrorSeverity } from '../interfaces/IErrorHandling.js';

/**
 * Error Factory for creating standardized errors
 */
export class ErrorFactory {
  /**
   * Create a generic application error
   */
  static createApplicationError(
    message: string,
    code: number,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    retryable: boolean = false,
    metadata?: Record<string, any>,
    originalError?: Error
  ): ApplicationError {
    return new ApplicationError(
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
  static fromHttpResponse(
    statusCode: number,
    responseData?: any,
    endpoint?: string,
    method?: string
  ): ApplicationError {
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
  static fromError(
    error: Error,
    context?: {
      component?: string;
      operation?: string;
      metadata?: Record<string, any>;
    }
  ): ApplicationError {
    // If already an ApplicationError, return it
    if (error instanceof ApplicationError) {
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
    return new SystemError(
      error.message,
      5000,
      ErrorSeverity.HIGH,
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
  static network(
    message: string,
    endpoint?: string,
    method?: string,
    statusCode?: number
  ): NetworkError {
    return new NetworkError(message, 1000, { endpoint, method, statusCode });
  }

  /**
   * Create timeout error
   */
  static timeout(endpoint?: string, timeout?: number): TimeoutError {
    return new TimeoutError(endpoint, timeout);
  }

  /**
   * Create connection error
   */
  static connectionError(endpoint?: string): ConnectionError {
    return new ConnectionError(endpoint);
  }

  /**
   * Create HTTP error
   */
  static http(statusCode: number, message?: string, endpoint?: string): HttpError {
    return new HttpError(statusCode, message, endpoint);
  }

  /**
   * Create authentication error
   */
  static authentication(message?: string): AuthenticationError {
    return new AuthenticationError(message);
  }

  /**
   * Create token expired error
   */
  static tokenExpired(): TokenExpiredError {
    return new TokenExpiredError();
  }

  /**
   * Create invalid credentials error
   */
  static invalidCredentials(): InvalidCredentialsError {
    return new InvalidCredentialsError();
  }

  /**
   * Create authorization error
   */
  static authorization(
    message?: string,
    requiredPermission?: string,
    userRole?: string
  ): AuthorizationError {
    return new AuthorizationError(message, requiredPermission, userRole);
  }

  /**
   * Create insufficient permissions error
   */
  static insufficientPermissions(
    requiredPermission: string,
    userRole?: string
  ): InsufficientPermissionsError {
    return new InsufficientPermissionsError(requiredPermission, userRole);
  }

  /**
   * Create validation error
   */
  static validation(
    message: string,
    field?: string,
    errors?: Array<{ field: string; message: string; value?: any }>
  ): ValidationError {
    return new ValidationError(message, field, errors);
  }

  /**
   * Create required field error
   */
  static requiredField(field: string): RequiredFieldError {
    return new RequiredFieldError(field);
  }

  /**
   * Create invalid format error
   */
  static invalidFormat(
    field: string,
    expectedFormat: string,
    actualValue?: any
  ): InvalidFormatError {
    return new InvalidFormatError(field, expectedFormat, actualValue);
  }

  /**
   * Create out of range error
   */
  static outOfRange(field: string, min?: number, max?: number, actualValue?: any): OutOfRangeError {
    return new OutOfRangeError(field, min, max, actualValue);
  }

  /**
   * Create business error
   */
  static business(
    message: string,
    code?: number,
    severity?: ErrorSeverity,
    metadata?: Record<string, any>
  ): BusinessError {
    return new BusinessError(message, code, severity, metadata);
  }

  /**
   * Create not found error
   */
  static notFound(resourceType?: string, resourceId?: string): NotFoundError {
    return new NotFoundError(resourceType, resourceId);
  }

  /**
   * Create conflict error
   */
  static conflict(message: string, metadata?: Record<string, any>): ConflictError {
    return new ConflictError(message, metadata);
  }

  /**
   * Create duplicate resource error
   */
  static duplicateResource(resourceType: string, identifier: string): DuplicateResourceError {
    return new DuplicateResourceError(resourceType, identifier);
  }

  /**
   * Create operation not allowed error
   */
  static operationNotAllowed(operation: string, reason?: string): OperationNotAllowedError {
    return new OperationNotAllowedError(operation, reason);
  }

  /**
   * Create rate limit error
   */
  static rateLimit(retryAfter?: number): RateLimitError {
    return new RateLimitError(retryAfter);
  }

  /**
   * Create system error
   */
  static system(
    message: string,
    code?: number,
    severity?: ErrorSeverity,
    retryable?: boolean,
    metadata?: Record<string, any>
  ): SystemError {
    return new SystemError(message, code, severity, retryable, metadata);
  }

  /**
   * Create database error
   */
  static database(
    message: string,
    operation?: string,
    query?: string,
    originalError?: Error
  ): DatabaseError {
    return new DatabaseError(message, operation, query, originalError);
  }

  /**
   * Create configuration error
   */
  static configuration(message: string, configKey?: string): ConfigurationError {
    return new ConfigurationError(message, configKey);
  }

  /**
   * Create service unavailable error
   */
  static serviceUnavailable(serviceName?: string): ServiceUnavailableError {
    return new ServiceUnavailableError(serviceName);
  }

  /**
   * Create external service error
   */
  static externalService(
    serviceName: string,
    message?: string,
    statusCode?: number,
    originalError?: Error
  ): ExternalServiceError {
    return new ExternalServiceError(serviceName, message, statusCode, originalError);
  }

  /**
   * Create file system error
   */
  static fileSystem(
    message: string,
    path?: string,
    operation?: string,
    originalError?: Error
  ): FileSystemError {
    return new FileSystemError(message, path, operation, originalError);
  }

  /**
   * Create integration error
   */
  static integration(
    provider: string,
    message?: string,
    operation?: string,
    originalError?: Error
  ): IntegrationError {
    return new IntegrationError(provider, message, operation, originalError);
  }

  /**
   * Create API integration error
   */
  static apiIntegration(
    provider: string,
    endpoint?: string,
    statusCode?: number,
    message?: string,
    originalError?: Error
  ): ApiIntegrationError {
    return new ApiIntegrationError(provider, endpoint, statusCode, message, originalError);
  }

  /**
   * Create payment error
   */
  static payment(message: string, code?: number, metadata?: Record<string, any>): PaymentError {
    return new PaymentError(message, code, metadata);
  }

  /**
   * Create payment declined error
   */
  static paymentDeclined(reason?: string, metadata?: Record<string, any>): PaymentDeclinedError {
    return new PaymentDeclinedError(reason, metadata);
  }

  /**
   * Create insufficient funds error
   */
  static insufficientFunds(
    required: number,
    available: number,
    metadata?: Record<string, any>
  ): InsufficientFundsError {
    return new InsufficientFundsError(required, available, metadata);
  }
}
