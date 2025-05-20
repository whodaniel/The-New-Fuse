import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../src/core/database/(prisma as any).service.js';
export interface ErrorDetails {
    message: string;
    stack?: string;
    code?: string;
    name?: string;
    context?: Record<string, any>;
    userId?: string;
    requestId?: string;
    timestamp?: Date;
    severity?: low' | 'medium' | 'high' | 'critical';
    source?: string;
    tags?: string[];
}
export interface ErrorStats {
    count: number;
    firstSeen: Date;
    lastSeen: Date;
    affectedUsers: number;
    occurrencesByDay: Record<string, number>;
}
export declare class ErrorTrackingService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private readonly sampleRate;
    private readonly groupSimilarErrors;
    constructor(configService: ConfigService, prisma: PrismaService);
    /**
     * Track an error occurrence
     */
    trackError(): Promise<void>;
}
