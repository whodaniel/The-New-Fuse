import { RedisService } from '../services/redis.service';
import { LoggingService } from '../services/logging.service';
export declare class CacheService {
    private readonly redisService;
    private readonly logger;
    constructor(redisService: RedisService, logger: LoggingService);
    /**
     * Set a value in the cache
     * @param key The key to store the value under
     * @param value The value to store
     * @param ttl Time to live in seconds (optional)
     */
    set(key: string, value: any, ttl?: number): Promise<void>;
    /**
     * Get a value from the cache
     * @param key The key to retrieve
     * @returns The stored value or null if not found
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Delete a value from the cache
     * @param key The key to delete
     */
    delete(key: string): Promise<void>;
    /**
     * Check if a key exists in the cache
     * @param key The key to check
     * @returns True if the key exists, false otherwise
     */
    exists(key: string): Promise<boolean>;
    /**
     * Set a hash field in the cache
     * @param key The hash key
     * @param field The field to set
     * @param value The value to set
     */
    hset(key: string, field: string, value: any): Promise<void>;
    /**
     * Get a hash field from the cache
     * @param key The hash key
     * @param field The field to get
     * @returns The stored value or null if not found
     */
    hget<T>(key: string, field: string): Promise<T | null>;
}
