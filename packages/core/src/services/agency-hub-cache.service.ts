/**
 * Agency Hub Cache Service
 * Provides high-performance caching for agency-related operations
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface CacheOptions {
  ttl?: number;  // Time to live in seconds
  refresh?: boolean;  // Whether to refresh cache on access
}

@Injectable()
export class AgencyHubCacheService {
  private readonly logger = new Logger(AgencyHubCacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private eventEmitter: EventEmitter2
  ) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit for key: ${key}`);
      } else {
        this.logger.debug(`Cache miss for key: ${key}`);
      }
      return value || null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const ttl = options?.ttl || 300; // 5 minutes default
      await this.cacheManager.set(key, value, ttl * 1000); // Convert to milliseconds
      this.logger.debug(`Cache set for key: ${key}, TTL: ${ttl}s`);
      
      // Emit cache set event for monitoring
      this.eventEmitter.emit('cache.set', { key, ttl });
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache delete for key: ${key}`);
      
      // Emit cache delete event
      this.eventEmitter.emit('cache.delete', { key });
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
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
        this.logger.debug(`Computing value for cache key: ${key}`);
        value = await factory();
        await this.set(key, value, options);
      }
      
      return value;
    } catch (error) {
      this.logger.error(`Cache getOrSet error for key ${key}:`, error);
      // If cache fails, still try to compute the value
      return await factory();
    }
  }

  /**
   * Clear all cache entries matching a pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      // This is a simple implementation - in production, you might want
      // to use Redis with SCAN for better performance
      const keys = await this.getKeysMatching(pattern);
      await Promise.all(keys.map(key => this.del(key)));
      
      this.logger.debug(`Cleared ${keys.length} cache entries matching pattern: ${pattern}`);
      
      // Emit pattern clear event
      this.eventEmitter.emit('cache.pattern.clear', { pattern, count: keys.length });
    } catch (error) {
      this.logger.error(`Cache pattern clear error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Agency-specific cache operations
   */

  /**
   * Cache agency data with automatic invalidation
   */
  async cacheAgencyData<T>(agencyId: string, dataType: string, data: T, ttl = 300): Promise<void> {
    const key = `agency:${agencyId}:${dataType}`;
    await this.set(key, data, { ttl });
  }

  /**
   * Get cached agency data
   */
  async getAgencyData<T>(agencyId: string, dataType: string): Promise<T | null> {
    const key = `agency:${agencyId}:${dataType}`;
    return this.get<T>(key);
  }

  /**
   * Clear all cache for a specific agency
   */
  async clearAgencyCache(agencyId: string): Promise<void> {
    await this.clearPattern(`agency:${agencyId}:*`);
  }

  /**
   * Cache swarm execution data
   */
  async cacheSwarmExecution(executionId: string, data: any, ttl = 600): Promise<void> {
    const key = `swarm:execution:${executionId}`;
    await this.set(key, data, { ttl });
  }

  /**
   * Get cached swarm execution data
   */
  async getSwarmExecution(executionId: string): Promise<any | null> {
    const key = `swarm:execution:${executionId}`;
    return this.get(key);
  }

  /**
   * Cache service provider data
   */
  async cacheServiceProvider(agencyId: string, categoryId: string, providers: any[], ttl = 300): Promise<void> {
    const key = `providers:${agencyId}:${categoryId}`;
    await this.set(key, providers, { ttl });
  }

  /**
   * Get cached service providers
   */
  async getServiceProviders(agencyId: string, categoryId: string): Promise<any[] | null> {
    const key = `providers:${agencyId}:${categoryId}`;
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
      // For now, return basic stats
      return {
        totalKeys: 0,
        memoryUsage: 0,
        hitRate: 0
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return {
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
    this.logger.debug(`Warming up cache for agency: ${agencyId}`);
    
    try {
      // This would be implemented to pre-load frequently accessed data
      // For example, agency details, common service categories, etc.
      
      this.eventEmitter.emit('cache.warmup.complete', { agencyId });
    } catch (error) {
      this.logger.error(`Cache warmup error for agency ${agencyId}:`, error);
    }
  }

  /**
   * Private helper methods
   */

  private async getKeysMatching(pattern: string): Promise<string[]> {
    // This is a simplified implementation
    // In production with Redis, you'd use SCAN with MATCH
    // For now, return empty array as we don't have access to underlying keys
    return [];
  }
}
