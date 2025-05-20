import { RedisService } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MetricCollector } from './metrics.js';
export declare class TracingService {
    private readonly redisService;
    private readonly configService;
    private readonly eventEmitter;
    private readonly metricCollector;
    private readonly activeTraces;
    private readonly activeSpans;
    private readonly sampleRate;
    private readonly retentionPeriod;
    constructor(redisService: RedisService, configService: ConfigService, eventEmitter: EventEmitter2, metricCollector: MetricCollector);
    addSpanEvent(spanId: string, name: string, attributes?: Record<string, unknown>): void;
    queryTraces(): Promise<void>;
}
