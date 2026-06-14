import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
export declare class MetricsCollectorService implements OnModuleInit, OnModuleDestroy {
    private readonly redisService;
    private readonly logger;
    private collectionInterval;
    private readonly retentionPeriod;
    constructor(redisService: UnifiedRedisService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    start(): void;
    stop(): void;
    private collectMetrics;
    private getCpuUsage;
    private getMemoryUsage;
    private getEventLoopLag;
}
//# sourceMappingURL=metricsCollector.d.ts.map