/**
 * Tenant Guard - Ensures requests are properly scoped to an agency
 * Resolves agency context from subdomain or explicit agency ID
 */
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
export declare class TenantGuard implements CanActivate {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractSubdomain;
}
//# sourceMappingURL=tenant.guard.d.ts.map