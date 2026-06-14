/**
 * Audit Logs Repository - Drizzle ORM Implementation
 * Provides comprehensive audit trail for compliance and security monitoring
 */
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { auditLogs } from '../schema/audit-logs.js';
/**
 * Audit Logs Repository - provides data access for audit log entries
 */
export class DrizzleAuditLogsRepository {
    /**
     * Create a new audit log entry
     */
    async create(data) {
        const [log] = await db.insert(auditLogs).values(data).returning();
        return log;
    }
    /**
     * Find audit log by ID
     */
    async findById(id) {
        const [log] = await db.select().from(auditLogs).where(eq(auditLogs.id, id));
        return log ?? null;
    }
    /**
     * Find all audit logs with optional filtering and pagination
     */
    async findAll(query = {}) {
        const conditions = [];
        if (query.userId) {
            conditions.push(eq(auditLogs.userId, query.userId));
        }
        if (query.action) {
            conditions.push(eq(auditLogs.action, query.action));
        }
        if (query.resourceType) {
            conditions.push(eq(auditLogs.resourceType, query.resourceType));
        }
        if (query.status) {
            conditions.push(eq(auditLogs.status, query.status));
        }
        if (query.startDate) {
            conditions.push(gte(auditLogs.createdAt, query.startDate));
        }
        if (query.endDate) {
            conditions.push(lte(auditLogs.createdAt, query.endDate));
        }
        let dbQuery = db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
        if (conditions.length > 0) {
            dbQuery = dbQuery.where(and(...conditions));
        }
        if (query.limit !== undefined) {
            dbQuery = dbQuery.limit(query.limit);
        }
        if (query.offset !== undefined) {
            dbQuery = dbQuery.offset(query.offset);
        }
        return dbQuery;
    }
    /**
     * Get total count of audit logs with optional filters
     */
    async count(query = {}) {
        const conditions = [];
        if (query.userId) {
            conditions.push(eq(auditLogs.userId, query.userId));
        }
        if (query.action) {
            conditions.push(eq(auditLogs.action, query.action));
        }
        if (query.resourceType) {
            conditions.push(eq(auditLogs.resourceType, query.resourceType));
        }
        if (query.status) {
            conditions.push(eq(auditLogs.status, query.status));
        }
        if (query.startDate) {
            conditions.push(gte(auditLogs.createdAt, query.startDate));
        }
        if (query.endDate) {
            conditions.push(lte(auditLogs.createdAt, query.endDate));
        }
        let dbQuery = db.select({ count: sql `count(*)` }).from(auditLogs);
        if (conditions.length > 0) {
            dbQuery = dbQuery.where(and(...conditions));
        }
        const result = await dbQuery;
        return Number(result[0]?.count ?? 0);
    }
    /**
     * Count distinct users active since the given date
     */
    async countActiveUsers(startDate) {
        const result = await db
            .select({ count: sql `count(distinct ${auditLogs.userId})` })
            .from(auditLogs)
            .where(gte(auditLogs.createdAt, startDate));
        return Number(result[0]?.count ?? 0);
    }
    /**
     * Get recent audit logs for a specific user
     */
    async findByUserId(userId, limit = 50) {
        return db
            .select()
            .from(auditLogs)
            .where(eq(auditLogs.userId, userId))
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit);
    }
    /**
     * Get audit logs for a specific resource
     */
    async findByResource(resourceType, resourceId, limit = 50) {
        return db
            .select()
            .from(auditLogs)
            .where(and(eq(auditLogs.resourceType, resourceType), eq(auditLogs.resourceId, resourceId)))
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit);
    }
    /**
     * Get audit logs for a specific action
     */
    async findByAction(action, limit = 100) {
        return db
            .select()
            .from(auditLogs)
            .where(eq(auditLogs.action, action))
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit);
    }
    /**
     * Get audit logs within a date range
     */
    async findByDateRange(startDate, endDate) {
        return db
            .select()
            .from(auditLogs)
            .where(and(gte(auditLogs.createdAt, startDate), lte(auditLogs.createdAt, endDate)))
            .orderBy(desc(auditLogs.createdAt));
    }
    /**
     * Delete old audit logs (for retention policy compliance)
     */
    async deleteOlderThan(date) {
        const result = await db.delete(auditLogs).where(lte(auditLogs.createdAt, date)).returning();
        return result.length;
    }
    /**
     * Get audit log statistics
     */
    async getStatistics(startDate, endDate) {
        const conditions = [];
        if (startDate) {
            conditions.push(gte(auditLogs.createdAt, startDate));
        }
        if (endDate) {
            conditions.push(lte(auditLogs.createdAt, endDate));
        }
        let baseQuery = db.select().from(auditLogs);
        if (conditions.length > 0) {
            baseQuery = baseQuery.where(and(...conditions));
        }
        const logs = await baseQuery;
        const stats = {
            total: logs.length,
            byAction: {},
            byStatus: {},
            byResourceType: {},
        };
        logs.forEach((log) => {
            // Count by action
            if (log.action) {
                stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
            }
            // Count by status
            if (log.status) {
                stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
            }
            // Count by resource type
            if (log.resourceType) {
                stats.byResourceType[log.resourceType] = (stats.byResourceType[log.resourceType] || 0) + 1;
            }
        });
        return stats;
    }
}
// Export singleton instance
export const drizzleAuditLogsRepository = new DrizzleAuditLogsRepository();
//# sourceMappingURL=audit-logs.repository.js.map