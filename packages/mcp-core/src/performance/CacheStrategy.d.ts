/**
 * Caching Strategies for Performance Optimization
 */
import { Logger } from '../utils/Logger';
/**
 * Cache entry interface
 */
export interface CacheEntry<T> {
    /** Cached value */
    value: T;
    /** Entry timestamp */
    timestamp: Date;
    /** Time to live (ms) */
    ttl: number;
    /** Access count */
    accessCount: number;
    /** Last access time */
    lastAccess: Date;
    /** Entry size in bytes (estimated) */
    size: number;
}
/**
 * Cache configuration
 */
export interface CacheConfig {
    /** Maximum cache size (number of entries) */
    maxSize: number;
    /** Default TTL in milliseconds */
    defaultTTL: number;
    /** Maximum memory usage in bytes */
    maxMemory?: number;
    /** Cleanup interval in milliseconds */
    cleanupInterval: number;
    /** Enable statistics collection */
    enableStats: boolean;
}
/**
 * Cache statistics
 */
export interface CacheStats {
    /** Total hits */
    hits: number;
    /** Total misses */
    misses: number;
    /** Hit rate */
    hitRate: number;
    /** Total entries */
    size: number;
    /** Memory usage in bytes */
    memoryUsage: number;
    /** Total evictions */
    evictions: number;
    /** Average access time */
    avgAccessTime: number;
}
/**
 * Cache eviction strategy
 */
export declare enum EvictionStrategy {
    LRU = "lru",// Least Recently Used
    LFU = "lfu",// Least Frequently Used
    FIFO = "fifo",// First In, First Out
    TTL = "ttl",// Time To Live based
    SIZE = "size"
}
/**
 * Base cache interface
 */
export interface ICache<K, V> {
    /** Get value from cache */
    get(key: K): V | undefined;
    /** Set value in cache */
    set(key: K, value: V, ttl?: number): void;
    /** Check if key exists */
    has(key: K): boolean;
    /** Delete key from cache */
    delete(key: K): boolean;
    /** Clear all entries */
    clear(): void;
    /** Get cache size */
    size(): number;
    /** Get cache statistics */
    getStats(): CacheStats;
}
/**
 * LRU Cache implementation
 */
export declare class LRUCache<K, V> implements ICache<K, V> {
    private readonly cache;
    private readonly config;
    private readonly logger;
    private cleanupTimer?;
    private stats;
    constructor(config: CacheConfig, logger?: Logger);
    /**
     * Get value from cache
     */
    get(key: K): V | undefined;
    /**
     * Set value in cache
     */
    set(key: K, value: V, ttl?: number): void;
    /**
     * Check if key exists
     */
    has(key: K): boolean;
    /**
     * Delete key from cache
     */
    delete(key: K): boolean;
    /**
     * Clear all entries
     */
    clear(): void;
    /**
     * Get cache size
     */
    size(): number;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Shutdown cache
     */
    shutdown(): void;
    /**
     * Check if entry is expired
     */
    private isExpired;
    /**
     * Evict entries if needed
     */
    private evictIfNeeded;
    /**
     * Start cleanup timer
     */
    private startCleanup;
    /**
     * Clean up expired entries
     */
    private cleanup;
    /**
     * Estimate size of value
     */
    private estimateSize;
    /**
     * Record access time for statistics
     */
    private recordAccessTime;
}
/**
 * Multi-level cache implementation
 */
export declare class MultiLevelCache<K, V> implements ICache<K, V> {
    private readonly levels;
    private readonly logger;
    constructor(levels: ICache<K, V>[], logger?: Logger);
    /**
     * Get value from cache (checks all levels)
     */
    get(key: K): V | undefined;
    /**
     * Set value in all cache levels
     */
    set(key: K, value: V, ttl?: number): void;
    /**
     * Check if key exists in any level
     */
    has(key: K): boolean;
    /**
     * Delete key from all levels
     */
    delete(key: K): boolean;
    /**
     * Clear all levels
     */
    clear(): void;
    /**
     * Get total size across all levels
     */
    size(): number;
    /**
     * Get aggregated statistics
     */
    getStats(): CacheStats;
}
/**
 * Cache factory for creating different cache types
 */
export declare class CacheFactory {
    /**
     * Create LRU cache
     */
    static createLRUCache<K, V>(config?: Partial<CacheConfig>): LRUCache<K, V>;
    /**
     * Create multi-level cache
     */
    static createMultiLevelCache<K, V>(configs: Partial<CacheConfig>[]): MultiLevelCache<K, V>;
    /**
     * Create resource cache with optimized settings
     */
    static createResourceCache<K, V>(): LRUCache<K, V>;
    /**
     * Create tool result cache with optimized settings
     */
    static createToolResultCache<K, V>(): LRUCache<K, V>;
}
//# sourceMappingURL=CacheStrategy.d.ts.map