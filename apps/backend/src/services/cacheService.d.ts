import { RedisService } from './redis.service.js';
export declare class CacheService {
    private readonly redisService;
    constructor(redisService: RedisService);
    getCacheStats(): Promise<{
        hitRate: number;
        missRate: number;
        size: number;
    }>;
}
