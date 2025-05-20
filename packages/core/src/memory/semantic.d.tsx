import { ConfigService } from '@nestjs/config';
import { RedisService } from '../services/redis.service.js';
export declare class SemanticIndex {
    private readonly configService;
    private readonly redisService;
    private readonly index;
    private readonly dimension;
    private readonly metric;
    private readonly idMap;
    private nextId;
    constructor(configService: ConfigService, redisService: RedisService);
    remove(): Promise<void>;
}
