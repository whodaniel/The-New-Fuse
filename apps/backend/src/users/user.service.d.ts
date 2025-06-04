import { RedisService } from '@core/redis/redis.service.ts';
export declare class UserService {
    private readonly redis;
    private readonly CACHE_TTL;
    private readonly CACHE_PREFIX;
    constructor(redis: RedisService);
    getUserById(id: string): Promise<any>;
    invalidateUserCache(id: string): Promise<void>;
    private fetchUserFromDb;
}
