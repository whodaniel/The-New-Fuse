import { OnModuleDestroy } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
export interface Metric {
    timestamp: Date;
    value: number;
    labels?: Record<string, string>;
}
export interface SystemHealth {
    responseTimes: {
        avg: number;
        p95: number;
        p99: number;
    };
    messageCounts: {
        total: number;
        byType: Record<string, number>;
    };
    errorRates: {
        total: number;
        byType: Record<string, number>;
    };
}
export declare class MonitoringService implements OnModuleDestroy {
    private readonly logger;
    private readonly redisService;
    constructor(redisService: UnifiedRedisService);
    onModuleDestroy(): void;
    /**
     * Increments a counter metric.
     */
    increment(key: string, labels?: Record<string, string>): Promise<void>;
    /**
     * Records a timing measurement for a function.
     */
    recordTime<T>(key: string, fn: () => Promise<T>, labels?: Record<string, string>): Promise<T>;
    /**
     * Calculates system health metrics.
     */
    getSystemHealth(): Promise<SystemHealth>;
    private getTimingStats;
    private getCounterStats;
    private calculatePercentile;
    private serializeLabels;
}
//# sourceMappingURL=monitoring.d.ts.map