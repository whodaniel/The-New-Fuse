import { SetMetadata } from '@nestjs/common';
import {
  CACHE_KEY_METADATA,
  CACHE_OPTIONS_METADATA,
  SKIP_CACHE_METADATA,
} from './cache.interceptor';
import { CacheOptions } from './response-cache.service';

/**
 * Cache the response of an endpoint
 *
 * @example
 * @CacheResponse({ ttl: 300, tags: ['users'] })
 * async getUsers() { ... }
 */
export const CacheResponse = (options: CacheOptions = {}) =>
  SetMetadata(CACHE_OPTIONS_METADATA, options);

/**
 * Set custom cache key for an endpoint
 *
 * @example
 * @CacheKey('custom:key:users')
 * async getUsers() { ... }
 */
export const CacheKey = (key: string) => SetMetadata(CACHE_KEY_METADATA, key);

/**
 * Skip caching for an endpoint
 *
 * @example
 * @SkipCache()
 * async getDynamicData() { ... }
 */
export const SkipCache = () => SetMetadata(SKIP_CACHE_METADATA, true);

/**
 * Common cache TTL presets (in seconds)
 */
export const CacheTTL = {
  /** 30 seconds - for rapidly changing data */
  VERY_SHORT: 30,

  /** 1 minute - for frequently updated data */
  SHORT: 60,

  /** 5 minutes - default for most endpoints */
  MEDIUM: 300,

  /** 15 minutes - for semi-static data */
  LONG: 900,

  /** 1 hour - for static data */
  VERY_LONG: 3600,

  /** 24 hours - for rarely changing data */
  DAY: 86400,

  /** 1 week - for static assets */
  WEEK: 604800,

  /** 1 month - for immutable data */
  MONTH: 2592000,
};

/**
 * Predefined cache configurations for common use cases
 */
export const CachePresets = {
  /**
   * User profile data - medium TTL with user tags
   */
  USER_PROFILE: {
    ttl: CacheTTL.MEDIUM,
    tags: ['users'],
    refreshThreshold: 60,
  },

  /**
   * Dashboard data - short TTL with multiple tags
   */
  DASHBOARD: {
    ttl: CacheTTL.SHORT,
    tags: ['dashboard', 'analytics'],
    refreshThreshold: 15,
  },

  /**
   * Search results - medium TTL with search tags
   */
  SEARCH_RESULTS: {
    ttl: CacheTTL.MEDIUM,
    tags: ['search'],
    refreshThreshold: 60,
  },

  /**
   * List endpoints - medium TTL
   */
  LIST: {
    ttl: CacheTTL.MEDIUM,
    refreshThreshold: 60,
  },

  /**
   * Static data - very long TTL
   */
  STATIC: {
    ttl: CacheTTL.VERY_LONG,
    refreshThreshold: 600,
  },

  /**
   * Analytics data - long TTL with analytics tags
   */
  ANALYTICS: {
    ttl: CacheTTL.LONG,
    tags: ['analytics'],
    refreshThreshold: 180,
  },

  /**
   * Configuration - very long TTL with config tags
   */
  CONFIG: {
    ttl: CacheTTL.VERY_LONG,
    tags: ['config'],
    refreshThreshold: 600,
  },

  /**
   * Public API - long TTL
   */
  PUBLIC_API: {
    ttl: CacheTTL.LONG,
    refreshThreshold: 180,
  },
};

/**
 * Invalidate cache by tags - use with mutation endpoints
 *
 * @example
 * @InvalidateCache(['users', 'dashboard'])
 * async updateUser() { ... }
 */
export const InvalidateCache = (tags: string[]) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // Invalidate cache after successful mutation
      const cacheService = (this as any).cacheService;
      if (cacheService && tags.length > 0) {
        for (const tag of tags) {
          await cacheService.invalidateByTag(tag);
        }
      }

      return result;
    };

    return descriptor;
  };
};
