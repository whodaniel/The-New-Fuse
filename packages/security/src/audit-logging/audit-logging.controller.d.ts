import { AuditLoggingService } from './audit-logging.service';
export interface AuditSearchQuery {
    userId?: string;
    action?: string;
    resource?: string;
    category?: string;
    severity?: string;
    outcome?: string;
    ipAddress?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
export declare class AuditLoggingController {
    private readonly auditService;
    constructor(auditService: AuditLoggingService);
    getAuditLogs(query: AuditSearchQuery): Promise<any>;
    getUserAuditLogs(userId: string, query: Omit<AuditSearchQuery, 'userId'>): Promise<never[]>;
    getSecurityAlerts(limit?: number): Promise<void>;
    getMyAuditLogs(req: any, query: Omit<AuditSearchQuery, 'userId'>): Promise<never[]>;
}
//# sourceMappingURL=audit-logging.controller.d.ts.map