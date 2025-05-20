import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../src/core/database/(prisma as any).service.js';
export interface SecurityEvent {
    eventType: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    resource?: string;
    action: string;
    status: success' | 'failure' | 'attempt';
    details?: Record<string, any>;
    timestamp?: Date;
    severity?: info' | 'warning' | 'critical';
    sessionId?: string;
    requestId?: string;
}
export declare class SecurityLoggingService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private readonly logToConsole;
    private readonly sensitiveFields;
    constructor(configService: ConfigService, prisma: PrismaService);
    if(this: any, logToConsole: unknown): void;
}
