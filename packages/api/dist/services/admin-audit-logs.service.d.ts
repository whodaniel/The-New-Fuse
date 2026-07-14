/**
 * Admin Audit Logs Service
 *
 * Service for retrieving and managing audit logs in the admin panel.
 */
import { AuditLogEntry, AuditLogQuery, AuditLogsRepository } from '../repositories/audit-logs.repository';
export declare class AdminAuditLogsService {
    private readonly auditLogsRepository;
    constructor(auditLogsRepository: AuditLogsRepository);
    /**
     * Get all audit logs with filters
     */
    getAuditLogs(query: AuditLogQuery): Promise<{
        data: AuditLogEntry[];
        total: number;
    }>;
    /**
     * Get audit log by ID
     */
    getAuditLogById(id: string): Promise<AuditLogEntry | null>;
    /**
     * Get audit log statistics
     */
    getStatistics(startDate?: Date, endDate?: Date): Promise<any>;
    /**
     * Create an audit log manually (if needed by admin)
     */
    createAuditLog(data: AuditLogEntry): Promise<AuditLogEntry>;
}
//# sourceMappingURL=admin-audit-logs.service.d.ts.map