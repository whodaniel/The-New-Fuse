import { PrismaService } from '../prisma/prisma.service.js';
export interface MetricQuery {
    startTime?: number;
    endTime?: number;
    metrics?: string[];
    aggregation?: avg' | 'min' | 'max' | 'sum' | 'count';
    interval?: number;
    filters?: Record<string, any>;
}
export interface MetricResult {
    timestamp: number;
    values: Record<string, number>;
    metadata?: Record<string, any>;
}
export declare class MetricService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    record(): Promise<void>;
}
