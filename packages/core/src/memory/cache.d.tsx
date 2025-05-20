import { RedisManager } from '../redis_manager.js';
export interface CacheEntry<T = any> {
    value: T;
    expiresAt?: number;
    metadata?: Record<string, unknown>;
}
export declare class MemoryCache {
    private readonly redisManager;
    private readonly logger;
    ';: any;
    constructor(redisManager: RedisManager);
    set<T>(): Promise<void>;
}
