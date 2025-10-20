#!/usr/bin/env node

/**
 * Advanced Caching Optimization System
 * Implements multi-layer caching strategies for million-user scalability
 */

import Redis from 'ioredis';
import { createHash } from 'crypto';
import { performance } from 'perf_hooks';

class CacheOptimizer {
    constructor(config = {}) {
        this.config = {
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD,
                db: 0,
                keyPrefix: 'tnf:',
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                ...config.redis
            },
            cache: {
                defaultTTL: 3600, // 1 hour
                maxMemoryPolicy: 'allkeys-lru',
                compressionThreshold: 1024, // Compress values > 1KB
                ...config.cache
            },
            cluster: {
                enabled: process.env.REDIS_CLUSTER_ENABLED === 'true',
                nodes: process.env.REDIS_CLUSTER_NODES?.split(',') || [],
                ...config.cluster
            }
        };

        this.initializeRedis();
        this.setupCacheStrategies();
        this.metrics = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0
        };
    }

    initializeRedis() {
        if (this.config.cluster.enabled && this.config.cluster.nodes.length > 0) {
            // Redis Cluster setup
            this.redis = new Redis.Cluster(this.config.cluster.nodes, {
                redisOptions: this.config.redis,
                enableOfflineQueue: false,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3
            });
        } else {
            // Single Redis instance
            this.redis = new Redis(this.config.redis);
        }

        this.redis.on('error', (error) => {
            console.error('Redis connection error:', error);
            this.metrics.errors++;
        });

        this.redis.on('connect', () => {
            console.log('Redis connected successfully');
        });
    }

    setupCacheStrategies() {
        this.strategies = {
            // Write-through: Write to cache and database simultaneously
            writeThrough: async (key, value, ttl = this.config.cache.defaultTTL) => {
                try {
                    const serialized = this.serialize(value);
                    await this.redis.setex(key, ttl, serialized);
                    this.metrics.sets++;
                    return true;
                } catch (error) {
                    console.error('Write-through cache error:', error);
                    this.metrics.errors++;
                    return false;
                }
            },

            // Write-behind: Write to cache immediately, database asynchronously
            writeBehind: async (key, value, ttl = this.config.cache.defaultTTL) => {
                try {
                    const serialized = this.serialize(value);
                    await this.redis.setex(key, ttl, serialized);
                    this.metrics.sets++;
                    
                    // Schedule async database write
                    setImmediate(() => this.asyncDatabaseWrite(key, value));
                    return true;
                } catch (error) {
                    console.error('Write-behind cache error:', error);
                    this.metrics.errors++;
                    return false;
                }
            },

            // Cache-aside: Application manages cache
            cacheAside: {
                get: async (key) => {
                    try {
                        const cached = await this.redis.get(key);
                        if (cached) {
                            this.metrics.hits++;
                            return this.deserialize(cached);
                        }
                        this.metrics.misses++;
                        return null;
                    } catch (error) {
                        console.error('Cache-aside get error:', error);
                        this.metrics.errors++;
                        return null;
                    }
                },

                set: async (key, value, ttl = this.config.cache.defaultTTL) => {
                    try {
                        const serialized = this.serialize(value);
                        await this.redis.setex(key, ttl, serialized);
                        this.metrics.sets++;
                        return true;
                    } catch (error) {
                        console.error('Cache-aside set error:', error);
                        this.metrics.errors++;
                        return false;
                    }
                }
            }
        };
    }

    // Multi-layer caching with L1 (memory) and L2 (Redis)
    async getMultiLayer(key, fetchFunction, options = {}) {
        const {
            l1TTL = 300, // 5 minutes for L1 cache
            l2TTL = 3600, // 1 hour for L2 cache
            useCompression = true
        } = options;

        // Check L1 cache (in-memory)
        if (this.l1Cache && this.l1Cache.has(key)) {
            const l1Data = this.l1Cache.get(key);
            if (l1Data.expires > Date.now()) {
                this.metrics.hits++;
                return l1Data.value;
            }
            this.l1Cache.delete(key);
        }

        // Check L2 cache (Redis)
        try {
            const cached = await this.redis.get(key);
            if (cached) {
                const value = this.deserialize(cached);
                
                // Populate L1 cache
                this.setL1Cache(key, value, l1TTL);
                
                this.metrics.hits++;
                return value;
            }
        } catch (error) {
            console.error('L2 cache error:', error);
            this.metrics.errors++;
        }

        // Cache miss - fetch from source
        this.metrics.misses++;
        try {
            const value = await fetchFunction();
            
            // Set both L1 and L2 caches
            this.setL1Cache(key, value, l1TTL);
            await this.strategies.cacheAside.set(key, value, l2TTL);
            
            return value;
        } catch (error) {
            console.error('Fetch function error:', error);
            throw error;
        }
    }

    // Cache warming for frequently accessed data
    async warmCache(warmingConfig) {
        console.log('Starting cache warming process...');
        const startTime = performance.now();
        let warmed = 0;

        for (const config of warmingConfig) {
            try {
                const { key, fetchFunction, ttl = 3600, priority = 'normal' } = config;
                
                // Check if already cached
                const exists = await this.redis.exists(key);
                if (!exists) {
                    const value = await fetchFunction();
                    await this.strategies.cacheAside.set(key, value, ttl);
                    warmed++;
                }
            } catch (error) {
                console.error(`Cache warming error for key ${config.key}:`, error);
            }
        }

        const duration = performance.now() - startTime;
        console.log(`Cache warming completed: ${warmed} keys warmed in ${duration.toFixed(2)}ms`);
        
        return { warmed, duration };
    }

    // Intelligent cache invalidation
    async invalidatePattern(pattern, options = {}) {
        const { batchSize = 100, delay = 10 } = options;
        
        try {
            let cursor = '0';
            let totalDeleted = 0;
            
            do {
                const [newCursor, keys] = await this.redis.scan(
                    cursor,
                    'MATCH',
                    pattern,
                    'COUNT',
                    batchSize
                );
                
                cursor = newCursor;
                
                if (keys.length > 0) {
                    const deleted = await this.redis.del(...keys);
                    totalDeleted += deleted;
                    this.metrics.deletes += deleted;
                    
                    // Small delay to prevent overwhelming Redis
                    if (delay > 0) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            } while (cursor !== '0');
            
            console.log(`Invalidated ${totalDeleted} keys matching pattern: ${pattern}`);
            return totalDeleted;
        } catch (error) {
            console.error('Cache invalidation error:', error);
            this.metrics.errors++;
            throw error;
        }
    }

    // Cache analytics and optimization recommendations
    async analyzeCache() {
        try {
            const info = await this.redis.info('memory');
            const stats = await this.redis.info('stats');
            const keyspace = await this.redis.info('keyspace');
            
            const analysis = {
                memory: this.parseRedisInfo(info),
                stats: this.parseRedisInfo(stats),
                keyspace: this.parseRedisInfo(keyspace),
                metrics: { ...this.metrics },
                hitRate: this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0,
                recommendations: []
            };

            // Generate recommendations
            if (analysis.hitRate < 0.8) {
                analysis.recommendations.push({
                    type: 'performance',
                    message: 'Low cache hit rate detected. Consider increasing TTL or cache warming.',
                    priority: 'high'
                });
            }

            if (analysis.memory.used_memory_rss > analysis.memory.maxmemory * 0.9) {
                analysis.recommendations.push({
                    type: 'memory',
                    message: 'Memory usage is high. Consider increasing maxmemory or optimizing data structures.',
                    priority: 'high'
                });
            }

            return analysis;
        } catch (error) {
            console.error('Cache analysis error:', error);
            throw error;
        }
    }

    // Helper methods
    serialize(value) {
        const serialized = JSON.stringify(value);
        
        // Compress large values
        if (serialized.length > this.config.cache.compressionThreshold) {
            // In a real implementation, you'd use a compression library like zlib
            return `compressed:${serialized}`;
        }
        
        return serialized;
    }

    deserialize(value) {
        if (typeof value === 'string' && value.startsWith('compressed:')) {
            // Decompress if needed
            return JSON.parse(value.substring(11));
        }
        
        return JSON.parse(value);
    }

    setL1Cache(key, value, ttl) {
        if (!this.l1Cache) {
            this.l1Cache = new Map();
        }
        
        this.l1Cache.set(key, {
            value,
            expires: Date.now() + (ttl * 1000)
        });
        
        // Cleanup expired entries periodically
        if (this.l1Cache.size % 100 === 0) {
            this.cleanupL1Cache();
        }
    }

    cleanupL1Cache() {
        if (!this.l1Cache) return;
        
        const now = Date.now();
        for (const [key, data] of this.l1Cache.entries()) {
            if (data.expires <= now) {
                this.l1Cache.delete(key);
            }
        }
    }

    parseRedisInfo(info) {
        const result = {};
        const lines = info.split('\r\n');
        
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                result[key] = isNaN(value) ? value : Number(value);
            }
        }
        
        return result;
    }

    async asyncDatabaseWrite(key, value) {
        // Placeholder for async database write
        // In a real implementation, this would write to your database
        console.log(`Async database write for key: ${key}`);
    }

    // Graceful shutdown
    async shutdown() {
        console.log('Shutting down cache optimizer...');
        
        if (this.redis) {
            await this.redis.quit();
        }
        
        if (this.l1Cache) {
            this.l1Cache.clear();
        }
        
        console.log('Cache optimizer shutdown complete');
    }

    // Generate cache key with consistent hashing
    generateKey(namespace, identifier, version = '1') {
        const hash = createHash('sha256')
            .update(`${namespace}:${identifier}:${version}`)
            .digest('hex')
            .substring(0, 16);
        
        return `${this.config.redis.keyPrefix}${namespace}:${hash}`;
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];
    const cacheOptimizer = new CacheOptimizer();

    switch (command) {
        case 'analyze':
            cacheOptimizer.analyzeCache()
                .then(analysis => {
                    console.log('Cache Analysis Report:');
                    console.log(JSON.stringify(analysis, null, 2));
                })
                .catch(console.error)
                .finally(() => cacheOptimizer.shutdown());
            break;

        case 'warm':
            // Example cache warming configuration
            const warmingConfig = [
                {
                    key: 'user:popular',
                    fetchFunction: () => ({ users: ['user1', 'user2', 'user3'] }),
                    ttl: 7200
                },
                {
                    key: 'content:trending',
                    fetchFunction: () => ({ content: ['post1', 'post2', 'post3'] }),
                    ttl: 3600
                }
            ];

            cacheOptimizer.warmCache(warmingConfig)
                .then(result => {
                    console.log('Cache warming result:', result);
                })
                .catch(console.error)
                .finally(() => cacheOptimizer.shutdown());
            break;

        case 'invalidate':
            const pattern = process.argv[3] || 'tnf:*';
            cacheOptimizer.invalidatePattern(pattern)
                .then(deleted => {
                    console.log(`Invalidated ${deleted} keys`);
                })
                .catch(console.error)
                .finally(() => cacheOptimizer.shutdown());
            break;

        default:
            console.log(`
Cache Optimization Tool

Usage:
  node cache-optimization.js <command> [options]

Commands:
  analyze                 Analyze current cache performance
  warm                   Warm cache with predefined data
  invalidate [pattern]   Invalidate cache keys matching pattern

Examples:
  node cache-optimization.js analyze
  node cache-optimization.js warm
  node cache-optimization.js invalidate "user:*"
            `);
            process.exit(0);
    }
}

export default CacheOptimizer;