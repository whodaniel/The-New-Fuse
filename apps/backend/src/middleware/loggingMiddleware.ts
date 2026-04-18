import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import { LoggingService } from '../services/logging.service.js';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggingService) {}

  private toBufferChunk(chunk: unknown): Buffer | null {
    if (chunk == null) return null;
    if (Buffer.isBuffer(chunk)) return chunk;
    if (typeof chunk === 'string') return Buffer.from(chunk);
    if (chunk instanceof Uint8Array) return Buffer.from(chunk);
    if (typeof chunk === 'object') return Buffer.from(JSON.stringify(chunk));
    return Buffer.from(String(chunk));
  }

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
      userId: (req as any).user?.id,
    });

    // Capture response data
    const originalEnd = res.end;
    const originalWrite = res.write;
    const chunks: Buffer[] = [];

    (res as any).write = (chunk: any) => {
      const bufferChunk = this.toBufferChunk(chunk);
      if (bufferChunk) {
        chunks.push(bufferChunk);
      }
      return originalWrite.apply(res, arguments as any);
    };

    (res as any).end = (chunk: any) => {
      const bufferChunk = this.toBufferChunk(chunk);
      if (bufferChunk) {
        chunks.push(bufferChunk);
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
        userId: (req as any).user?.id,
      });

      // Log performance if duration exceeds threshold
      if (duration > 1000) {
        this.logger.logPerformance('http_request', duration, {
          requestId,
          method: req.method,
          path: req.path,
        });
      }

      originalEnd.apply(res, arguments as any);
    };

    next();
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
