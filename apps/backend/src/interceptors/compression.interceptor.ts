import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
// @ts-ignore
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const brotliCompress = promisify(zlib.brotliCompress);

/**
 * Advanced Compression Interceptor
 * Supports both gzip and brotli compression
 * Automatically selects best compression based on client support
 * Only compresses responses larger than 1KB
 */
@Injectable()
export class CompressionInterceptor implements NestInterceptor {
  private readonly MIN_SIZE_FOR_COMPRESSION = 1024; // 1KB

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();
    const acceptEncoding = request.headers['accept-encoding'] || '';

    return next.handle().pipe(
      tap(async (data) => {
        // Skip compression for small responses
        const content = JSON.stringify(data);
        if (content.length < this.MIN_SIZE_FOR_COMPRESSION) {
          return;
        }

        try {
          // Prefer brotli if supported (better compression ratio)
          if (acceptEncoding.includes('br')) {
            const compressed = await brotliCompress(content);
            response.setHeader('Content-Encoding', 'br');
            response.setHeader('Content-Length', compressed.length.toString());
            response.setHeader('Vary', 'Accept-Encoding');
            response.send(compressed);
          }
          // Fallback to gzip
          else if (acceptEncoding.includes('gzip')) {
            const compressed = await gzip(content);
            response.setHeader('Content-Encoding', 'gzip');
            response.setHeader('Content-Length', compressed.length.toString());
            response.setHeader('Vary', 'Accept-Encoding');
            response.send(compressed);
          }
        } catch (error) {
          console.error('Compression error:', error);
          // If compression fails, return uncompressed data
        }
      }),
    );
  }
}
