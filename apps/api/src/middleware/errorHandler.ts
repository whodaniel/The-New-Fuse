import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(statusCode: number, message: string, data: any = {}) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.name = 'ApiError';
  }
}

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...err.data
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};
