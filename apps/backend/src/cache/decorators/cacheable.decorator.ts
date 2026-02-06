import { SetMetadata } from '@nestjs/common';

export const CACHEABLE_KEY = 'cacheable';
export const CACHE_EVICT_KEY = 'cache_evict';
export const CACHE_INVALIDATE_KEY = 'cache_invalidate';

export interface CacheableOptions {
  /**
   * Cache key or key generator function
   * If not provided, will use method name and arguments
   */
  key?: string | ((...args: any[]) => string);

  /**
   * Time to live in seconds
   */
  ttl?: number;

  /**
   * Cache key prefix
   */
  prefix?: string;

  /**
   * Tags for cache invalidation
   */
  tags?: string[];

  /**
   * Condition to determine if caching should be applied
   */
  condition?: (...args: any[]) => boolean;
}

export interface CacheEvictOptions {
  /**
   * Cache key or key generator function
   */
  key?: string | ((...args: any[]) => string);

  /**
   * Evict all keys matching this pattern
   */
  pattern?: string;

  /**
   * Evict by tags
   */
  tags?: string[];

  /**
   * When to evict: 'before' or 'after' method execution
   */
  when?: 'before' | 'after';

  /**
   * Cache key prefix
   */
  prefix?: string;
}

export interface CacheInvalidateOptions {
  /**
   * Cache keys to invalidate
   */
  keys?: string[];

  /**
   * Patterns to match for invalidation
   */
  patterns?: string[];

  /**
   * Tags to invalidate
   */
  tags?: string[];

  /**
   * When to invalidate: 'before' or 'after' method execution
   */
  when?: 'before' | 'after';

  /**
   * Cache key prefix
   */
  prefix?: string;
}

/**
 * Decorator to cache method results
 *
 * @example
 * ```typescript
 * @Cacheable({ ttl: 300, prefix: 'user' })
 * async getUser(id: string) {
 *   return this.userRepository.findOne(id);
 * }
 *
 * @Cacheable({
 *   key: (id, name) => `user:${id}:${name}`,
 *   ttl: 600,
 *   tags: ['users']
 * })
 * async findUser(id: string, name: string) {
 *   return this.userRepository.find({ id, name });
 * }
 * ```
 */
export const Cacheable = (options: CacheableOptions = {}): MethodDecorator => {
  return SetMetadata(CACHEABLE_KEY, options);
};

/**
 * Decorator to evict cache entries
 *
 * @example
 * ```typescript
 * @CacheEvict({ key: (id) => `user:${id}`, when: 'after' })
 * async updateUser(id: string, data: any) {
 *   return this.userRepository.update(id, data);
 * }
 *
 * @CacheEvict({ pattern: 'user:*', when: 'after' })
 * async updateAllUsers() {
 *   return this.userRepository.updateAll();
 * }
 *
 * @CacheEvict({ tags: ['users'], when: 'after' })
 * async createUser(data: any) {
 *   return this.userRepository.create(data);
 * }
 * ```
 */
export const CacheEvict = (options: CacheEvictOptions = {}): MethodDecorator => {
  return SetMetadata(CACHE_EVICT_KEY, options);
};

/**
 * Decorator to invalidate multiple cache entries
 *
 * @example
 * ```typescript
 * @CacheInvalidate({
 *   keys: ['users:list', 'users:count'],
 *   patterns: ['user:*'],
 *   tags: ['users', 'analytics'],
 *   when: 'after'
 * })
 * async bulkUpdateUsers(userIds: string[]) {
 *   return this.userRepository.bulkUpdate(userIds);
 * }
 * ```
 */
export const CacheInvalidate = (options: CacheInvalidateOptions = {}): MethodDecorator => {
  return SetMetadata(CACHE_INVALIDATE_KEY, options);
};

/**
 * Combine multiple cache decorators
 *
 * @example
 * ```typescript
 * @Cacheable({ key: (id) => `user:${id}`, ttl: 300 })
 * @CacheEvict({ pattern: 'users:*', when: 'after' })
 * async updateAndCacheUser(id: string, data: any) {
 *   return this.userRepository.update(id, data);
 * }
 * ```
 */
export const CacheableAndEvict = (
  cacheableOptions: CacheableOptions = {},
  evictOptions: CacheEvictOptions = {}
) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Cacheable(cacheableOptions)(target, propertyKey, descriptor);
    CacheEvict(evictOptions)(target, propertyKey, descriptor);
  };
};
