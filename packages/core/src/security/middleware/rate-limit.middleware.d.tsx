import { NestMiddleware } from '@nestjs/common';
import { RedisService } from '../../services/redis.service.js';
import { SecurityService } from '../index.js';
export declare class RateLimitMiddleware implements NestMiddleware {
    private readonly redisService;
    private readonly securityService;
    constructor(redisService: RedisService, securityService: SecurityService);
    use(): Promise<void>;
}
