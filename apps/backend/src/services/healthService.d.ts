import { RedisService } from './redisService';
import { CacheService } from './cacheService';
export declare class HealthService {
    private readonly redis;
    private readonly cache;
    constructor(redis: RedisService, cache: CacheService);
    checkHealth(): Promise<{
        status: string;
        redis: boolean;
        cache: {
            status: boolean;
            stats: {
                hitRate: number;
                missRate: number;
                size: number;
            };
        };
    }>;
}
