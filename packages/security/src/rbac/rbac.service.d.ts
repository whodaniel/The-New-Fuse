import { PrismaService } from '@the-new-fuse/database';
export declare class RbacService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    hasPermission(userId: string, permission: string): Promise<boolean>;
    hasRole(userId: string, role: string): Promise<boolean>;
    getUserRoles(userId: string): Promise<string[]>;
    getUserPermissions(userId: string): Promise<string[]>;
}
//# sourceMappingURL=rbac.service.d.ts.map