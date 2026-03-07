import { Request, Response, NextFunction } from 'express';

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(message: string, statusCode = 500, code?: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Global error handling middleware
 */
export function errorMiddleware(
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error caught by middleware:', err);

  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const errorResponse: ErrorResponse = {
    success: false,
    error: err.message || 'Internal Server Error',
  };

  if (err instanceof ApiError) {
    if (err.code) {
      errorResponse.code = err.code;
    }
    if (err.details) {
      errorResponse.details = err.details;
    }
  }

  res.status(statusCode).json(errorResponse);
}
