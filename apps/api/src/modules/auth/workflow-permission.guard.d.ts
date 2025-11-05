import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { AuditService } from '../../security/audit.service';
export declare class WorkflowPermissionGuard implements CanActivate {
    private prisma;
    private auditService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private loadWorkflowByName;
}
//# sourceMappingURL=workflow-permission.guard.d.ts.map