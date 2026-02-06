import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * ETag Interceptor for conditional request handling
 * Implements HTTP/1.1 ETag caching mechanism
 * Returns 304 Not Modified when content hasn't changed
 */
@Injectable()
export class ETagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap((data) => {
        // Skip ETag for non-GET requests
        if (request.method !== 'GET') {
          return;
        }

        // Generate ETag from response data
        const content = JSON.stringify(data);
        const etag = `"${crypto.createHash('md5').update(content).digest('hex')}"`;

        // Set ETag header
        response.setHeader('ETag', etag);

        // Check if client has cached version
        const clientETag = request.headers['if-none-match'];
        if (clientETag === etag) {
          response.status(304).end();
          return;
        }

        // Set cache-control headers
        response.setHeader('Cache-Control', 'private, must-revalidate');
      })
    );
  }
}
