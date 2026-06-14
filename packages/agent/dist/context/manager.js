"use strict";
/**
 * Context management for agent operations
 * Handles context storage, retrieval, and synchronization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextManager = exports.ContextType = void 0;
var ContextType;
(function (ContextType) {
    ContextType["AGENT"] = "agent";
    ContextType["SESSION"] = "session";
    ContextType["TASK"] = "task";
    ContextType["WORKFLOW"] = "workflow";
    ContextType["USER"] = "user";
})(ContextType || (exports.ContextType = ContextType = {}));
class ContextManager {
    constructor(contextType, entityId, redisService) {
        this.localContext = new Map();
        this.contextType = contextType;
        this.entityId = entityId;
        this.redisService = redisService;
    }
    /**
     * Store context entry
     */
    async store(key, data, metadata) {
        const entry = {
            id: `${this.contextType}:${this.entityId}:${key}`,
            type: this.contextType,
            data,
            timestamp: Date.now(),
            metadata
        };
        // Store locally
        this.localContext.set(key, entry);
        // Store in Redis if available
        if (this.redisService) {
            await this.redisService.set(entry.id, JSON.stringify(entry), 3600 // 1 hour TTL
            );
        }
    }
    /**
     * Retrieve context entry
     */
    async retrieve(key) {
        // Try local cache first
        const entry = this.localContext.get(key);
        if (entry) {
            return entry;
        }
        // Try Redis if available
        if (this.redisService) {
            const entryId = `${this.contextType}:${this.entityId}:${key}`;
            const data = await this.redisService.get(entryId);
            if (data) {
                const parsedEntry = JSON.parse(data);
                // Cache locally
                this.localContext.set(key, parsedEntry);
                return parsedEntry;
            }
        }
        return null;
    }
    /**
     * Update context entry
     */
    async update(key, data, metadata) {
        const existing = await this.retrieve(key);
        if (existing) {
            existing.data = { ...existing.data, ...data };
            existing.timestamp = Date.now();
            if (metadata) {
                existing.metadata = { ...existing.metadata, ...metadata };
            }
            await this.store(key, existing.data, existing.metadata);
        }
        else {
            await this.store(key, data, metadata);
        }
    }
    /**
     * Remove context entry
     */
    async remove(key) {
        this.localContext.delete(key);
        if (this.redisService) {
            const entryId = `${this.contextType}:${this.entityId}:${key}`;
            await this.redisService.del(entryId);
        }
    }
    /**
     * Clear all context entries
     */
    async clear() {
        this.localContext.clear();
        if (this.redisService) {
            const pattern = `${this.contextType}:${this.entityId}:*`;
            const keys = await this.redisService.keys(pattern);
            if (keys.length > 0) {
                await Promise.all(keys.map(key => this.redisService.del(key)));
            }
        }
    }
    /**
     * Get all context keys
     */
    async getKeys() {
        const localKeys = Array.from(this.localContext.keys());
        if (this.redisService) {
            const pattern = `${this.contextType}:${this.entityId}:*`;
            const redisKeys = await this.redisService.keys(pattern);
            const parsedKeys = redisKeys.map(key => key.split(':').pop() || '');
            return Array.from(new Set([...localKeys, ...parsedKeys]));
        }
        return localKeys;
    }
    /**
     * Get context statistics
     */
    getStats() {
        return {
            localCount: this.localContext.size,
            type: this.contextType,
            entityId: this.entityId
        };
    }
}
exports.ContextManager = ContextManager;
//# sourceMappingURL=manager.js.map