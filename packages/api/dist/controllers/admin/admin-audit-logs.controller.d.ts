/**
 * Admin Audit Logs Controller
 *
 * Exposes endpoints for managing audit logs in the admin panel.
 */
import { Response } from 'express';
import { AdminAuditLogsService } from '../../services/admin-audit-logs.service';
export declare class AdminAuditLogsController {
    private readonly auditLogsService;
    constructor(auditLogsService: AdminAuditLogsService);
    getAuditLogs(userId?: string, action?: string, resourceType?: string, status?: string, startDate?: string, endDate?: string, limit?: string, offset?: string, res?: Response): Promise<Response<any, Record<string, any>>>;
    getStatistics(startDate?: string, endDate?: string, res?: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=admin-audit-logs.controller.d.ts.map