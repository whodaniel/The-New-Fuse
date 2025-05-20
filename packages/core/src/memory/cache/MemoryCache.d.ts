import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../services/redis.service.js';
export declare class MemoryCache {
    private readonly redisService;
    private readonly configService;
    private readonly defaultTTL;
    constructor(redisService: RedisService, configService: ConfigService);
    setMany(items: any, this: any, redisService: any, getClient: any): any;
}
