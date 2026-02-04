import { OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '../services/redis.service.js';
import { ConfigService } from '@nestjs/config';
export declare class UnifiedMonitoringService implements OnModuleInit {
    private readonly eventEmitter;
    private readonly redisService;
    private readonly configService?;
    private readonly logger;
    private messageCounter;
    private processingTimeHistogram;
    private healthCheckGauge;
    private tracer;
    private outputs;
    private errors;
    private readonly MAX_HISTORY_SIZE;
    private config;
    constructor(eventEmitter: EventEmitter2, redisService: RedisService, configService?: ConfigService | undefined);
    onModuleInit(): Promise<void>;
    private initializeMetrics;
    private initializeEventListeners;
    private handleActivity;
    private startHealthChecks;
    private handleError;
    private storeOutput;
    private storeError;
    getRecentOutputs(limit?: number): Promise<{
        type: string;
        data: any;
        timestamp: string;
    }[]>;
    getRecentErrors(limit?: number): Promise<{
        error: any;
        timestamp: string;
    }[]>;
}
//# sourceMappingURL=UnifiedMonitoringService.d.ts.map