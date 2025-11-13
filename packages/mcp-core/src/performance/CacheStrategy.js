/**
 * Caching Strategies for Performance Optimization
 */
import { Logger } from '../utils/Logger';
/**
 * Cache eviction strategy
 */
export var EvictionStrategy;
(function (EvictionStrategy) {
    EvictionStrategy["LRU"] = "lru";
    EvictionStrategy["LFU"] = "lfu";
    EvictionStrategy["FIFO"] = "fifo";
    EvictionStrategy["TTL"] = "ttl";
    EvictionStrategy["SIZE"] = "size"; // Size based
})(EvictionStrategy || (EvictionStrategy = {}));
/**
 * LRU Cache implementation
 */
export class LRUCache {
    cache = new Map();
    config;
    logger;
    cleanupTimer;
    // Statistics
    stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        totalAccessTime: 0,
        accessCount: 0
    };
    constructor(config, logger) {
        this.config = config;
        this.logger = logger || new Logger('LRUCache');
        if (config.cleanupInterval > 0) {
            this.startCleanup();
        }
    }
    /**
     * Get value from cache
     */
    get(key) {
        const startTime = Date.now();
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            this.recordAccessTime(Date.now() - startTime);
            return undefined;
        }
        // Check TTL
        if (this.isExpired(entry)) {
            this.cache.delete(key);
            this.stats.misses++;
            this.recordAccessTime(Date.now() - startTime);
            return undefined;
        }
        // Update access info
        entry.accessCount++;
        entry.lastAccess = new Date();
        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);
        this.stats.hits++;
        this.recordAccessTime(Date.now() - startTime);
        return entry.value;
    }
    /**
     * Set value in cache
     */
    set(key, value, ttl) {
        const now = new Date();
        const entryTTL = ttl || this.config.defaultTTL;
        const size = this.estimateSize(value);
        const entry = {
            value,
            timestamp: now,
            ttl: entryTTL,
            accessCount: 0,
            lastAccess: now,
            size
        };
        // Remove existing entry if present
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        // Check if we need to evict entries
        this.evictIfNeeded();
        // Add new entry
        this.cache.set(key, entry);
    }
    /**
     * Check if key exists
     */
    has(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (this.isExpired(entry)) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Delete key from cache
     */
    delete(key) {
        return this.cache.delete(key);
    }
    /**
     * Clear all entries
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get cache size
     */
    size() {
        return this.cache.size;
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const totalAccesses = this.stats.hits + this.stats.misses;
        const hitRate = totalAccesses > 0 ? this.stats.hits / totalAccesses : 0;
        const avgAccessTime = this.stats.accessCount > 0 ?
            this.stats.totalAccessTime / this.stats.accessCount : 0;
        const memoryUsage = Array.from(this.cache.values())
            .reduce((total, entry) => total + entry.size, 0);
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate,
            size: this.cache.size,
            memoryUsage,
            evictions: this.stats.evictions,
            avgAccessTime
        };
    }
    /**
     * Shutdown cache
     */
    shutdown() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.clear();
    }
    /**
     * Check if entry is expired
     */
    isExpired(entry) {
        const now = Date.now();
        const entryTime = entry.timestamp.getTime();
        return (now - entryTime) > entry.ttl;
    }
    /**
     * Evict entries if needed
     */
    evictIfNeeded() {
        // Size-based eviction
        while (this.cache.size >= this.config.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
                this.stats.evictions++;
            }
            else {
                break;
            }
        }
        // Memory-based eviction
        if (this.config.maxMemory) {
            const currentMemory = Array.from(this.cache.values())
                .reduce((total, entry) => total + entry.size, 0);
            if (currentMemory > this.config.maxMemory) {
                // Evict least recently used entries
                const entries = Array.from(this.cache.entries())
                    .sort(([, a], [, b]) => a.lastAccess.getTime() - b.lastAccess.getTime());
                let memoryToFree = currentMemory - this.config.maxMemory;
                for (const [key, entry] of entries) {
                    if (memoryToFree <= 0)
                        break;
                    this.cache.delete(key);
                    this.stats.evictions++;
                    memoryToFree -= entry.size;
                }
            }
        }
    }
    /**
     * Start cleanup timer
     */
    startCleanup() {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
    }
    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            this.logger.debug(`Cleaned up ${cleanedCount} expired cache entries`);
        }
    }
    /**
     * Estimate size of value
     */
    estimateSize(value) {
        if (typeof value === 'string') {
            return value.length * 2; // Rough estimate for UTF-16
        }
        if (typeof value === 'object' && value !== null) {
            try {
                return JSON.stringify(value).length * 2;
            }
            catch {
                return 1024; // Default estimate
            }
        }
        return 64; // Default for primitives
    }
    /**
     * Record access time for statistics
     */
    recordAccessTime(time) {
        if (this.config.enableStats) {
            this.stats.totalAccessTime += time;
            this.stats.accessCount++;
        }
    }
}
/**
 * Multi-level cache implementation
 */
export class MultiLevelCache {
    levels;
    logger;
    constructor(levels, logger) {
        this.levels = levels;
        this.logger = logger || new Logger('MultiLevelCache');
    }
    /**
     * Get value from cache (checks all levels)
     */
    get(key) {
        for (let i = 0; i < this.levels.length; i++) {
            const value = this.levels[i].get(key);
            if (value !== undefined) {
                // Promote to higher levels
                for (let j = 0; j < i; j++) {
                    this.levels[j].set(key, value);
                }
                return value;
            }
        }
        return undefined;
    }
    /**
     * Set value in all cache levels
     */
    set(key, value, ttl) {
        for (const level of this.levels) {
            level.set(key, value, ttl);
        }
    }
    /**
     * Check if key exists in any level
     */
    has(key) {
        return this.levels.some(level => level.has(key));
    }
    /**
     * Delete key from all levels
     */
    delete(key) {
        let deleted = false;
        for (const level of this.levels) {
            if (level.delete(key)) {
                deleted = true;
            }
        }
        return deleted;
    }
    /**
     * Clear all levels
     */
    clear() {
        for (const level of this.levels) {
            level.clear();
        }
    }
    /**
     * Get total size across all levels
     */
    size() {
        return this.levels.reduce((total, level) => total + level.size(), 0);
    }
    /**
     * Get aggregated statistics
     */
    getStats() {
        const allStats = this.levels.map(level => level.getStats());
        return {
            hits: allStats.reduce((sum, stats) => sum + stats.hits, 0),
            misses: allStats.reduce((sum, stats) => sum + stats.misses, 0),
            hitRate: 0, // Will be calculated
            size: allStats.reduce((sum, stats) => sum + stats.size, 0),
            memoryUsage: allStats.reduce((sum, stats) => sum + stats.memoryUsage, 0),
            evictions: allStats.reduce((sum, stats) => sum + stats.evictions, 0),
            avgAccessTime: allStats.reduce((sum, stats) => sum + stats.avgAccessTime, 0) / allStats.length
        };
    }
}
/**
 * Cache factory for creating different cache types
 */
export class CacheFactory {
    /**
     * Create LRU cache
     */
    static createLRUCache(config = {}) {
        const defaultConfig = {
            maxSize: 1000,
            defaultTTL: 60 * 60 * 1000, // 1 hour
            cleanupInterval: 5 * 60 * 1000, // 5 minutes
            enableStats: true
        };
        return new LRUCache({ ...defaultConfig, ...config });
    }
    /**
     * Create multi-level cache
     */
    static createMultiLevelCache(configs) {
        const levels = configs.map(config => this.createLRUCache(config));
        return new MultiLevelCache(levels);
    }
    /**
     * Create resource cache with optimized settings
     */
    static createResourceCache() {
        return this.createLRUCache({
            maxSize: 5000,
            defaultTTL: 30 * 60 * 1000, // 30 minutes
            maxMemory: 50 * 1024 * 1024, // 50MB
            cleanupInterval: 2 * 60 * 1000, // 2 minutes
            enableStats: true
        });
    }
    /**
     * Create tool result cache with optimized settings
     */
    static createToolResultCache() {
        return this.createLRUCache({
            maxSize: 2000,
            defaultTTL: 15 * 60 * 1000, // 15 minutes
            maxMemory: 20 * 1024 * 1024, // 20MB
            cleanupInterval: 60 * 1000, // 1 minute
            enableStats: true
        });
    }
}
//# sourceMappingURL=CacheStrategy.js.map