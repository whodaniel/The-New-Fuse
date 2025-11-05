import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
export declare class AgentPermissionGuard implements CanActivate {
    private prisma;
    constructor(prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
//# sourceMappingURL=agent-permission.guard.d.ts.map