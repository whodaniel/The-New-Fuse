import { ConfigService } from '@nestjs/config';
import { RedisService } from '../services/redis.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class SystemAdaptor {
    private readonly configService;
    private readonly redisService;
    private readonly eventEmitter;
    private readonly config;
    private readonly adaptationThreshold;
    constructor(configService: ConfigService, redisService: RedisService, eventEmitter: EventEmitter2);
    adjust(): Promise<void>;
}
