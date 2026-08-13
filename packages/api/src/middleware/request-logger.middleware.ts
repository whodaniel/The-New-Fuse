/**
 * Request logging middleware
 * Logs all incoming requests and their responses
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('RequestLogger');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    
    // Log request start
    this.logger.log(
      `[REQUEST] ${method} ${originalUrl} - ${ip} - ${userAgent}`
    );
    
    // Track request timing
    const start = Date.now();
    
    // Add response listener to log after completion
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;
      const duration = Date.now() - start;
      
      // Log with different levels based on status code
      const logMessage = 
        `[RESPONSE] ${method} ${originalUrl} - ${statusCode} - ${contentLength}b - ${duration}ms`;
      
      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });
    
    next();
  }
}