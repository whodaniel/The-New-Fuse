export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  BUSINESS = 'BUSINESS',
  SYSTEM = 'SYSTEM'
}

export interface ErrorMetadata {
  timestamp: Date;
  correlationId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface BaseError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  metadata?: ErrorMetadata;
  cause?: Error;
}

export class ApplicationError extends Error implements BaseError {
  constructor(
    message: string,
    public category: ErrorCategory,
    public severity: ErrorSeverity,
    public code: string,
    public metadata?: ErrorMetadata,
    public cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApplicationError {
  constructor(
    message: string,
    public validationErrors: Record<string, string[]>,
    metadata?: ErrorMetadata
  ) {
    super(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.MEDIUM,
      'VALIDATION_ERROR',
      metadata
    );
    this.validationErrors = validationErrors;
  }
}