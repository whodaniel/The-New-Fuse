import { Logger } from '../../../core-monitoring/src/utils/Logger';

export interface CacheEntry<T> {
  key: string;
  value: T;
  accessCount: number;
  lastAccessed: Date;
  createdAt: Date;
  size: number;
  tenantId?: string;
}

export interface CacheConfig {
  maxSize: number; // Maximum number of entries
  maxMemory: number; // Maximum memory usage in bytes
  ttl: number; // Time to live in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  tenantIsolation: boolean;
}

export interface CacheStats {
  size: number;
  memoryUsage: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  tenantStats: Map<string, { size: number; memoryUsage: number }>;
}

/**
 * LRU Cache with memory management and tenant isolation for sync operations
 * Integrates with existing memory management patterns
 */
export class SyncLRUCache<T> {
  private readonly logger = new Logger('SyncLRUCache');
  private readonly cache = new Map<string, CacheEntry<T>>();
  private readonly accessOrder: string[] = [];
  private readonly tenantCaches = new Map<string, Set<string>>();
  
  private currentMemoryUsage = 0;
  private hitCount = 0;
  private missCount = 0;
  private evictionCount = 0;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(private readonly config: CacheConfig) {
    this.startCleanupTimer();
  }

  /**
   * Get value from cache
   */
  get(key: string, tenantId?: string): T | undefined {
    const fullKey = this.getFullKey(key, tenantId);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      this.missCount++;
      return undefined;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.delete(key, tenantId);
      this.missCount++;
      return undefined;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = new Date();
    this.updateAccessOrder(fullKey);
    
    this.hitCount++;
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, tenantId?: string): void {
    const fullKey = this.getFullKey(key, tenantId);
    const size = this.calculateSize(value);

    // Check if we need to evict entries
    this.ensureCapacity(size);

    // Create new entry
    const entry: CacheEntry<T> = {
      key: fullKey,
      value,
      accessCount: 1,
      lastAccessed: new Date(),
      createdAt: new Date(),
      size,
      tenantId
    };

    // Remove existing entry if it exists
    if (this.cache.has(fullKey)) {
      this.removeEntry(fullKey);
    }

    // Add new entry
    this.cache.set(fullKey, entry);
    this.accessOrder.push(fullKey);
    this.currentMemoryUsage += size;

    // Track tenant cache
    if (this.config.tenantIsolation && tenantId) {
      if (!this.tenantCaches.has(tenantId)) {
        this.tenantCaches.set(tenantId, new Set());
      }
      this.tenantCaches.get(tenantId)!.add(fullKey);
    }

    this.logger.debug('Cache entry added', {
      key: fullKey,
      size,
      totalSize: this.cache.size,
      memoryUsage: this.currentMemoryUsage
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string, tenantId?: string): boolean {
    const fullKey = this.getFullKey(key, tenantId);
    return this.removeEntry(fullKey);
  }

  /**
   * Clear all cache entries for a tenant
   */
  clearTenant(tenantId: string): void {
    if (!this.config.tenantIsolation) {
      this.logger.warn('Tenant isolation not enabled');
      return;
    }

    const tenantKeys = this.tenantCaches.get(tenantId);
    if (!tenantKeys) return;

    for (const key of tenantKeys) {
      this.removeEntry(key);
    }

    this.tenantCaches.delete(tenantId);
    
    this.logger.info('Tenant cache cleared', {
      tenantId,
      clearedCount: tenantKeys.size
    });
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.length = 0;
    this.tenantCaches.clear();
    this.currentMemoryUsage = 0;
    
    this.logger.info('Cache cleared completely');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const tenantStats = new Map<string, { size: number; memoryUsage: number }>();

    // Calculate tenant-specific stats
    for (const [tenantId, keys] of this.tenantCaches) {
      let tenantSize = 0;
      let tenantMemory = 0;

      for (const key of keys) {
        const entry = this.cache.get(key);
        if (entry) {
          tenantSize++;
          tenantMemory += entry.size;
        }
      }

      tenantStats.set(tenantId, { size: tenantSize, memoryUsage: tenantMemory });
    }

    const totalRequests = this.hitCount + this.missCount;
    
    return {
      size: this.cache.size,
      memoryUsage: this.currentMemoryUsage,
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      missRate: totalRequests > 0 ? this.missCount / totalRequests : 0,
      evictionCount: this.evictionCount,
      tenantStats
    };
  }

  /**
   * Ensure cache has capacity for new entry
   */
  private ensureCapacity(newEntrySize: number): void {
    // Check memory limit
    while (this.currentMemoryUsage + newEntrySize > this.config.maxMemory && this.cache.size > 0) {
      this.evictLRU();
    }

    // Check size limit
    while (this.cache.size >= this.config.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const lruKey = this.accessOrder[0];
    this.removeEntry(lruKey);
    this.evictionCount++;
  }

  /**
   * Remove entry from cache
   */
  private removeEntry(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Remove from cache
    this.cache.delete(key);
    this.currentMemoryUsage -= entry.size;

    // Remove from access order
    const orderIndex = this.accessOrder.indexOf(key);
    if (orderIndex !== -1) {
      this.accessOrder.splice(orderIndex, 1);
    }

    // Remove from tenant cache
    if (entry.tenantId && this.tenantCaches.has(entry.tenantId)) {
      this.tenantCaches.get(entry.tenantId)!.delete(key);
      
      // Clean up empty tenant cache
      if (this.tenantCaches.get(entry.tenantId)!.size === 0) {
        this.tenantCaches.delete(entry.tenantId);
      }
    }

    return true;
  }

  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    const age = Date.now() - entry.createdAt.getTime();
    return age > this.config.ttl;
  }

  /**
   * Generate full key with tenant isolation
   */
  private getFullKey(key: string, tenantId?: string): string {
    if (this.config.tenantIsolation && tenantId) {
      return `${tenantId}:${key}`;
    }
    return key;
  }

  /**
   * Calculate approximate size of value in bytes
   */
  private calculateSize(value: T): number {
    try {
      // Simple approximation - serialize to JSON and measure
      const serialized = JSON.stringify(value);
      return serialized.length * 2; // Approximate UTF-16 encoding
    } catch {
      // Fallback for non-serializable objects
      return 1024; // 1KB default
    }
  }

  /**
   * Start cleanup timer for expired entries
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.removeEntry(key);
    }

    if (expiredKeys.length > 0) {
      this.logger.debug('Cleaned up expired cache entries', {
        expiredCount: expiredKeys.length,
        remainingSize: this.cache.size
      });
    }
  }

  /**
   * Force cleanup of cache based on memory pressure
   */
  forceCleanup(targetMemoryUsage?: number): void {
    const target = targetMemoryUsage || this.config.maxMemory * 0.8; // 80% of max

    while (this.currentMemoryUsage > target && this.cache.size > 0) {
      this.evictLRU();
    }

    this.logger.info('Force cleanup completed', {
      targetMemory: target,
      currentMemory: this.currentMemoryUsage,
      evictedCount: this.evictionCount
    });
  }

  /**
   * Shutdown cache and cleanup resources
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.clear();
    this.logger.info('Cache shutdown complete');
  }
}