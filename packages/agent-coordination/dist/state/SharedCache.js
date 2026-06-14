"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedCache = void 0;
const events_1 = require("events");
/**
 * Shared cache for agent collaboration
 */
class SharedCache extends events_1.EventEmitter {
    constructor(redisService, prefix = 'cache') {
        super();
        this.redisService = redisService;
        this.prefix = prefix;
    }
    /**
     * Get a value from cache
     */
    async get(key) {
        const fullKey = this.getFullKey(key);
        const value = await this.redisService.get(fullKey);
        if (value === null) {
            return null;
        }
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    /**
     * Set a value in cache
     */
    async set(key, value, ttl) {
        const fullKey = this.getFullKey(key);
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttl) {
            await this.redisService.set(fullKey, serialized, Math.floor(ttl / 1000));
        }
        else {
            await this.redisService.set(fullKey, serialized);
        }
        this.emit('cache:set', key, value);
    }
    /**
     * Delete a value from cache
     */
    async delete(key) {
        const fullKey = this.getFullKey(key);
        const result = await this.redisService.del(fullKey);
        if (result > 0) {
            this.emit('cache:delete', key);
            return true;
        }
        return false;
    }
    /**
     * Check if key exists
     */
    async exists(key) {
        const fullKey = this.getFullKey(key);
        return await this.redisService.exists(fullKey);
    }
    /**
     * Get multiple values
     */
    async mget(keys) {
        if (keys.length === 0)
            return [];
        const fullKeys = keys.map((k) => this.getFullKey(k));
        const values = await this.redisService.mget(...fullKeys);
        return values.map((value) => {
            if (value === null)
                return null;
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        });
    }
    /**
     * Set multiple values
     */
    async mset(entries) {
        const data = {};
        for (const [key, value] of Object.entries(entries)) {
            const fullKey = this.getFullKey(key);
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            data[fullKey] = serialized;
        }
        await this.redisService.mset(data);
        this.emit('cache:mset', Object.keys(entries));
    }
    /**
     * Increment a value
     */
    async increment(key, amount = 1) {
        const fullKey = this.getFullKey(key);
        const result = await this.redisService.incrby(fullKey, amount);
        this.emit('cache:increment', key, amount);
        return result;
    }
    /**
     * Decrement a value
     */
    async decrement(key, amount = 1) {
        const fullKey = this.getFullKey(key);
        const result = await this.redisService.decrby(fullKey, amount);
        this.emit('cache:decrement', key, amount);
        return result;
    }
    /**
     * Get and delete (atomic)
     */
    async getAndDelete(key) {
        const fullKey = this.getFullKey(key);
        const script = `
      local value = redis.call("get", KEYS[1])
      if value then
        redis.call("del", KEYS[1])
      end
      return value
    `;
        const value = await this.redisService.eval(script, [fullKey], []);
        if (value === null)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    /**
     * Add to a set
     */
    async addToSet(key, ...members) {
        const fullKey = this.getFullKey(key);
        const result = await this.redisService.sadd(fullKey, ...members);
        this.emit('cache:set:add', key, members);
        return result;
    }
    /**
     * Remove from a set
     */
    async removeFromSet(key, ...members) {
        const fullKey = this.getFullKey(key);
        const result = await this.redisService.srem(fullKey, ...members);
        this.emit('cache:set:remove', key, members);
        return result;
    }
    /**
     * Get set members
     */
    async getSetMembers(key) {
        const fullKey = this.getFullKey(key);
        return await this.redisService.smembers(fullKey);
    }
    /**
     * Check if member is in set
     */
    async isSetMember(key, member) {
        const fullKey = this.getFullKey(key);
        return await this.redisService.sismember(fullKey, member);
    }
    /**
     * Push to list (queue)
     */
    async pushToList(key, ...values) {
        const fullKey = this.getFullKey(key);
        const result = await this.redisService.rpush(fullKey, ...values);
        this.emit('cache:list:push', key, values);
        return result;
    }
    /**
     * Pop from list (queue)
     */
    async popFromList(key) {
        const fullKey = this.getFullKey(key);
        return await this.redisService.lpop(fullKey);
    }
    /**
     * Get list length
     */
    async getListLength(key) {
        const fullKey = this.getFullKey(key);
        return await this.redisService.llen(fullKey);
    }
    /**
     * Get list range
     */
    async getListRange(key, start, end) {
        const fullKey = this.getFullKey(key);
        return await this.redisService.lrange(fullKey, start, end);
    }
    /**
     * Set hash field
     */
    async setHashField(key, field, value) {
        const fullKey = this.getFullKey(key);
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        await this.redisService.hset(fullKey, field, serialized);
        this.emit('cache:hash:set', key, field);
    }
    /**
     * Get hash field
     */
    async getHashField(key, field) {
        const fullKey = this.getFullKey(key);
        const value = await this.redisService.hget(fullKey, field);
        if (value === null)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    /**
     * Get all hash fields
     */
    async getHashAll(key) {
        const fullKey = this.getFullKey(key);
        const hash = await this.redisService.hgetall(fullKey);
        const result = {};
        for (const [field, value] of Object.entries(hash)) {
            try {
                result[field] = JSON.parse(value);
            }
            catch {
                result[field] = value;
            }
        }
        return result;
    }
    /**
     * Delete hash field
     */
    async deleteHashField(key, field) {
        const fullKey = this.getFullKey(key);
        const result = await this.redisService.hdel(fullKey, field);
        return result > 0;
    }
    /**
     * Get keys matching pattern
     */
    async getKeys(pattern = '*') {
        const fullPattern = this.getFullKey(pattern);
        const keys = await this.redisService.keys(fullPattern);
        // Remove prefix from keys
        return keys.map((key) => key.substring(this.prefix.length + 1));
    }
    /**
     * Clear all cache entries with prefix
     */
    async clear() {
        const pattern = `${this.prefix}:*`;
        const keys = await this.redisService.keys(pattern);
        if (keys.length > 0) {
            await Promise.all(keys.map((key) => this.redisService.del(key)));
        }
        this.emit('cache:cleared');
    }
    /**
     * Get cache statistics
     */
    async getStatistics() {
        const pattern = `${this.prefix}:*`;
        const keys = await this.redisService.keys(pattern);
        // Info('memory') is not yet in UnifiedRedisService, falling back to a dummy or extending it.
        // For now, let's keep it simple or skip the memory info if not critical.
        return {
            keyCount: keys.length,
            memoryUsed: 'unknown (managed)',
        };
    }
    /**
     * Get full key with prefix
     */
    getFullKey(key) {
        return `${this.prefix}:${key}`;
    }
    /**
     * Close connections and cleanup
     */
    async close() {
        this.removeAllListeners();
    }
}
exports.SharedCache = SharedCache;
//# sourceMappingURL=SharedCache.js.map