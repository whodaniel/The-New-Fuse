import { RedisService } from './redis.service';
export declare class CacheService {
    private readonly redisService;
    constructor(redisService: RedisService);
    getCacheStats(): Promise<{
        hitRate: number;
        missRate: number;
        size: number;
    }>;
}
