/**
 * Client Cache for MCP Client
 *
 * Provides caching functionality for frequently accessed resources,
 * server capabilities, and other MCP data to improve performance.
 */
import { EventEmitter } from 'events';
import { ResourceContent } from '../interfaces/IMCPResource';
import { MCPCapability } from '../interfaces/IMCPCapability';
import { ToolResult } from '../interfaces/IMCPTool';
/**
 * Cache statistics
 */
export interface CacheStatistics {
    totalEntries: number;
    hitCount: number;
    missCount: number;
    hitRate: number;
    totalSize: number;
    oldestEntry?: Date;
    newestEntry?: Date;
}
/**
 * Cache configuration
 */
interface CacheConfig {
    maxSize: number;
    defaultTTL: number;
    cleanupInterval: number;
    enableStatistics: boolean;
}
/**
 * Client Cache implementation
 */
export declare class ClientCache extends EventEmitter {
    private config;
    private resourceCache;
    private capabilityCache;
    private toolResultCache;
    private genericCache;
    private statistics;
    private cleanupTimer;
    constructor(config?: CacheConfig);
    /**
     * Cache a resource
     */
    cacheResource(uri: string, content: ResourceContent, ttl?: number): void;
    /**
     * Get cached resource
     */
    getResource(uri: string): ResourceContent | null;
    /**
     * Cache server capabilities
     */
    cacheCapabilities(endpoint: string, capabilities: MCPCapability[], ttl?: number): void;
    /**
     * Get cached capabilities
     */
    getCapabilities(endpoint: string): MCPCapability[] | null;
    /**
     * Cache tool result
     */
    cacheToolResult(toolName: string, params: any, result: ToolResult, ttl?: number): void;
    /**
     * Get cached tool result
     */
    getToolResult(toolName: string, params: any): ToolResult | null;
    /**
     * Cache generic data
     */
    cache<T>(key: string, value: T, ttl?: number): void;
    /**
     * Get cached data
     */
    get<T>(key: string): T | null;
    /**
     * Check if an entry is expired
     */
    private isExpired;
    /**
     * Generate cache key for tool results
     */
    private generateToolCacheKey;
    /**
     * Record cache hit
     */
    private recordHit;
    /**
     * Record cache miss
     */
    private recordMiss;
    /**
     * Update hit rate
     */
    private updateHitRate;
    /**
     * Update cache statistics
     */
    private updateStatistics;
    /**
     * Calculate total cache size (approximate)
     */
    private calculateTotalSize;
    /**
     * Enforce maximum cache size
     */
    private enforceMaxSize;
    /**
     * Start cleanup timer
     */
    private startCleanupTimer;
    /**
     * Cleanup expired entries
     */
    cleanup(): void;
    /**
     * Clear all caches
     */
    clear(): void;
    /**
     * Clear specific cache type
     */
    clearResources(): void;
    clearCapabilities(): void;
    clearToolResults(): void;
    /**
     * Get cache statistics
     */
    getStatistics(): CacheStatistics;
    /**
     * Get cache configuration
     */
    getConfig(): CacheConfig;
    /**
     * Update cache configuration
     */
    updateConfig(newConfig: Partial<CacheConfig>): void;
    /**
     * Destroy cache and cleanup resources
     */
    destroy(): void;
}
export {};
//# sourceMappingURL=ClientCache.d.ts.map