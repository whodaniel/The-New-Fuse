import { RedisService } from '../services/redis.service.js';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class SecurityAuditService {
    private readonly redisService;
    private readonly configService;
    private readonly eventEmitter;
    private readonly config;
    private readonly auditQueue;
    private readonly flushInterval;
    private flushTimer;
    constructor(redisService: RedisService, configService: ConfigService, eventEmitter: EventEmitter2);
    recordError(): Promise<void>;
}
