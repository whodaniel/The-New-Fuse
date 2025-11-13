import { PrismaService } from '@the-new-fuse/database';
import { Request } from 'express';
export interface AuditLogData {
    userId?: string;
    action: string;
    resource: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    metadata?: any;
}
export declare class AuthAuditIntegrationService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    logAuthEvent(data: AuditLogData): Promise<void>;
    logLogin(userId: string, request: Request): void;
    logLogout(userId: string, request: Request): void;
    logFailedLogin(email: string, request: Request, reason?: string): void;
    logPasswordChange(userId: string, request: Request): void;
    logMfaSetup(userId: string, request: Request): void;
    logMfaEnabled(userId: string, request: Request): void;
    logMfaDisabled(userId: string, request: Request): void;
    logMfaFailed(userId: string, request: Request): void;
    logUnauthorizedAccess(userId: string, resource: string, request: Request): void;
}
//# sourceMappingURL=audit-integration.service.d.ts.map