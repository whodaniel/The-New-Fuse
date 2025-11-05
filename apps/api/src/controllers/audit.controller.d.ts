import { AuditService } from '../security/audit.service';
import { AuditAction, AuditResource, AuditStatus } from '@the-new-fuse/database';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getAuditLogs(userId?: string, resource?: AuditResource, action?: AuditAction, status?: AuditStatus, startDate?: string, endDate?: string, limit?: number, offset?: number): Promise<any>;
    getAuditStats(timeRange?: 'day' | 'week' | 'month'): Promise<any>;
    getAuditLog(id: string): Promise<any>;
    getLogs(): Promise<any>;
}
//# sourceMappingURL=audit.controller.d.ts.map