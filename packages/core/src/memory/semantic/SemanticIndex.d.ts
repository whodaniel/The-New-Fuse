import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../services/redis.service.js';
export declare class SemanticIndex {
    private readonly configService;
    private readonly redisService;
    private readonly namespace;
    private readonly maxResults;
    constructor(configService: ConfigService, redisService: RedisService);
    private matchesFilter;
}
