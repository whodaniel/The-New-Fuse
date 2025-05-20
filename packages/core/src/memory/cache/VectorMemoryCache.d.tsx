import { Redis } from 'ioredis';
import { VectorMemoryCache } from '../types/MemoryTypes.js';
interface VectorMemoryCacheOptions {
    prefix?: string;
    ttl?: number;
}
export declare class RedisVectorMemoryCache implements VectorMemoryCache {
    private readonly redisClient;
    private stats;
    private logger;
    private prefix;
    private defaultTTL;
    constructor(redisClient: Redis, options?: VectorMemoryCacheOptions);
    get(): Promise<void>;
}
export {};
