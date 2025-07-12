/**
 * Agency Role Guard - Validates user roles within agency context
 * Ensures users have appropriate permissions for agency operations
 */
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@the-new-fuse/database';
export declare class AgencyRoleGuard implements CanActivate {
    private reflector;
    private prisma;
    private readonly logger;
    constructor(reflector: Reflector, prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getPermissionsForRole;
}
//# sourceMappingURL=agency-role.guard.d.ts.map