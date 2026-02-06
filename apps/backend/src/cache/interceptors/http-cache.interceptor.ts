import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AdvancedCacheManager } from '../services/advanced-cache.manager';

export const HTTP_CACHE_KEY = 'http_cache';
export const HTTP_CACHE_TTL_KEY = 'http_cache_ttl';

export interface HttpCacheOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  cacheControl?: string | ((ttl: number) => string);
  varyBy?: string[];
  onlyMethods?: ('GET' | 'HEAD')[];
  excludeQuery?: boolean;
}

/**
 * Decorator to enable HTTP response caching
 */
export const HttpCache = (options: HttpCacheOptions = {}): MethodDecorator => {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(HTTP_CACHE_KEY, options, descriptor.value);
    return descriptor;
  };
};

/**
 * Decorator to set HTTP cache TTL
 */
export const HttpCacheTTL = (ttl: number): MethodDecorator => {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(HTTP_CACHE_TTL_KEY, ttl, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);

  constructor(
    private readonly cacheManager: AdvancedCacheManager,
    private readonly reflector: Reflector
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const handler = context.getHandler();
    const options = Reflect.getMetadata(HTTP_CACHE_KEY, handler) as HttpCacheOptions;
    const ttl = Reflect.getMetadata(HTTP_CACHE_TTL_KEY, handler) as number;

    // Only cache GET and HEAD requests by default
    const allowedMethods = options?.onlyMethods || ['GET', 'HEAD'];
    if (!allowedMethods.includes(request.method as any)) {
      return next.handle();
    }

    // Skip caching if no-cache header is present
    if (request.headers['cache-control']?.includes('no-cache')) {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(request, options);
    const cacheTTL = ttl || options?.ttl || 300; // Default 5 minutes

    try {
      // Try to get from cache
      const cachedResponse = await this.cacheManager.get(cacheKey, {
        prefix: 'http:',
      });

      if (cachedResponse) {
        // Set cache headers
        this.setCacheHeaders(response, cacheTTL, true, options);

        // Set Vary header
        if (options?.varyBy && options.varyBy.length > 0) {
          response.setHeader('Vary', options.varyBy.join(', '));
        }

        this.logger.debug(`Cache HIT for ${request.method} ${request.url}`);
        return of(cachedResponse);
      }

      this.logger.debug(`Cache MISS for ${request.method} ${request.url}`);

      // Cache miss - execute handler and cache response
      return next.handle().pipe(
        tap(async (data) => {
          try {
            await this.cacheManager.set(cacheKey, data, {
              ttl: cacheTTL,
              prefix: 'http:',
            });

            // Set cache headers
            this.setCacheHeaders(response, cacheTTL, false, options);

            // Set Vary header
            if (options?.varyBy && options.varyBy.length > 0) {
              response.setHeader('Vary', options.varyBy.join(', '));
            }
          } catch (error) {
            this.logger.error(`Failed to cache response for ${request.url}:`, error);
          }
        })
      );
    } catch (error) {
      this.logger.error(`HTTP caching error for ${request.url}:`, error);
      return next.handle();
    }
  }

  private generateCacheKey(request: Request, options?: HttpCacheOptions): string {
    if (options?.keyGenerator) {
      return options.keyGenerator(request);
    }

    const url = options?.excludeQuery ? request.path : request.url;

    const varyHeaders = options?.varyBy
      ? options.varyBy
          .map((header) => `${header}:${request.headers[header.toLowerCase()] || ''}`)
          .join('|')
      : '';

    return `${request.method}:${url}${varyHeaders ? `:${varyHeaders}` : ''}`;
  }

  private setCacheHeaders(
    response: Response,
    ttl: number,
    isHit: boolean,
    options?: HttpCacheOptions
  ): void {
    // Set Cache-Control header
    let cacheControl: string;

    if (options?.cacheControl) {
      if (typeof options.cacheControl === 'function') {
        cacheControl = options.cacheControl(ttl);
      } else {
        cacheControl = options.cacheControl;
      }
    } else {
      cacheControl = `public, max-age=${ttl}`;
    }

    response.setHeader('Cache-Control', cacheControl);

    // Set X-Cache header to indicate hit/miss
    response.setHeader('X-Cache', isHit ? 'HIT' : 'MISS');

    // Set Age header for cached responses
    if (isHit) {
      response.setHeader('Age', '0'); // This would need to be calculated based on cache timestamp
    }

    // Set ETag for cache validation
    response.setHeader('ETag', this.generateETag());
  }

  private generateETag(): string {
    return `"${Date.now().toString(36)}"`;
  }
}
