import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
export interface MemoryUsage {
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
    rss: number;
    timestamp: number;
    percentage: number;
}
export interface MemoryAlert {
    type: 'warning' | 'critical';
    usage: MemoryUsage;
    threshold: number;
    message: string;
}
export declare class MemoryMonitor implements OnModuleInit, OnModuleDestroy {
    private readonly eventEmitter;
    private readonly logger;
    private monitoringInterval;
    private readonly CHECK_INTERVAL;
    private readonly WARNING_THRESHOLD;
    private readonly CRITICAL_THRESHOLD;
    private readonly MAX_HISTORY;
    private memoryHistory;
    constructor(eventEmitter: EventEmitter2);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    startMonitoring(): void;
    stopMonitoring(): void;
    private checkMemoryUsage;
    private checkThresholds;
    private handleWarningMemoryUsage;
    MB: any;
}
//# sourceMappingURL=memory-monitor.d.ts.map