import { Permission } from '@the-new-fuse/types';
export declare class AdminController {
    runScript(script: string): Promise<{
        success: boolean;
        output: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        output?: undefined;
    }>;
    getRoles(): Promise<any>;
    updateRolePermissions(roleId: string, permissions: Permission[]): Promise<any>;
    getAuditLogs(): Promise<any>;
    getSystemMetrics(): Promise<any>;
}
