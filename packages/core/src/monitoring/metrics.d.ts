import { RedisService } from '../services/redis.service.js';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class MetricCollector {
    private readonly redisService;
    private readonly configService;
    private readonly eventEmitter;
    private readonly metrics;
    private readonly retentionPeriod;
    private readonly flushInterval;
    private flushTimer;
    constructor(redisService: RedisService, configService: ConfigService, eventEmitter: EventEmitter2);
}
