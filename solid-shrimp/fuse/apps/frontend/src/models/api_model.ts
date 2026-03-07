interface ApiError extends Error {
  code?: string;
  details?: unknown;
  statusCode?: number;
}

export class ApiErrorFactory {
  static create(message: string, code?: string, details?: unknown, statusCode?: number): ApiError {
    const error: ApiError = new Error(message);
    error.code = code;
    error.details = details;
    error.statusCode = statusCode;
    return error;
  }
}
