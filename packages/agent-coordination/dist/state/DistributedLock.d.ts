import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { EventEmitter } from 'events';
/**
 * Distributed lock implementation using Redis
 */
export declare class DistributedLock extends EventEmitter {
    private redisService;
    private locks;
    constructor(redisService: UnifiedRedisService);
    /**
     * Acquire a lock
     */
    acquire(key: string, ttl?: number, retries?: number, retryDelay?: number): Promise<string | null>;
    /**
     * Try to acquire lock (single attempt)
     */
    private tryAcquire;
    /**
     * Release a lock
     */
    release(key: string, token: string): Promise<boolean>;
    /**
     * Extend lock TTL
     */
    extend(key: string, token: string, ttl: number): Promise<boolean>;
    /**
     * Check if lock is held
     */
    isLocked(key: string): Promise<boolean>;
    /**
     * Get lock TTL
     */
    getTTL(key: string): Promise<number>;
    /**
     * Execute function with lock
     */
    withLock<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T>;
    /**
     * Generate unique token
     */
    private generateToken;
    /**
     * Delay helper
     */
    private delay;
    /**
     * Get all locks
     */
    getAllLocks(): Array<{
        key: string;
        token: string;
        expiresAt: number;
    }>;
    /**
     * Clean up expired locks from local cache
     */
    cleanExpiredLocks(): void;
    /**
     * Close connections and cleanup
     */
    close(): Promise<void>;
}
//# sourceMappingURL=DistributedLock.d.ts.map