import { RedisService } from '../redis/RedisService.js';
import { Logger } from '../logging/LoggingService.js';
export interface CacheConfig {
    defaultTTL: number;
    maxKeys?: number;
    compressionThreshold?: number;
}
export interface CacheStats {
    hits: number;
    misses: number;
    keys: number;
    memoryUsage: number;
}
export declare class CacheManager {
    private readonly redisService;
    private readonly config;
    private stats;
    private logger;
    constructor(redisService: RedisService, config: CacheConfig, logger: Logger);
    private isCompressed;
    private decompress;
}
