export interface BaseError extends Error {
  code: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  timestamp: Date;
}

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

export interface AuthenticationError extends BaseError {
  userId?: string;
  action?: string;
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
