import { AuditLogEntry, AuditLogQuery } from '@the-new-fuse/database';
export declare class AuditService {
    /**
     * Create an audit log entry
     */
    log(action: string, data: {
        userId?: string;
        resourceType?: string;
        resourceId?: string;
        details?: any;
        ipAddress?: string;
        userAgent?: string;
        status?: string;
        errorMessage?: string;
        metadata?: any;
    }): Promise<AuditLogEntry>;
    /**
     * Get all audit logs with optional filtering and pagination
     */
    getLogs(query?: AuditLogQuery): Promise<AuditLogEntry[]>;
    /**
     * Get audit logs with pagination
     */
    findAll(limit?: number, offset?: number): Promise<AuditLogEntry[]>;
    /**
     * Find audit log by ID
     */
    findById(id: string): Promise<AuditLogEntry | null>;
    /**
     * Get audit logs for a specific user
     */
    findByUserId(userId: string, limit?: number): Promise<AuditLogEntry[]>;
    /**
     * Get audit logs for a specific resource
     */
    findByResource(resourceType: string, resourceId: string, limit?: number): Promise<AuditLogEntry[]>;
    /**
     * Get audit log statistics
     */
    getStatistics(startDate?: Date, endDate?: Date): Promise<{
        total: number;
        byAction: Record<string, number>;
        byStatus: Record<string, number>;
        byResourceType: Record<string, number>;
    }>;
    /**
     * Count audit logs with filters
     */
    count(query?: AuditLogQuery): Promise<number>;
}
//# sourceMappingURL=audit.service.d.ts.map