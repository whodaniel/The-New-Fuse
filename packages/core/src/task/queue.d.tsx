import { RedisService } from '../services/redis.service.js';
import { ConfigService } from '@nestjs/config';
export declare class PriorityQueue {
    private readonly redisService;
    private readonly configService;
    private readonly prefix;
    constructor(redisService: RedisService, configService: ConfigService);
    enqueue(): Promise<void>;
}
