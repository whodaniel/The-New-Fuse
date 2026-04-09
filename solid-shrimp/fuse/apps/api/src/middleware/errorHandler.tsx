import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
  }
}

export const errorHandler = (logger: Logger): any => {
  return (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (error instanceof ApiError) {
      logger.warn(`API Error: ${error.message}`, {
        statusCode: error.statusCode,
        details: error.details,
        path: req.path
      });

      return res.status(error.statusCode).json({
        error: error.message,
        details: error.details
      });
    }

    logger.error('Unhandled Error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  };
};