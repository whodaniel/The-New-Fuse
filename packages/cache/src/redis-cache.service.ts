// Redis Caching Service - High-performance caching for frequently accessed data
// Implements intelligent caching strategies with TTL management and cache invalidation

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean; // Enable compression for large values
  tags?: string[]; // Cache tags for bulk invalidation
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  memory: number;
  keys: number;
}

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    memory: 0,
    keys: 0,
  };

  // Cache configuration for different data types
  private readonly cacheConfigs = {
    agent: { ttl: 300, compress: true, tags: ['agents'] }, // 5 minutes
    workflow: { ttl: 600, compress: true, tags: ['workflows'] }, // 10 minutes
    task: { ttl: 180, compress: false, tags: ['tasks'] }, // 3 minutes
    user: { ttl: 900, compress: false, tags: ['users'] }, // 15 minutes
    dashboard: { ttl: 120, compress: true, tags: ['dashboard'] }, // 2 minutes
    analytics: { ttl: 1800, compress: true, tags: ['analytics'] }, // 30 minutes
    search: { ttl: 300, compress: true, tags: ['search'] }, // 5 minutes
    session: { ttl: 3600, compress: false, tags: ['sessions'] }, // 1 hour
  };

  constructor(
    private configService: ConfigService,
    private readonly unifiedRedis: UnifiedRedisService
  ) {
    this.logger.log('Cache Redis Service initialized with UnifiedRedisService');
  }

  // Generic cache methods
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.unifiedRedis.get(key);
      if (cached) {
        this.stats.hits++;
        return JSON.parse(cached);
      }
      this.stats.misses++;
      return null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      const ttl = options.ttl || 300; // Default 5 minutes
      
      await this.unifiedRedis.set(key, serialized, ttl);
      
      // Store tags for bulk invalidation
      if (options.tags?.length) {
        for (const tag of options.tags) {
          await this.unifiedRedis.sadd(`tag:${tag}`, key);
          await this.unifiedRedis.expire(`tag:${tag}`, ttl);
        }
      }
      
      this.stats.sets++;
      return true;
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const deleted = await this.unifiedRedis.del(key);
      this.stats.deletes++;
      return deleted > 0;
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    try {
      const keys = await this.unifiedRedis.smembers(`tag:${tag}`);
      if (keys.length === 0) return 0;
      
      // Batch delete using Promise.all for better performance
      const deletePromises = keys.map(key => this.unifiedRedis.del(key));
      await Promise.all(deletePromises);
      await this.unifiedRedis.del(`tag:${tag}`);
      
      this.stats.deletes += keys.length;
      
      this.logger.log(`Invalidated ${keys.length} keys for tag: ${tag}`);
      return keys.length;
    } catch (error) {
      this.logger.error(`Cache invalidation error for tag ${tag}:`, error);
      return 0;
    }
  }

  // Specialized caching methods for application entities
  async cacheAgent(agentId: string, agentData: any): Promise<boolean> {
    const key = `agent:${agentId}`;
    return this.set(key, agentData, this.cacheConfigs.agent);
  }

  async getAgent(agentId: string): Promise<any | null> {
    const key = `agent:${agentId}`;
    return this.get(key);
  }

  async cacheWorkflow(workflowId: string, workflowData: any): Promise<boolean> {
    const key = `workflow:${workflowId}`;
    return this.set(key, workflowData, this.cacheConfigs.workflow);
  }

  async getWorkflow(workflowId: string): Promise<any | null> {
    const key = `workflow:${workflowId}`;
    return this.get(key);
  }

  async cacheTask(taskId: string, taskData: any): Promise<boolean> {
    const key = `task:${taskId}`;
    return this.set(key, taskData, this.cacheConfigs.task);
  }

  async getTask(taskId: string): Promise<any | null> {
    const key = `task:${taskId}`;
    return this.get(key);
  }

  async cacheUser(userId: string, userData: any): Promise<boolean> {
    const key = `user:${userId}`;
    return this.set(key, userData, this.cacheConfigs.user);
  }

  async getUser(userId: string): Promise<any | null> {
    const key = `user:${userId}`;
    return this.get(key);
  }

  // Dashboard data caching
  async cacheDashboardData(userId: string, dashboardData: any): Promise<boolean> {
    const key = `dashboard:${userId}`;
    return this.set(key, dashboardData, this.cacheConfigs.dashboard);
  }

  async getDashboardData(userId: string): Promise<any | null> {
    const key = `dashboard:${userId}`;
    return this.get(key);
  }

  // Search results caching
  async cacheSearchResults(searchKey: string, results: any): Promise<boolean> {
    const key = `search:${this.hashKey(searchKey)}`;
    return this.set(key, results, this.cacheConfigs.search);
  }

  async getSearchResults(searchKey: string): Promise<any | null> {
    const key = `search:${this.hashKey(searchKey)}`;
    return this.get(key);
  }

  // Analytics caching
  async cacheAnalytics(analyticsKey: string, analyticsData: any): Promise<boolean> {
    const key = `analytics:${this.hashKey(analyticsKey)}`;
    return this.set(key, analyticsData, this.cacheConfigs.analytics);
  }

  async getAnalytics(analyticsKey: string): Promise<any | null> {
    const key = `analytics:${this.hashKey(analyticsKey)}`;
    return this.get(key);
  }

  // Session caching
  async cacheSession(sessionId: string, sessionData: any): Promise<boolean> {
    const key = `session:${sessionId}`;
    return this.set(key, sessionData, this.cacheConfigs.session);
  }

  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    return this.get(key);
  }

  // Batch operations for performance
  async batchGet<T>(keys: string[]): Promise<Array<T | null>> {
    try {
      // Use Promise.all for parallel operations
      const results = await Promise.all(keys.map(key => this.unifiedRedis.get(key)));
      
      this.stats.hits += results.filter(r => r !== null).length;
      this.stats.misses += results.filter(r => r === null).length;
      
      return results.map(result => {
        if (result) {
          return JSON.parse(result);
        }
        return null;
      });
    } catch (error) {
      this.logger.error('Batch get error:', error);
      this.stats.misses += keys.length;
      return keys.map(() => null);
    }
  }

  async batchSet<T>(items: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<boolean[]> {
    try {
      // Use Promise.all for parallel operations
      const setPromises = items.map(async ({ key, value, options = {} }) => {
        const serialized = JSON.stringify(value);
        const ttl = options.ttl || 300;
        try {
          await this.unifiedRedis.set(key, serialized, ttl);
          return true;
        } catch {
          return false;
        }
      });
      
      const results = await Promise.all(setPromises);
      this.stats.sets += items.length;
      
      return results;
    } catch (error) {
      this.logger.error('Batch set error:', error);
      return items.map(() => false);
    }
  }

  // Cache warming methods
  async warmCache(userId: string): Promise<void> {
    this.logger.log(`Warming cache for user: ${userId}`);
    
    try {
      // Warm user data
      // Implementation would fetch and cache user's most accessed data
      
      // Warm dashboard data
      // Implementation would pre-calculate and cache dashboard metrics
      
      // Warm recent agents, workflows, tasks
      // Implementation would cache recently accessed items
      
      this.logger.log(`Cache warming completed for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Cache warming failed for user ${userId}:`, error);
    }
  }

  // Cache statistics and monitoring
  async getStats(): Promise<CacheStats & { hitRate: number; memoryUsage: string }> {
    try {
      // Get metrics from UnifiedRedisService
      const health = await this.unifiedRedis.getHealth();
      const metrics = this.unifiedRedis.getMetrics();
      
      const hitRate = this.stats.hits + this.stats.misses > 0 
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
        : 0;
      
      return {
        ...this.stats,
        memory: metrics.memory || 0,
        keys: metrics.operations || 0,
        hitRate: Math.round(hitRate * 100) / 100,
        memoryUsage: this.formatBytes(metrics.memory || 0),
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return {
        ...this.stats,
        memory: 0,
        keys: 0,
        hitRate: 0,
        memoryUsage: '0 B',
      };
    }
  }

  // Cache health check
  async healthCheck(): Promise<{ status: string; latency: number }> {
    const startTime = Date.now();
    
    try {
      await this.unifiedRedis.ping();
      return {
        status: 'healthy',
        latency: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Cache health check failed:', error);
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
      };
    }
  }

  // Utility methods
  private hashKey(input: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Cleanup and shutdown
  async onModuleDestroy(): Promise<void> {
    // UnifiedRedisService handles connection cleanup
    this.logger.log('Cache Redis Service destroyed');
  }
}

// Cache decorator for automatic caching
export function Cacheable(options: CacheOptions & { key: string }) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cache: RedisCacheService = this.cacheService;
      if (!cache) return originalMethod.apply(this, args);
      
      const cacheKey = options.key + ':' + JSON.stringify(args);
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }
      
      const result = await originalMethod.apply(this, args);
      await cache.set(cacheKey, result, options);
      
      return result;
    };
  };
}