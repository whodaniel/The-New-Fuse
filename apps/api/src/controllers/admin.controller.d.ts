import { Permission } from '@the-new-fuse/types';
import { RoleService } from '../services/role.service';
import { AuditService } from '../services/audit.service';
import { MetricsService } from '../services/metrics.service';
export declare class AdminController {
    private readonly roleService;
    private readonly auditService;
    private readonly metricsService;
    constructor(roleService: RoleService, auditService: AuditService, metricsService: MetricsService);
    runScript(script: string): Promise<{
        success: boolean;
        output: string;
        error?: never;
    } | {
        success: boolean;
        error: string;
        output?: never;
    }>;
    getRoles(): Promise<any>;
    updateRolePermissions(roleId: string, permissions: Permission[]): Promise<any>;
    getAuditLogs(): Promise<any>;
    getSystemMetrics(): Promise<any>;
}
//# sourceMappingURL=admin.controller.d.ts.map