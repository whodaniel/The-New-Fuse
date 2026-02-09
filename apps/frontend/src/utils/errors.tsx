export class AppError extends Error {
  public code: string;
  public status?: number;
  public details?: Record<string, any>;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    status?: number,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;

    // Ensure prototype chain is setup correctly
    Object.setPrototypeOf(this, AppError.prototype);
  }

  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      details: this.details,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND_ERROR', 404);
    this.name = 'NotFoundError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', 503);
    this.name = 'NetworkError';
  }
}

export interface ErrorHandlerOptions {
  silent?: boolean;
  throwError?: boolean;
  context?: Record<string, any>;
}

export function handleError(
  error: Error | AppError | unknown,
  options: ErrorHandlerOptions = {}
): AppError {
  const { silent = false, throwError = false, context = {} } = options;

  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError(error.message);
  } else {
    appError = new AppError('An unknown error occurred');
  }

  if (!silent) {
    console.error('Error occurred:', {
      error: appError.toJSON(),
      context,
    });
  }

  if (throwError) {
    throw appError;
  }

  return appError;
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}

export function createErrorFromResponse(response: Response): AppError {
  const status = response.status;
  const statusText = response.statusText;

  switch (status) {
    case 400:
      return new ValidationError(statusText);
    case 401:
      return new AuthenticationError(statusText);
    case 403:
      return new AuthorizationError(statusText);
    case 404:
      return new NotFoundError(statusText);
    default:
      return new AppError(
        statusText || 'An error occurred with the request',
        'API_ERROR',
        status
      );
  }
}

export async function tryAsync<T>(
  promise: Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<[T | null, AppError | null]> {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    const appError = handleError(error, { ...options, throwError: false });
    return [null, appError];
  }
}