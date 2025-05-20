import { RedisService } from '../services/redis.service.js';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class SecurityPolicyManager {
    private readonly redisService;
    private readonly configService;
    private readonly eventEmitter;
    private readonly policies;
    private readonly rules;
    constructor(redisService: RedisService, configService: ConfigService, eventEmitter: EventEmitter2);
}
