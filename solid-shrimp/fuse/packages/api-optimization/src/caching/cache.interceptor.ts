import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, tap } from 'rxjs';
import { Request, Response } from 'express';
import { ResponseCacheService, CacheOptions } from './response-cache.service';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_OPTIONS_METADATA = 'cache:options';
export const SKIP_CACHE_METADATA = 'cache:skip';

/**
 * Response caching interceptor
 *
 * Usage:
 * @UseInterceptors(CacheInterceptor)
 * @CacheResponse({ ttl: 300, tags: ['users'] })
 * async getUsers() { ... }
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private cacheService: ResponseCacheService,
    private reflector: Reflector
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    // Check if caching should be skipped
    const skipCache = this.reflector.getAllAndOverride<boolean>(
      SKIP_CACHE_METADATA,
      [context.getHandler(), context.getClass()]
    );

    if (skipCache) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Get cache configuration
    const cacheOptions = this.reflector.getAllAndOverride<CacheOptions>(
      CACHE_OPTIONS_METADATA,
      [context.getHandler(), context.getClass()]
    ) || {};

    const cacheKey = this.getCacheKey(context, request);

    try {
      // Check cache
      const cachedResponse = await this.cacheService.get(cacheKey, cacheOptions);

      if (cachedResponse) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);

        // Set cache headers
        this.setCacheHeaders(response, cacheOptions);
        response.setHeader('X-Cache', 'HIT');

        // Return cached response
        return of(cachedResponse);
      }

      // Cache miss - execute handler and cache response
      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      response.setHeader('X-Cache', 'MISS');

      return next.handle().pipe(
        tap(async (data) => {
          // Only cache successful responses
          if (data && !response.headersSent) {
            await this.cacheService.set(cacheKey, data, cacheOptions);
            this.setCacheHeaders(response, cacheOptions);
          }
        })
      );
    } catch (error) {
      this.logger.error(`Cache interceptor error for key ${cacheKey}:`, error);
      // Continue without caching on error
      return next.handle();
    }
  }

  private getCacheKey(context: ExecutionContext, request: Request): string {
    // Get custom cache key from metadata
    const customKey = this.reflector.getAllAndOverride<string>(
      CACHE_KEY_METADATA,
      [context.getHandler(), context.getClass()]
    );

    if (customKey) {
      return customKey;
    }

    // Generate cache key from route and query parameters
    const { url, query, params, user } = request as any;

    const parts = [
      request.method,
      url.split('?')[0], // Base URL without query string
      JSON.stringify(query || {}),
      JSON.stringify(params || {})
    ];

    // Include user ID if authenticated
    if (user?.id) {
      parts.push(`user:${user.id}`);
    }

    return this.hashKey(parts.join(':'));
  }

  private setCacheHeaders(response: Response, options: CacheOptions): void {
    const ttl = options.ttl || 300;

    // Set Cache-Control header
    response.setHeader('Cache-Control', `public, max-age=${ttl}`);

    // Set Expires header
    const expiryDate = new Date(Date.now() + ttl * 1000);
    response.setHeader('Expires', expiryDate.toUTCString());

    // Set ETag if available
    // ETag is set by the cache service
  }

  private hashKey(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
