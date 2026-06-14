import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { EventEmitter } from 'events';
/**
 * Shared cache for agent collaboration
 */
export declare class SharedCache extends EventEmitter {
    private redisService;
    private readonly prefix;
    constructor(redisService: UnifiedRedisService, prefix?: string);
    /**
     * Get a value from cache
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set a value in cache
     */
    set(key: string, value: any, ttl?: number): Promise<void>;
    /**
     * Delete a value from cache
     */
    delete(key: string): Promise<boolean>;
    /**
     * Check if key exists
     */
    exists(key: string): Promise<boolean>;
    /**
     * Get multiple values
     */
    mget<T>(keys: string[]): Promise<(T | null)[]>;
    /**
     * Set multiple values
     */
    mset(entries: Record<string, any>): Promise<void>;
    /**
     * Increment a value
     */
    increment(key: string, amount?: number): Promise<number>;
    /**
     * Decrement a value
     */
    decrement(key: string, amount?: number): Promise<number>;
    /**
     * Get and delete (atomic)
     */
    getAndDelete<T>(key: string): Promise<T | null>;
    /**
     * Add to a set
     */
    addToSet(key: string, ...members: string[]): Promise<number>;
    /**
     * Remove from a set
     */
    removeFromSet(key: string, ...members: string[]): Promise<number>;
    /**
     * Get set members
     */
    getSetMembers(key: string): Promise<string[]>;
    /**
     * Check if member is in set
     */
    isSetMember(key: string, member: string): Promise<boolean>;
    /**
     * Push to list (queue)
     */
    pushToList(key: string, ...values: string[]): Promise<number>;
    /**
     * Pop from list (queue)
     */
    popFromList(key: string): Promise<string | null>;
    /**
     * Get list length
     */
    getListLength(key: string): Promise<number>;
    /**
     * Get list range
     */
    getListRange(key: string, start: number, end: number): Promise<string[]>;
    /**
     * Set hash field
     */
    setHashField(key: string, field: string, value: any): Promise<void>;
    /**
     * Get hash field
     */
    getHashField<T>(key: string, field: string): Promise<T | null>;
    /**
     * Get all hash fields
     */
    getHashAll<T>(key: string): Promise<Record<string, T>>;
    /**
     * Delete hash field
     */
    deleteHashField(key: string, field: string): Promise<boolean>;
    /**
     * Get keys matching pattern
     */
    getKeys(pattern?: string): Promise<string[]>;
    /**
     * Clear all cache entries with prefix
     */
    clear(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStatistics(): Promise<{
        keyCount: number;
        memoryUsed: string;
        hitRate?: number;
    }>;
    /**
     * Get full key with prefix
     */
    private getFullKey;
    /**
     * Close connections and cleanup
     */
    close(): Promise<void>;
}
//# sourceMappingURL=SharedCache.d.ts.map