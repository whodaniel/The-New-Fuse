export interface AuditLogEntry {
    id?: string;
    userId?: string | null;
    action: string;
    resourceType?: string | null;
    resourceId?: string | null;
    details?: any;
    ipAddress?: string | null;
    userAgent?: string | null;
    status?: string;
    errorMessage?: string | null;
    metadata?: any;
    createdAt?: Date;
}
export interface AuditLogQuery {
    userId?: string;
    action?: string;
    resourceType?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
/**
 * Audit Logs Repository - provides data access for audit log entries
 */
export declare class DrizzleAuditLogsRepository {
    /**
     * Create a new audit log entry
     */
    create(data: AuditLogEntry): Promise<AuditLogEntry>;
    /**
     * Find audit log by ID
     */
    findById(id: string): Promise<AuditLogEntry | null>;
    /**
     * Find all audit logs with optional filtering and pagination
     */
    findAll(query?: AuditLogQuery): Promise<AuditLogEntry[]>;
    /**
     * Get total count of audit logs with optional filters
     */
    count(query?: AuditLogQuery): Promise<number>;
    /**
     * Count distinct users active since the given date
     */
    countActiveUsers(startDate: Date): Promise<number>;
    /**
     * Get recent audit logs for a specific user
     */
    findByUserId(userId: string, limit?: number): Promise<AuditLogEntry[]>;
    /**
     * Get audit logs for a specific resource
     */
    findByResource(resourceType: string, resourceId: string, limit?: number): Promise<AuditLogEntry[]>;
    /**
     * Get audit logs for a specific action
     */
    findByAction(action: string, limit?: number): Promise<AuditLogEntry[]>;
    /**
     * Get audit logs within a date range
     */
    findByDateRange(startDate: Date, endDate: Date): Promise<AuditLogEntry[]>;
    /**
     * Delete old audit logs (for retention policy compliance)
     */
    deleteOlderThan(date: Date): Promise<number>;
    /**
     * Get audit log statistics
     */
    getStatistics(startDate?: Date, endDate?: Date): Promise<{
        total: number;
        byAction: Record<string, number>;
        byStatus: Record<string, number>;
        byResourceType: Record<string, number>;
    }>;
}
export declare const drizzleAuditLogsRepository: DrizzleAuditLogsRepository;
//# sourceMappingURL=audit-logs.repository.d.ts.map