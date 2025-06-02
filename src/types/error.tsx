// BaseError Class
export class BaseError extends Error {
  code: string; // Default code, can be overridden by specific error classes
  statusCode?: number;
  details?: Record<string, unknown>;
  timestamp: Date;

  constructor(message: string, statusCode?: number, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code || 'UNSPECIFIED_ERROR'; // Default error code
    this.details = details;
    this.timestamp = new Date();
    Object.setPrototypeOf(this, new.target.prototype); // Ensure instanceof works
  }
}

// FileUploadError Class
export class FileUploadError extends BaseError {
  fileName?: string;
  reason?: string;

  constructor(message: string = 'File upload failed', statusCode: number = 500, fileName?: string, reason?: string, code?: string, details?: Record<string, unknown>) {
    super(message, statusCode, code || 'FILE_UPLOAD_ERROR', details);
    this.fileName = fileName;
    this.reason = reason;
  }
}

// AuthenticationError Class (to replace AuthError)
export class AuthenticationError extends BaseError {
  userId?: string;
  action?: string;

  constructor(message: string = 'Authentication failed', statusCode: number = 401, userId?: string, action?: string, code?: string, details?: Record<string, unknown>) {
    super(message, statusCode, code || 'AUTHENTICATION_ERROR', details);
    this.userId = userId;
    this.action = action;
  }
}

// Existing interfaces that extend BaseError. They will now extend the BaseError class.
// This should be compatible as the class includes all fields from the former BaseError interface.

export interface ValidationError extends BaseError {
  field: string;
  value: unknown;
  constraints: Record<string, string>;
}

export interface DatabaseError extends BaseError {
  query?: string;
  parameters?: unknown[];
  entity?: string;
}

export interface ApiError extends BaseError {
  path: string;
  method: string;
  requestId?: string;
}

export interface ErrorResponse {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface ErrorHandlerOptions {
  logErrors?: boolean;
  includeStackTrace?: boolean;
  maskSensitiveData?: boolean;
}

export interface ErrorLogEntry {
  id: string;
  error: BaseError;
  context?: Record<string, unknown>;
  timestamp: Date;
  handled: boolean;
  resolution?: string;
}
