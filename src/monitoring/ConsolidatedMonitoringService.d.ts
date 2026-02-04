import { OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnifiedMonitoringService } from './UnifiedMonitoringService.tsx';
import { RedisService } from '../services/redis.service.js';
/**
 * ConsolidatedMonitoringService
 *
 * This service acts as a facade for all monitoring functionality in the application.
 * It delegates to UnifiedMonitoringService for most functionality while providing
 * a clean, consistent API for all monitoring needs.
 *
 * In the future, all monitoring services should be migrated to use this service
 * instead of directly using UnifiedMonitoringService or other monitoring services.
 */
export declare class ConsolidatedMonitoringService implements OnModuleInit {
    private readonly unifiedMonitoring;
    private readonly eventEmitter;
    private readonly redisService;
    private readonly logger;
    constructor(unifiedMonitoring: UnifiedMonitoringService, eventEmitter: EventEmitter2, redisService: RedisService);
    onModuleInit(): Promise<void>;
    private setupEventForwarding;
    recordMetric(name: string, value: number, tags?: Record<string, string>): any;
    recordLatency(operation: string, durationMs: number, tags?: Record<string, string>): any;
    logEvent(eventName: string, data?: any): any;
    trackError(error: Error, context?: Record<string, any>): any;
    checkHealth(): Promise<{
        healthy: boolean;
        details: Record<string, any>;
    }>;
    getRecentOutputs(limit?: number): Promise<{
        type: string;
        data: any;
        timestamp: string;
    }[]>;
    getRecentErrors(limit?: number): Promise<{
        error: any;
        timestamp: string;
    }[]>;
    trackTraeMetrics(data: any): Promise<any>;
}
//# sourceMappingURL=ConsolidatedMonitoringService.d.ts.map