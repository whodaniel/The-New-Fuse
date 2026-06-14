"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistributedLock = void 0;
const events_1 = require("events");
/**
 * Distributed lock implementation using Redis
 */
class DistributedLock extends events_1.EventEmitter {
    constructor(redisService) {
        super();
        this.locks = new Map();
        this.redisService = redisService;
    }
    /**
     * Acquire a lock
     */
    async acquire(key, ttl = 30000, retries = 3, retryDelay = 100) {
        const token = this.generateToken();
        for (let i = 0; i < retries; i++) {
            const acquired = await this.tryAcquire(key, token, ttl);
            if (acquired) {
                const expiresAt = Date.now() + ttl;
                this.locks.set(key, { token, expiresAt });
                this.emit('lock:acquired', key, token);
                return token;
            }
            // Wait before retry
            if (i < retries - 1) {
                await this.delay(retryDelay * Math.pow(2, i));
            }
        }
        this.emit('lock:failed', key);
        return null;
    }
    /**
     * Try to acquire lock (single attempt)
     */
    async tryAcquire(key, token, ttl) {
        const lockKey = `lock:${key}`;
        // SET NX: only set if key doesn't exist
        // PX: set expiry in milliseconds
        const result = await this.redisService.set(lockKey, token, ttl, 'NX', 'PX');
        return result === 'OK';
    }
    /**
     * Release a lock
     */
    async release(key, token) {
        const lockKey = `lock:${key}`;
        // Use Lua script to ensure atomic check-and-delete
        const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
        const result = await this.redisService.eval(script, [lockKey], [token]);
        if (result === 1) {
            this.locks.delete(key);
            this.emit('lock:released', key, token);
            return true;
        }
        return false;
    }
    /**
     * Extend lock TTL
     */
    async extend(key, token, ttl) {
        const lockKey = `lock:${key}`;
        // Use Lua script for atomic check-and-extend
        const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("pexpire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;
        const result = await this.redisService.eval(script, [lockKey], [token, ttl]);
        if (result === 1) {
            const lock = this.locks.get(key);
            if (lock && lock.token === token) {
                lock.expiresAt = Date.now() + ttl;
            }
            this.emit('lock:extended', key, token);
            return true;
        }
        return false;
    }
    /**
     * Check if lock is held
     */
    async isLocked(key) {
        const lockKey = `lock:${key}`;
        return await this.redisService.exists(lockKey);
    }
    /**
     * Get lock TTL
     */
    async getTTL(key) {
        const lockKey = `lock:${key}`;
        return await this.redisService.pttl(lockKey);
    }
    /**
     * Execute function with lock
     */
    async withLock(key, fn, ttl = 30000) {
        const token = await this.acquire(key, ttl);
        if (!token) {
            throw new Error(`Failed to acquire lock for key: ${key}`);
        }
        try {
            return await fn();
        }
        finally {
            await this.release(key, token);
        }
    }
    /**
     * Generate unique token
     */
    generateToken() {
        return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Get all locks
     */
    getAllLocks() {
        return Array.from(this.locks.entries()).map(([key, value]) => ({
            key,
            ...value,
        }));
    }
    /**
     * Clean up expired locks from local cache
     */
    cleanExpiredLocks() {
        const now = Date.now();
        for (const [key, lock] of this.locks.entries()) {
            if (lock.expiresAt < now) {
                this.locks.delete(key);
                this.emit('lock:expired', key);
            }
        }
    }
    /**
     * Close connections and cleanup
     */
    async close() {
        this.locks.clear();
        this.removeAllListeners();
    }
}
exports.DistributedLock = DistributedLock;
//# sourceMappingURL=DistributedLock.js.map