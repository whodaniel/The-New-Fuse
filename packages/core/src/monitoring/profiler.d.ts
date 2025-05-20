import { RedisService } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MetricCollector } from './metrics.js';
export declare class PerformanceProfiler {
    private readonly redisService;
    private readonly configService;
    private readonly eventEmitter;
    private readonly metricCollector;
    private readonly profiles;
    private readonly profilingInterval;
    private readonly retentionPeriod;
    private profilingTimer;
    constructor(redisService: RedisService, configService: ConfigService, eventEmitter: EventEmitter2, metricCollector: MetricCollector);
    private collectNetworkProfile;
}
