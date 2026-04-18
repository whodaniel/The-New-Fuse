/**
 * Client Cache for MCP Client
 * 
 * Provides caching functionality for frequently accessed resources,
 * server capabilities, and other MCP data to improve performance.
 */

import { EventEmitter } from 'events';
import { MCPResource, ResourceContent } from '../interfaces/IMCPResource';
import { MCPCapability } from '../interfaces/IMCPCapability';
import { ToolResult } from '../interfaces/IMCPTool';

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: Date;
  ttl: number;
  accessCount: number;
  lastAccessed: Date;
}

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
export class ClientCache extends EventEmitter {
  private resourceCache = new Map<string, CacheEntry<ResourceContent>>();
  private capabilityCache = new Map<string, CacheEntry<MCPCapability[]>>();
  private toolResultCache = new Map<string, CacheEntry<ToolResult>>();
  private genericCache = new Map<string, CacheEntry<any>>();
  
  private statistics: CacheStatistics = {
    totalEntries: 0,
    hitCount: 0,
    missCount: 0,
    hitRate: 0,
    totalSize: 0
  };

  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(private config: CacheConfig = {
    maxSize: 1000,
    defaultTTL: 300000, // 5 minutes
    cleanupInterval: 60000, // 1 minute
    enableStatistics: true
  }) {
    super();
    this.startCleanupTimer();
  }

  /**
   * Cache a resource
   */
  cacheResource(uri: string, content: ResourceContent, ttl?: number): void {
    const entry: CacheEntry<ResourceContent> = {
      key: uri,
      value: content,
      timestamp: new Date(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: new Date()
    };

    this.resourceCache.set(uri, entry);
    this.updateStatistics();
    this.emit('resourceCached', uri);
    this.enforceMaxSize();
  }

  /**
   * Get cached resource
   */
  getResource(uri: string): ResourceContent | null {
    const entry = this.resourceCache.get(uri);
    
    if (!entry) {
      this.recordMiss();
      return null;
    }

    if (this.isExpired(entry)) {
      this.resourceCache.delete(uri);
      this.updateStatistics();
      this.recordMiss();
      this.emit('resourceExpired', uri);
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = new Date();
    this.recordHit();
    this.emit('resourceHit', uri);
    return entry.value;
  }

  /**
   * Cache server capabilities
   */
  cacheCapabilities(endpoint: string, capabilities: MCPCapability[], ttl?: number): void {
    const entry: CacheEntry<MCPCapability[]> = {
      key: endpoint,
      value: capabilities,
      timestamp: new Date(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: new Date()
    };

    this.capabilityCache.set(endpoint, entry);
    this.updateStatistics();
    this.emit('capabilitiesCached', endpoint);
    this.enforceMaxSize();
  }

  /**
   * Get cached capabilities
   */
  getCapabilities(endpoint: string): MCPCapability[] | null {
    const entry = this.capabilityCache.get(endpoint);
    
    if (!entry) {
      this.recordMiss();
      return null;
    }

    if (this.isExpired(entry)) {
      this.capabilityCache.delete(endpoint);
      this.updateStatistics();
      this.recordMiss();
      this.emit('capabilitiesExpired', endpoint);
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = new Date();
    this.recordHit();
    this.emit('capabilitiesHit', endpoint);
    return entry.value;
  }

  /**
   * Cache tool result
   */
  cacheToolResult(toolName: string, params: any, result: ToolResult, ttl?: number): void {
    const key = this.generateToolCacheKey(toolName, params);
    
    const entry: CacheEntry<ToolResult> = {
      key,
      value: result,
      timestamp: new Date(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: new Date()
    };

    this.toolResultCache.set(key, entry);
    this.updateStatistics();
    this.emit('toolResultCached', toolName, key);
    this.enforceMaxSize();
  }

  /**
   * Get cached tool result
   */
  getToolResult(toolName: string, params: any): ToolResult | null {
    const key = this.generateToolCacheKey(toolName, params);
    const entry = this.toolResultCache.get(key);
    
    if (!entry) {
      this.recordMiss();
      return null;
    }

    if (this.isExpired(entry)) {
      this.toolResultCache.delete(key);
      this.updateStatistics();
      this.recordMiss();
      this.emit('toolResultExpired', toolName, key);
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = new Date();
    this.recordHit();
    this.emit('toolResultHit', toolName, key);
    return entry.value;
  }

  /**
   * Cache generic data
   */
  cache<T>(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: new Date(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: new Date()
    };

    this.genericCache.set(key, entry);
    this.updateStatistics();
    this.emit('dataCached', key);
    this.enforceMaxSize();
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.genericCache.get(key);
    
    if (!entry) {
      this.recordMiss();
      return null;
    }

    if (this.isExpired(entry)) {
      this.genericCache.delete(key);
      this.updateStatistics();
      this.recordMiss();
      this.emit('dataExpired', key);
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = new Date();
    this.recordHit();
    this.emit('dataHit', key);
    return entry.value;
  }

  /**
   * Check if an entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    const entryTime = entry.timestamp.getTime();
    return (now - entryTime) > entry.ttl;
  }

  /**
   * Generate cache key for tool results
   */
  private generateToolCacheKey(toolName: string, params: any): string {
    const paramsStr = JSON.stringify(params, Object.keys(params).sort());
    return `${toolName}:${Buffer.from(paramsStr).toString('base64')}`;
  }

  /**
   * Record cache hit
   */
  private recordHit(): void {
    if (this.config.enableStatistics) {
      this.statistics.hitCount++;
      this.updateHitRate();
    }
  }

  /**
   * Record cache miss
   */
  private recordMiss(): void {
    if (this.config.enableStatistics) {
      this.statistics.missCount++;
      this.updateHitRate();
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.statistics.hitCount + this.statistics.missCount;
    this.statistics.hitRate = total > 0 ? this.statistics.hitCount / total : 0;
  }

  /**
   * Update cache statistics
   */
  private updateStatistics(): void {
    if (!this.config.enableStatistics) return;

    const allEntries = [
      ...this.resourceCache.values(),
      ...this.capabilityCache.values(),
      ...this.toolResultCache.values(),
      ...this.genericCache.values()
    ];

    this.statistics.totalEntries = allEntries.length;
    this.statistics.totalSize = this.calculateTotalSize(allEntries);

    if (allEntries.length > 0) {
      const timestamps = allEntries.map(e => e.timestamp.getTime());
      this.statistics.oldestEntry = new Date(Math.min(...timestamps));
      this.statistics.newestEntry = new Date(Math.max(...timestamps));
    }
  }

  /**
   * Calculate total cache size (approximate)
   */
  private calculateTotalSize(entries: CacheEntry<any>[]): number {
    return entries.reduce((total, entry) => {
      try {
        return total + JSON.stringify(entry.value).length;
      } catch {
        return total + 1000; // Approximate size for non-serializable objects
      }
    }, 0);
  }

  /**
   * Enforce maximum cache size
   */
  private enforceMaxSize(): void {
    const totalEntries = this.resourceCache.size + 
                        this.capabilityCache.size + 
                        this.toolResultCache.size + 
                        this.genericCache.size;

    if (totalEntries <= this.config.maxSize) return;

    // Collect all entries with their last access time
    const allEntries: Array<{ cache: Map<string, any>, key: string, lastAccessed: Date }> = [];

    for (const [key, entry] of this.resourceCache) {
      allEntries.push({ cache: this.resourceCache, key, lastAccessed: entry.lastAccessed });
    }
    for (const [key, entry] of this.capabilityCache) {
      allEntries.push({ cache: this.capabilityCache, key, lastAccessed: entry.lastAccessed });
    }
    for (const [key, entry] of this.toolResultCache) {
      allEntries.push({ cache: this.toolResultCache, key, lastAccessed: entry.lastAccessed });
    }
    for (const [key, entry] of this.genericCache) {
      allEntries.push({ cache: this.genericCache, key, lastAccessed: entry.lastAccessed });
    }

    // Sort by last accessed time (oldest first)
    allEntries.sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    // Remove oldest entries until we're under the limit
    const entriesToRemove = totalEntries - this.config.maxSize;
    for (let i = 0; i < entriesToRemove; i++) {
      const entry = allEntries[i];
      entry.cache.delete(entry.key);
      this.emit('entryEvicted', entry.key);
    }

    this.updateStatistics();
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    let removedCount = 0;

    // Clean resource cache
    for (const [key, entry] of this.resourceCache) {
      if (this.isExpired(entry)) {
        this.resourceCache.delete(key);
        removedCount++;
        this.emit('resourceExpired', key);
      }
    }

    // Clean capability cache
    for (const [key, entry] of this.capabilityCache) {
      if (this.isExpired(entry)) {
        this.capabilityCache.delete(key);
        removedCount++;
        this.emit('capabilitiesExpired', key);
      }
    }

    // Clean tool result cache
    for (const [key, entry] of this.toolResultCache) {
      if (this.isExpired(entry)) {
        this.toolResultCache.delete(key);
        removedCount++;
        this.emit('toolResultExpired', key);
      }
    }

    // Clean generic cache
    for (const [key, entry] of this.genericCache) {
      if (this.isExpired(entry)) {
        this.genericCache.delete(key);
        removedCount++;
        this.emit('dataExpired', key);
      }
    }

    if (removedCount > 0) {
      this.updateStatistics();
      this.emit('cleanupCompleted', removedCount);
    }
  }

  /**
   * Clear all caches
   */
  clear(): void {
    const totalEntries = this.statistics.totalEntries;
    
    this.resourceCache.clear();
    this.capabilityCache.clear();
    this.toolResultCache.clear();
    this.genericCache.clear();
    
    this.updateStatistics();
    this.emit('cacheCleared', totalEntries);
  }

  /**
   * Clear specific cache type
   */
  clearResources(): void {
    const count = this.resourceCache.size;
    this.resourceCache.clear();
    this.updateStatistics();
    this.emit('resourceCacheCleared', count);
  }

  clearCapabilities(): void {
    const count = this.capabilityCache.size;
    this.capabilityCache.clear();
    this.updateStatistics();
    this.emit('capabilityCacheCleared', count);
  }

  clearToolResults(): void {
    const count = this.toolResultCache.size;
    this.toolResultCache.clear();
    this.updateStatistics();
    this.emit('toolResultCacheCleared', count);
  }

  /**
   * Get cache statistics
   */
  getStatistics(): CacheStatistics {
    this.updateStatistics();
    return { ...this.statistics };
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval && this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.startCleanupTimer();
    }

    this.emit('configUpdated', this.config);
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.clear();
    this.removeAllListeners();
  }
}