import { RedisService } from '../services/redis.service.js';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MetricCollector } from './metrics.js';
export declare class AlertManager {
    private readonly metricCollector;
    private readonly redisService;
    private readonly configService;
    private readonly eventEmitter;
    private readonly alerts;
    private readonly conditions;
    private readonly checkInterval;
    private checkTimer;
    constructor(metricCollector: MetricCollector, redisService: RedisService, configService: ConfigService, eventEmitter: EventEmitter2);
    private storeAlert;
}
