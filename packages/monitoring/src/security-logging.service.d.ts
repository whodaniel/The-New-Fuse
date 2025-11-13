import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@the-new-fuse/database';
export interface SecurityEvent {
    eventType: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    resource?: string;
    action: string;
    status: 'success' | 'failure' | 'attempt';
    details?: Record<string, unknown>;
    timestamp?: Date;
    severity?: 'info' | 'warning' | 'critical';
    sessionId?: string;
    requestId?: string;
}
export declare class SecurityLoggingService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private readonly enabled;
    private readonly logToConsole;
    private readonly sensitiveFields;
    constructor(configService: ConfigService, prisma: PrismaService);
    /**
     * Log a security event
     */
    logSecurityEvent(event: SecurityEvent): Promise<void>;
    catch(error: any): {
        events: never[];
        total: number;
    };
}
//# sourceMappingURL=security-logging.service.d.ts.map