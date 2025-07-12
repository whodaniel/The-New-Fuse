// Redis Caching Service - High-performance caching for frequently accessed data
// Implements intelligent caching strategies with TTL management and cache invalidation
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RedisCacheService_1;
import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
let RedisCacheService = RedisCacheService_1 = class RedisCacheService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new Logger(RedisCacheService_1.name);
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            memory: 0,
            keys: 0,
        };
        // Cache configuration for different data types
        this.cacheConfigs = {
            agent: { ttl: 300, compress: true, tags: ['agents'] }, // 5 minutes
            workflow: { ttl: 600, compress: true, tags: ['workflows'] }, // 10 minutes
            task: { ttl: 180, compress: false, tags: ['tasks'] }, // 3 minutes
            user: { ttl: 900, compress: false, tags: ['users'] }, // 15 minutes
            dashboard: { ttl: 120, compress: true, tags: ['dashboard'] }, // 2 minutes
            analytics: { ttl: 1800, compress: true, tags: ['analytics'] }, // 30 minutes
            search: { ttl: 300, compress: true, tags: ['search'] }, // 5 minutes
            session: { ttl: 3600, compress: false, tags: ['sessions'] }, // 1 hour
        };
        this.initializeRedis();
    }
    initializeRedis() {
        const redisConfig = {
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            db: this.configService.get('REDIS_DB', 0),
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            keepAlive: 30000,
            connectTimeout: 10000,
            commandTimeout: 5000,
        };
        this.redis = new Redis(redisConfig);
        this.redis.on('connect', () => {
            this.logger.log('Connected to Redis');
        });
        this.redis.on('error', (error) => {
            this.logger.error('Redis connection error:', error);
        });
        this.redis.on('ready', () => {
            this.logger.log('Redis connection ready');
        });
    }
    // Generic cache methods
    async get(key) {
        try {
            const cached = await this.redis.get(key);
            if (cached) {
                this.stats.hits++;
                return JSON.parse(cached);
            }
            this.stats.misses++;
            return null;
        }
        catch (error) {
            this.logger.error(`Cache get error for key ${key}:`, error);
            this.stats.misses++;
            return null;
        }
    }
    async set(key, value, options = {}) {
        try {
            const serialized = JSON.stringify(value);
            const ttl = options.ttl || 300; // Default 5 minutes
            await this.redis.setex(key, ttl, serialized);
            // Store tags for bulk invalidation
            if (options.tags?.length) {
                for (const tag of options.tags) {
                    await this.redis.sadd(`tag:${tag}`, key);
                    await this.redis.expire(`tag:${tag}`, ttl);
                }
            }
            this.stats.sets++;
            return true;
        }
        catch (error) {
            this.logger.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }
    async delete(key) {
        try {
            const deleted = await this.redis.del(key);
            this.stats.deletes++;
            return deleted > 0;
        }
        catch (error) {
            this.logger.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }
    async invalidateByTag(tag) {
        try {
            const keys = await this.redis.smembers(`tag:${tag}`);
            if (keys.length === 0)
                return 0;
            const pipeline = this.redis.pipeline();
            keys.forEach(key => pipeline.del(key));
            pipeline.del(`tag:${tag}`);
            await pipeline.exec();
            this.stats.deletes += keys.length;
            this.logger.log(`Invalidated ${keys.length} keys for tag: ${tag}`);
            return keys.length;
        }
        catch (error) {
            this.logger.error(`Cache invalidation error for tag ${tag}:`, error);
            return 0;
        }
    }
    // Specialized caching methods for application entities
    async cacheAgent(agentId, agentData) {
        const key = `agent:${agentId}`;
        return this.set(key, agentData, this.cacheConfigs.agent);
    }
    async getAgent(agentId) {
        const key = `agent:${agentId}`;
        return this.get(key);
    }
    async cacheWorkflow(workflowId, workflowData) {
        const key = `workflow:${workflowId}`;
        return this.set(key, workflowData, this.cacheConfigs.workflow);
    }
    async getWorkflow(workflowId) {
        const key = `workflow:${workflowId}`;
        return this.get(key);
    }
    async cacheTask(taskId, taskData) {
        const key = `task:${taskId}`;
        return this.set(key, taskData, this.cacheConfigs.task);
    }
    async getTask(taskId) {
        const key = `task:${taskId}`;
        return this.get(key);
    }
    async cacheUser(userId, userData) {
        const key = `user:${userId}`;
        return this.set(key, userData, this.cacheConfigs.user);
    }
    async getUser(userId) {
        const key = `user:${userId}`;
        return this.get(key);
    }
    // Dashboard data caching
    async cacheDashboardData(userId, dashboardData) {
        const key = `dashboard:${userId}`;
        return this.set(key, dashboardData, this.cacheConfigs.dashboard);
    }
    async getDashboardData(userId) {
        const key = `dashboard:${userId}`;
        return this.get(key);
    }
    // Search results caching
    async cacheSearchResults(searchKey, results) {
        const key = `search:${this.hashKey(searchKey)}`;
        return this.set(key, results, this.cacheConfigs.search);
    }
    async getSearchResults(searchKey) {
        const key = `search:${this.hashKey(searchKey)}`;
        return this.get(key);
    }
    // Analytics caching
    async cacheAnalytics(analyticsKey, analyticsData) {
        const key = `analytics:${this.hashKey(analyticsKey)}`;
        return this.set(key, analyticsData, this.cacheConfigs.analytics);
    }
    async getAnalytics(analyticsKey) {
        const key = `analytics:${this.hashKey(analyticsKey)}`;
        return this.get(key);
    }
    // Session caching
    async cacheSession(sessionId, sessionData) {
        const key = `session:${sessionId}`;
        return this.set(key, sessionData, this.cacheConfigs.session);
    }
    async getSession(sessionId) {
        const key = `session:${sessionId}`;
        return this.get(key);
    }
    // Batch operations for performance
    async batchGet(keys) {
        try {
            const pipeline = this.redis.pipeline();
            keys.forEach(key => pipeline.get(key));
            const results = await pipeline.exec();
            this.stats.hits += results.filter(r => r[1]).length;
            this.stats.misses += results.filter(r => !r[1]).length;
            return results.map(result => {
                if (result[1]) {
                    return JSON.parse(result[1]);
                }
                return null;
            });
        }
        catch (error) {
            this.logger.error('Batch get error:', error);
            this.stats.misses += keys.length;
            return keys.map(() => null);
        }
    }
    async batchSet(items) {
        try {
            const pipeline = this.redis.pipeline();
            items.forEach(({ key, value, options = {} }) => {
                const serialized = JSON.stringify(value);
                const ttl = options.ttl || 300;
                pipeline.setex(key, ttl, serialized);
            });
            const results = await pipeline.exec();
            this.stats.sets += items.length;
            return results.map(result => result[0] === null);
        }
        catch (error) {
            this.logger.error('Batch set error:', error);
            return items.map(() => false);
        }
    }
    // Cache warming methods
    async warmCache(userId) {
        this.logger.log(`Warming cache for user: ${userId}`);
        try {
            // Warm user data
            // Implementation would fetch and cache user's most accessed data
            // Warm dashboard data
            // Implementation would pre-calculate and cache dashboard metrics
            // Warm recent agents, workflows, tasks
            // Implementation would cache recently accessed items
            this.logger.log(`Cache warming completed for user: ${userId}`);
        }
        catch (error) {
            this.logger.error(`Cache warming failed for user ${userId}:`, error);
        }
    }
    // Cache statistics and monitoring
    async getStats() {
        try {
            const info = await this.redis.memory('usage');
            const keyCount = await this.redis.dbsize();
            const hitRate = this.stats.hits + this.stats.misses > 0
                ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
                : 0;
            return {
                ...this.stats,
                memory: info,
                keys: keyCount,
                hitRate: Math.round(hitRate * 100) / 100,
                memoryUsage: this.formatBytes(info),
            };
        }
        catch (error) {
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
    async healthCheck() {
        const startTime = Date.now();
        try {
            await this.redis.ping();
            return {
                status: 'healthy',
                latency: Date.now() - startTime,
            };
        }
        catch (error) {
            this.logger.error('Cache health check failed:', error);
            return {
                status: 'unhealthy',
                latency: Date.now() - startTime,
            };
        }
    }
    // Utility methods
    hashKey(input) {
        // Simple hash function for cache keys
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    // Cleanup and shutdown
    async onModuleDestroy() {
        if (this.redis) {
            await this.redis.quit();
            this.logger.log('Redis connection closed');
        }
    }
};
RedisCacheService = RedisCacheService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], RedisCacheService);
export { RedisCacheService };
// Cache decorator for automatic caching
export function Cacheable(options) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const cache = this.cacheService;
            if (!cache)
                return originalMethod.apply(this, args);
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
//# sourceMappingURL=redis-cache.service.js.map