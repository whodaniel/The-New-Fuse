import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggingService } from '../services/loggingService.js';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggingService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4();
    const startTime = Date.now();

    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);

    // Log request
    this.logger.logRequest({
      requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      headers: this.sanitizeHeaders(req.headers),
      ip: req.ip,
      userId: (req as any).user?.id
    });

    // Capture response data
    const originalEnd = res.end;
    const originalWrite = res.write;
    const chunks: Buffer[] = [];

    res.write = function(chunk: any) {
      if (chunk) {
        chunks.push(Buffer.from(chunk));
      }
      return originalWrite.apply(res, arguments as any);
    };

    res.end = function(chunk: any) {
      if (chunk) {
        chunks.push(Buffer.from(chunk));
      }

      const responseBody = Buffer.concat(chunks).toString('utf8');
      const duration = Date.now() - startTime;

      // Log response
      this.logger.logRequest({
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        responseSize: Buffer.byteLength(responseBody, 'utf8'),
        userId: (req as any).user?.id
      });

      // Log performance if duration exceeds threshold
      if (duration > 1000) {
        this.logger.logPerformance('http_request', duration, {
          requestId,
          method: req.method,
          path: req.path
        });
      }

      originalEnd.apply(res, arguments as any);
    }.bind(this);

    next();
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }
} 