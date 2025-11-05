import { PrismaService } from '@the-new-fuse/database';
import { AuditService } from '../security/audit.service';
export declare class PermissionService {
    private prisma;
    private auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    getUserPermissions(userId: string): Promise<{
        allowedAgentIds: any;
    }>;
    updateUserPermissions(userId: string, agentIds: string[], adminUserId?: string, adminUserEmail?: string, ipAddress?: string): Promise<any>;
    getAllAgents(): Promise<any>;
}
//# sourceMappingURL=permission.service.d.ts.map