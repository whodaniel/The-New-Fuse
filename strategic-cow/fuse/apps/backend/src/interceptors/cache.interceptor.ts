import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { RedisService } from '../services/redis.service';

/**
 * Cache Interceptor for GET requests
 * Uses Redis for distributed caching
 * Configurable TTL per endpoint
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Generate cache key from URL and query params
    const cacheKey = `cache:${request.url}`;

    try {
      // Check if cached response exists
      const cachedResponse = await this.redisService.get(cacheKey);

      if (cachedResponse) {
        // Return cached response
        return of(JSON.parse(cachedResponse));
      }

      // If not cached, proceed with request and cache the response
      return next.handle().pipe(
        tap(async (data) => {
          // Cache the response for 5 minutes (300 seconds)
          // This can be configured per endpoint using custom decorators
          const ttl = 300;
          await this.redisService.set(cacheKey, JSON.stringify(data), ttl);
        }),
      );
    } catch (error) {
      // If Redis fails, proceed without caching
      console.error('Cache error:', error);
      return next.handle();
    }
  }
}
