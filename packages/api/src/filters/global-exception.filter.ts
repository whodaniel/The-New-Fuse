/**
 * Custom HTTP exception filter
 * Converts exceptions to standardized API responses
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../types/api-response.types.js';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Get status and error information
    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    
    const message = 
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';
    
    const details = exception.response?.message || exception.message || message;
    
    // Log the error
    this.logger.error(`Exception: ${message}`, exception.stack);
    
    // Build standardized error response
    const errorResponse: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        message,
        details: Array.isArray(details) ? details.join(', ') : details,
        code: status.toString(),
      },
      timestamp: new Date().toISOString(),
    };

    // Send the response
    response.status(status).json(errorResponse);
  }
}