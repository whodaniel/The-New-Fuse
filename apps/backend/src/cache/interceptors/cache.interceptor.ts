import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
// @ts-ignore
import { Observable, from } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  CACHEABLE_KEY,
  CACHE_EVICT_KEY,
  CACHE_INVALIDATE_KEY,
  CacheEvictOptions,
  CacheInvalidateOptions,
  CacheableOptions,
} from '../decorators/cacheable.decorator.js';
import { AdvancedCacheManager } from '../services/advanced-cache.manager.js';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheManager: AdvancedCacheManager
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const cacheableOptions = this.reflector.get<CacheableOptions>(
      CACHEABLE_KEY,
      context.getHandler()
    );

    const evictOptions = this.reflector.get<CacheEvictOptions>(
      CACHE_EVICT_KEY,
      context.getHandler()
    );

    const invalidateOptions = this.reflector.get<CacheInvalidateOptions>(
      CACHE_INVALIDATE_KEY,
      context.getHandler()
    );

    const _request = context.switchToHttp().getRequest();
    const methodArgs = context.getArgs();

    // Handle cache eviction before method execution
    if (evictOptions && evictOptions.when === 'before') {
      this.handleEviction(evictOptions, methodArgs);
    }

    // Handle cache invalidation before method execution
    if (invalidateOptions && invalidateOptions.when === 'before') {
      this.handleInvalidation(invalidateOptions, methodArgs);
    }

    // Handle cacheable
    if (cacheableOptions) {
      return this.handleCacheable(cacheableOptions, methodArgs, next, () => {
        // Handle eviction/invalidation after method execution
        return this.handlePostExecution(evictOptions, invalidateOptions, methodArgs);
      });
    }

    // No caching, just handle eviction/invalidation after execution
    return next.handle().pipe(
      tap(() => {
        this.handlePostExecution(evictOptions, invalidateOptions, methodArgs);
      })
    );
  }

  private handleCacheable(
    options: CacheableOptions,
    methodArgs: any[],
    next: CallHandler,
    afterCallback: () => void
  ): Observable<any> {
    // Check condition
    if (options.condition && !options.condition(...methodArgs)) {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(options.key, methodArgs);

    return from(
      this.cacheManager.getOrSet(
        cacheKey,
        async () => {
          const result = await next.handle().toPromise();
          afterCallback();
          return result;
        },
        {
          ttl: options.ttl,
          prefix: options.prefix,
          tags: options.tags,
        }
      )
    );
  }

  private handlePostExecution(
    evictOptions: CacheEvictOptions | undefined,
    invalidateOptions: CacheInvalidateOptions | undefined,
    methodArgs: any[]
  ): void {
    if (evictOptions && evictOptions.when === 'after') {
      this.handleEviction(evictOptions, methodArgs);
    }

    if (invalidateOptions && invalidateOptions.when === 'after') {
      this.handleInvalidation(invalidateOptions, methodArgs);
    }
  }

  private handleEviction(options: CacheEvictOptions, methodArgs: any[]): void {
    try {
      // Evict by specific key
      if (options.key) {
        const cacheKey = this.generateCacheKey(options.key, methodArgs);
        this.cacheManager.delete(cacheKey, { prefix: options.prefix });
      }

      // Evict by pattern
      if (options.pattern) {
        this.cacheManager.deletePattern(options.pattern, { prefix: options.prefix });
      }

      // Evict by tags
      if (options.tags && options.tags.length > 0) {
        this.cacheManager.invalidateByTags(options.tags);
      }
    } catch (error) {
      this.logger.error('Failed to evict cache:', error);
    }
  }

  private handleInvalidation(options: CacheInvalidateOptions, _methodArgs: any[]): void {
    try {
      // Invalidate specific keys
      if (options.keys && options.keys.length > 0) {
        for (const key of options.keys) {
          this.cacheManager.delete(key, { prefix: options.prefix });
        }
      }

      // Invalidate by patterns
      if (options.patterns && options.patterns.length > 0) {
        for (const pattern of options.patterns) {
          this.cacheManager.deletePattern(pattern, { prefix: options.prefix });
        }
      }

      // Invalidate by tags
      if (options.tags && options.tags.length > 0) {
        this.cacheManager.invalidateByTags(options.tags);
      }
    } catch (error) {
      this.logger.error('Failed to invalidate cache:', error);
    }
  }

  private generateCacheKey(
    keyOption: string | ((...args: any[]) => string) | undefined,
    methodArgs: any[]
  ): string {
    if (typeof keyOption === 'function') {
      return keyOption(...methodArgs);
    }

    if (typeof keyOption === 'string') {
      return keyOption;
    }

    // Default: create key from method arguments
    return this.createDefaultKey(methodArgs);
  }

  private createDefaultKey(args: any[]): string {
    try {
      return JSON.stringify(args);
    } catch {
      return args.map((arg) => String(arg)).join(':');
    }
  }
}
