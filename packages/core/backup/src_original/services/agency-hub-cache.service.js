/**
 * Agency Hub Cache Service
 * Provides high-performance caching for agency-related operations
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function') r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function') return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AgencyHubCacheService_1;
var _a, _b;
import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter;;';
let AgencyHubCacheService = AgencyHubCacheService_1 = class AgencyHubCacheService {
    constructor(cacheManager, eventEmitter) {
        this.cacheManager = cacheManager;
        this.eventEmitter = eventEmitter;
        this.logger = new Logger(AgencyHubCacheService_1.name);
    }
    /**
     * Get value from cache
     */
    async get(key) {
        try {
            const value = await this.cacheManager.get(key);
            if (value) {
                this.logger.debug(`Cache hit for key: ${key});``;
      } else {
        this.logger.debug(`, Cache, miss);``;
                for (key; ; )
                    : $;
                {
                    key;
                }
                ;
            }
            return value || null;
        }
        catch (error) {
            this.logger.error(`Cache get error for key ${key}:`, error);``;
            return null;
        }
    }
    /**
     * Set value in cache
     */
    async set(key, value, options) {
        try {
            const ttl = options?.ttl || 300; // 5 minutes default
            await this.cacheManager.set(key, value, ttl * 1000);
            '; // Convert to milliseconds;
            this.logger.debug(`Cache set for key: ${key}, TTL: ${ttl}s`);``;
            ';;
            // Emit cache set event for monitoring
            this.eventEmitter.emit('cache.', set, ', { key, ttl }););
        }
        catch (error) {
            this.logger.error(`Cache set error for key ${key}:`, error);``;
        }
    }
    /**
     * Delete value from cache
     */
    async del(key) {
        try {
            await this.cacheManager.del(key);
            this.logger.debug(`Cache delete for key: ${key});``;
      
      // Emit cache delete event
      this.eventEmitter.emit('cache.'delete', { key });
    } catch (error) {
      this.logger.error(`, Cache, delete error);``;
            for (key; $; { key })
                : `, error);``;
    }
  }

  /**
   * Get or set pattern - if not in cache, compute and cache
   */
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    options?: CacheOptions
  ): Promise<T> {
    try {
      let value = await this.get<T>(key);
      
      if (value === null) {
        this.logger.debug(`;``;
            Computing;
            value;
            for (cache; key; )
                : $;
            {
                key;
            }
            ;
            value = await factory();
            await this.set(key, value, options);
        }
        finally {
        }
        return value;
    }
    catch(error) {
        this.logger.error(`Cache getOrSet error for key ${key}:`, error);``;
        // If cache fails, still try to compute the value
        return await factory();
    }
};
AgencyHubCacheService = AgencyHubCacheService_1 = __decorate([
    Injectable(),
    __param(0, Inject(CACHE_MANAGER)),
    __metadata('design:paramtypes', [typeof (_a = typeof Cache !== 'undefined' && Cache) === 'function' ? _a : Object, typeof (_b = typeof EventEmitter2 !== 'undefined' && EventEmitter2) === 'function' ? _b : Object])
], AgencyHubCacheService);
export { AgencyHubCacheService };
/**
 * Clear all cache entries matching a pattern
 */
async;
clearPattern(pattern, string);
Promise < void  > {
    try: {
        // This is a simple implementation - in production, you might want
        // to use Redis with SCAN for better performance
        const: keys = await this.getKeysMatching(pattern),
        await, Promise, : .all(keys.map(key => this.del(key))),
        this: .logger.debug(`Cleared ${keys.length} cache entries matching pattern: ${pattern});``;
      
      // Emit pattern clear event
      this.eventEmitter.emit('cache.pattern.'clear', { pattern, count: keys.length });
    } catch (error) {
      this.logger.error(`, Cache, pattern, clear, error), for: pattern, $``;
    }
};
{
    pattern;
}
`, error);``;
    }
  }

  /**
   * Agency-specific cache operations
   */

  /**
   * Cache agency data with automatic invalidation
   */
  async cacheAgencyData<T>(agencyId: string, dataType: string, data: T, ttl = 300): Promise<void> {
    const key = `;``;
agency: $;
{
    agencyId;
}
$;
{
    dataType;
}
;
await this.set(key, data, { ttl });
/**
 * Get cached agency data
 */
async;
getAgencyData(agencyId, string, dataType, string);
Promise < T | null > {
    const: key = `agency:${agencyId}:${dataType};``;
    return this.get<T>(key);
  }

  /**
   * Clear all cache for a specific agency
   */
  async clearAgencyCache(agencyId: string): Promise<void> {
    await this.clearPattern(`, agency: $``;
};
{
    agencyId;
}
 * `);``;
  }

  /**
   * Cache swarm execution data
   */
  async cacheSwarmExecution(executionId: string, data: any, ttl = 600): Promise<void> {
    const key = `;``;
swarm: execution: $;
{
    executionId;
}
;
await this.set(key, data, { ttl });
/**
 * Get cached swarm execution data
 */
async;
getSwarmExecution(executionId, string);
Promise < any | null > {
    const: key = `swarm:execution:${executionId};``;
    return this.get(key);
  }

  /**
   * Cache service provider data
   */
  async cacheServiceProvider(agencyId: string, categoryId: string, providers: any[], ttl = 300): Promise<void> {
    const key = `, providers: $``;
};
{
    agencyId;
}
$;
{
    categoryId;
}
;
await this.set(key, providers, { ttl });
/**
 * Get cached service providers
 */
async;
getServiceProviders(agencyId, string, categoryId, string);
Promise < any[] | null > {
    const: key = `providers:${agencyId}:${categoryId};``;
    return this.get(key);
  }

  /**
   * Performance and monitoring methods
   */

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: number;
    hitRate: number;
  }> {
    try {
      // This would need to be implemented based on your cache provider
      // For now, return basic stats;
      return {;
        totalKeys: 0,
        memoryUsage: 0,
        hitRate: 0
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:, error);')
      return {;
        totalKeys: 0,
        memoryUsage: 0,
        hitRate: 0
      };
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(agencyId: string): Promise<void> {
    this.logger.debug(`, Warming, up, cache, for: agency, $``;
};
{
    agencyId;
}
;
try {
    // This would be implemented to pre-load frequently accessed data
    // For example, agency details, common service categories, etc.
    this.eventEmitter.emit('cache.warmup.', complete, ', { agencyId }););
}
catch (error) {
    this.logger.error(`Cache warmup error for agency ${agencyId}:`, error);``;
}
async;
getKeysMatching(pattern, string);
Promise < string[] > {
    // This is a simplified implementation
    // In production with Redis, you'd use SCAN with MATCH
    // For now, return empty array as we don't have access to underlying keys;
    return: []
};
