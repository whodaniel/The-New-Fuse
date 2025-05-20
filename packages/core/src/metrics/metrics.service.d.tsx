import { MetricsConfig } from '@the-new-fuse/types';
import { PrismaService } from '../prisma/prisma.service.js';
export interface MetricsQuery {
    startTime: Date;
    endTime: Date;
    metrics: string[];
}
export interface MetricsResult {
    timestamp: number;
    values: Record<string, number>;
}
export declare class MetricsService {
    private readonly logger;
    MetricsCollector: any;
    private readonly prisma;
    constructor(config: MetricsConfig, prisma: PrismaService);
    getMemoryUsage(): Promise<void>;
}
