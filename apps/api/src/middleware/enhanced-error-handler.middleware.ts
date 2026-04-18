import { Injectable, Logger } from '@nestjs/common';
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { SecurityLoggingService } from '../security/security-logging.service.js';

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    requestId?: string;
    details?: any;
  };
}

@Injectable()
export class EnhancedErrorHandlerMiddleware {
  private readonly logger = new Logger(EnhancedErrorHandlerMiddleware.name);

  constructor(private securityLogging: SecurityLoggingService) {}

  // Error handling middleware function (4 parameters)
  getHandler(): ErrorRequestHandler {
    return ((err: any, req: Request, res: Response, _next: NextFunction): void => {
      // Log the error with security context
      this.logError(err, req, res);

      // Determine error response based on error type and security context
      const errorResponse = this.createErrorResponse(err, req);

      // Send the response
      res.status(errorResponse.error.statusCode).json(errorResponse);
    }) as any;
  }

  /**
   * Create standardized error response
   */
  private createErrorResponse(error: any, req: any): ApiErrorResponse {
    const timestamp = new Date().toISOString();
    const requestId = req.requestId;

    // Handle different error types
    if (error.name === 'ValidationError') {
      return this.handleValidationError(error, timestamp, requestId);
    }

    if (error.name === 'UnauthorizedException' || error.status === 401) {
      return this.handleUnauthorizedError(error, timestamp, requestId, req);
    }

    if (error.name === 'ForbiddenException' || error.status === 403) {
      return this.handleForbiddenError(error, timestamp, requestId, req);
    }

    if (error.name === 'NotFoundException' || error.status === 404) {
      return this.handleNotFoundError(error, timestamp, requestId, req);
    }

    if (error.name === 'TooManyRequestsException' || error.status === 429) {
      return this.handleRateLimitError(error, timestamp, requestId, req);
    }

    if (error.name === 'BadRequestException' || error.status === 400) {
      return this.handleBadRequestError(error, timestamp, requestId, req);
    }

    if (error.status >= 500) {
      return this.handleServerError(error, timestamp, requestId, req);
    }

    // Default error handling
    return {
      success: false,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
        statusCode: error.status || 500,
        timestamp,
        requestId,
        details: this.sanitizeErrorDetails(error),
      },
    };
  }

  /**
   * Handle validation errors
   */
  private handleValidationError(
    error: any,
    timestamp: string,
    requestId?: string
  ): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        statusCode: 400,
        timestamp,
        requestId,
        details: {
          validationErrors: error.message || 'Invalid input data',
          suggestion: 'Please check your request data and try again',
        },
      },
    };
  }

  /**
   * Handle unauthorized errors
   */
  private handleUnauthorizedError(
    error: any,
    timestamp: string,
    requestId: string | undefined,
    req: any
  ): ApiErrorResponse {
    this.securityLogging.logAuthEvent('auth_failure', {
      ip: req.clientIP,
      userAgent: req.headers['user-agent'],
      method: req.method,
      endpoint: req.path,
      success: false,
      reason: error.message || 'Authentication required',
      metadata: { requestId },
    });

    return {
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access this resource',
        statusCode: 401,
        timestamp,
        requestId,
        details: {
          authType: 'Bearer token',
          hint: 'Please include a valid JWT token in the Authorization header',
        },
      },
    };
  }

  /**
   * Handle forbidden errors
   */
  private handleForbiddenError(
    error: any,
    timestamp: string,
    requestId: string | undefined,
    req: any
  ): ApiErrorResponse {
    this.securityLogging.logAuthZEvent('access_denied', {
      userId: req.user?.id,
      ip: req.clientIP,
      userAgent: req.headers['user-agent'],
      method: req.method,
      endpoint: req.path,
      success: false,
      reason: error.message || 'Insufficient permissions',
    });

    return {
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to access this resource',
        statusCode: 403,
        timestamp,
        requestId,
        details: {
          requiredRole: error.requiredRole,
          userRoles: req.user?.roles,
          hint: 'Contact an administrator if you believe this is an error',
        },
      },
    };
  }

  /**
   * Handle not found errors
   */
  private handleNotFoundError(
    error: any,
    timestamp: string,
    requestId: string | undefined,
    req: any
  ): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'The requested resource was not found',
        statusCode: 404,
        timestamp,
        requestId,
        details: {
          resource: req.path,
          method: req.method,
          hint: 'Please verify the URL and ensure the resource exists',
        },
      },
    };
  }

  /**
   * Handle rate limit errors
   */
  private handleRateLimitError(
    error: any,
    timestamp: string,
    requestId: string | undefined,
    req: any
  ): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later',
        statusCode: 429,
        timestamp,
        requestId,
        details: {
          limit: error.limit || 100,
          window: '1 minute',
          resetTime: error.resetTime,
          hint: 'Wait before making more requests or upgrade your plan',
        },
      },
    };
  }

  /**
   * Handle bad request errors
   */
  private handleBadRequestError(
    error: any,
    timestamp: string,
    requestId: string | undefined,
    req: any
  ): ApiErrorResponse {
    this.securityLogging.logInputValidation(req.path, req.method, {
      ip: req.clientIP,
      reason: error.message || 'Bad request',
      severity: 'medium',
    });

    return {
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'The request could not be understood or was missing required parameters',
        statusCode: 400,
        timestamp,
        requestId,
        details: {
          hint: 'Please check your request format and required parameters',
        },
      },
    };
  }

  /**
   * Handle server errors
   */
  private handleServerError(
    error: any,
    timestamp: string,
    requestId: string | undefined,
    req: any
  ): ApiErrorResponse {
    // Log server errors for monitoring
    this.logger.error('Server Error', {
      error: error.message,
      stack: error.stack,
      requestId,
      path: req.path,
      method: req.method,
      ip: req.clientIP,
    });

    return {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An internal server error occurred',
        statusCode: 500,
        timestamp,
        requestId,
        details: {
          referenceId: requestId,
          hint: 'Please try again later or contact support if the problem persists',
        },
      },
    };
  }

  /**
   * Log error for monitoring and debugging
   */
  private logError(error: any, req: any, res: Response): void {
    const errorInfo = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        status: error.status,
      },
      request: {
        id: req.requestId,
        method: req.method,
        path: req.path,
        ip: req.clientIP,
        userAgent: req.userAgent,
        userId: req.user?.id,
        timestamp: req.timestamp,
      },
      response: {
        statusCode: res.statusCode,
      },
    };

    if (error.status >= 500) {
      this.logger.error('Server Error', errorInfo);
    } else if (error.status === 401 || error.status === 403) {
      this.logger.warn('Auth Error', errorInfo);
    } else {
      this.logger.warn('Client Error', errorInfo);
    }
  }

  /**
   * Sanitize error details to avoid exposing sensitive information
   */
  private sanitizeErrorDetails(error: any): any {
    const sanitized = { ...error };

    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    delete sanitized.key;

    // Truncate long messages
    if (sanitized.message && sanitized.message.length > 500) {
      sanitized.message = sanitized.message.substring(0, 500) + '...';
    }

    return sanitized;
  }
}
