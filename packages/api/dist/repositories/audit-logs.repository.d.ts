/**
 * Audit Logs Repository - Drizzle ORM Analysis
 *
 * This repository provides data access for Audit Log entities using Drizzle ORM.
 * Adapted for NestJS Dependency Injection.
 */
import { type DrizzleClient } from '@the-new-fuse/database';
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
export declare class AuditLogsRepository {
    private readonly db;
    constructor(db: DrizzleClient);
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
     * Get audit logs statistics
     */
    getStatistics(startDate?: Date, endDate?: Date): Promise<{
        total: number;
        byAction: Record<string, number>;
        byStatus: Record<string, number>;
        byResourceType: Record<string, number>;
    }>;
}
//# sourceMappingURL=audit-logs.repository.d.ts.map