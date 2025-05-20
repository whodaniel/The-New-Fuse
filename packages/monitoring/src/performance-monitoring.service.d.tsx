import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../src/core/database/(prisma as any).service.js';
export interface PerformanceMetric {
    name: string;
    value: number;
    tags?: Record<string, string>;
    timestamp?: Date;
    unit?: string;
    context?: Record<string, any>;
}
export interface PerformanceThreshold {
    metricName: string;
    operator: gt' | 'lt' | 'gte' | 'lte' | 'eq';
    value: number;
    severity: info' | 'warning' | 'critical';
    duration?: number;
}
export declare class PerformanceMonitoringService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private readonly sampleRate;
    private readonly thresholds;
    private readonly alertingEnabled;
    constructor(configService: ConfigService, prisma: PrismaService);
    if(this: any, alertingEnabled: unknown): void;
    /**
     * Record response time for an operation
     */
    recordResponseTime(): Promise<void>;
}
