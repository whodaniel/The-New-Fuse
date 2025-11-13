import { PrismaService } from '@the-new-fuse/database';
export interface AuditLogEntry {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    error?: string;
}
export declare class AuditLoggingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(entry: AuditLogEntry): Promise<void>;
    findByUser(userId: string, limit?: number): Promise<never[]>;
    findByAction(action: string, limit?: number): Promise<never[]>;
    getSecurityEvents(limit?: number): Promise<void>;
}
//# sourceMappingURL=audit-logging.service.d.ts.map