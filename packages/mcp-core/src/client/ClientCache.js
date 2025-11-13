/**
 * Client Cache for MCP Client
 *
 * Provides caching functionality for frequently accessed resources,
 * server capabilities, and other MCP data to improve performance.
 */
import { EventEmitter } from 'events';
/**
 * Client Cache implementation
 */
export class ClientCache extends EventEmitter {
    config;
    resourceCache = new Map();
    capabilityCache = new Map();
    toolResultCache = new Map();
    genericCache = new Map();
    statistics = {
        totalEntries: 0,
        hitCount: 0,
        missCount: 0,
        hitRate: 0,
        totalSize: 0
    };
    cleanupTimer = null;
    constructor(config = {
        maxSize: 1000,
        defaultTTL: 300000, // 5 minutes
        cleanupInterval: 60000, // 1 minute
        enableStatistics: true
    }) {
        super();
        this.config = config;
        this.startCleanupTimer();
    }
    /**
     * Cache a resource
     */
    cacheResource(uri, content, ttl) {
        const entry = {
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
    getResource(uri) {
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
    cacheCapabilities(endpoint, capabilities, ttl) {
        const entry = {
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
    getCapabilities(endpoint) {
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
    cacheToolResult(toolName, params, result, ttl) {
        const key = this.generateToolCacheKey(toolName, params);
        const entry = {
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
    getToolResult(toolName, params) {
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
    cache(key, value, ttl) {
        const entry = {
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
    get(key) {
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
    isExpired(entry) {
        const now = Date.now();
        const entryTime = entry.timestamp.getTime();
        return (now - entryTime) > entry.ttl;
    }
    /**
     * Generate cache key for tool results
     */
    generateToolCacheKey(toolName, params) {
        const paramsStr = JSON.stringify(params, Object.keys(params).sort());
        return `${toolName}:${Buffer.from(paramsStr).toString('base64')}`;
    }
    /**
     * Record cache hit
     */
    recordHit() {
        if (this.config.enableStatistics) {
            this.statistics.hitCount++;
            this.updateHitRate();
        }
    }
    /**
     * Record cache miss
     */
    recordMiss() {
        if (this.config.enableStatistics) {
            this.statistics.missCount++;
            this.updateHitRate();
        }
    }
    /**
     * Update hit rate
     */
    updateHitRate() {
        const total = this.statistics.hitCount + this.statistics.missCount;
        this.statistics.hitRate = total > 0 ? this.statistics.hitCount / total : 0;
    }
    /**
     * Update cache statistics
     */
    updateStatistics() {
        if (!this.config.enableStatistics)
            return;
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
    calculateTotalSize(entries) {
        return entries.reduce((total, entry) => {
            try {
                return total + JSON.stringify(entry.value).length;
            }
            catch {
                return total + 1000; // Approximate size for non-serializable objects
            }
        }, 0);
    }
    /**
     * Enforce maximum cache size
     */
    enforceMaxSize() {
        const totalEntries = this.resourceCache.size +
            this.capabilityCache.size +
            this.toolResultCache.size +
            this.genericCache.size;
        if (totalEntries <= this.config.maxSize)
            return;
        // Collect all entries with their last access time
        const allEntries = [];
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
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
    }
    /**
     * Cleanup expired entries
     */
    cleanup() {
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
    clear() {
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
    clearResources() {
        const count = this.resourceCache.size;
        this.resourceCache.clear();
        this.updateStatistics();
        this.emit('resourceCacheCleared', count);
    }
    clearCapabilities() {
        const count = this.capabilityCache.size;
        this.capabilityCache.clear();
        this.updateStatistics();
        this.emit('capabilityCacheCleared', count);
    }
    clearToolResults() {
        const count = this.toolResultCache.size;
        this.toolResultCache.clear();
        this.updateStatistics();
        this.emit('toolResultCacheCleared', count);
    }
    /**
     * Get cache statistics
     */
    getStatistics() {
        this.updateStatistics();
        return { ...this.statistics };
    }
    /**
     * Get cache configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update cache configuration
     */
    updateConfig(newConfig) {
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
    destroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        this.clear();
        this.removeAllListeners();
    }
}
//# sourceMappingURL=ClientCache.js.map