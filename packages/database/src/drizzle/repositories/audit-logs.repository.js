"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleAuditLogsRepository = exports.DrizzleAuditLogsRepository = void 0;
/**
 * Audit Logs Repository - Drizzle ORM Implementation
 * Provides comprehensive audit trail for compliance and security monitoring
 */
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const audit_logs_1 = require("../schema/audit-logs");
/**
 * Audit Logs Repository - provides data access for audit log entries
 */
class DrizzleAuditLogsRepository {
    /**
     * Create a new audit log entry
     */
    async create(data) {
        const [log] = await client_1.db.insert(audit_logs_1.auditLogs).values(data).returning();
        return log;
    }
    /**
     * Find audit log by ID
     */
    async findById(id) {
        const [log] = await client_1.db.select().from(audit_logs_1.auditLogs).where((0, drizzle_orm_1.eq)(audit_logs_1.auditLogs.id, id));
        return log ?? null;
    }
    /**
     * Find all audit logs with optional filtering and pagination
     */
    async findAll(query = {}) {
        const conditions = [];
        if (query.userId) {
            conditions.push((0, drizzle_orm_1.eq)(audit_logs_1.auditLogs.userId, query.userId));
        }
        if (query.action) {
            conditions.push((0, drizzle_orm_1.eq)(audit_logs_1.auditLogs.action, query.action));
        }
        if (query.resourceType) {
            conditions.push((0, drizzle_orm_1.eq)(audit_logs_1.auditLogs.resourceType, query.resourceType));
        }
        if (query.status) {
            conditions.push((0, drizzle_orm_1.eq)(audit_logs_1.auditLogs.status, query.status));
        }
        if (query.startDate) {
            conditions.push((0, drizzle_orm_1.gte)(audit_logs_1.auditLogs.createdAt, query.startDate));
        }
        if (query.endDate) {
            conditions.push((0, drizzle_orm_1.lte)(audit_logs_1.auditLogs.createdAt, query.endDate));
        }
        let dbQuery = client_1.db.select().from(audit_logs_1.auditLogs).orderBy((0, drizzle_orm_1.desc)(audit_logs_1.auditLogs.createdAt));
        if (conditions.length > 0) {
            dbQuery = dbQuery.where((0, drizzle_orm_1.and)(...conditions));
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
            conditions.push((0, drizzle_orm_1.eq)(audit_logs_1.auditLogs.userId, query.userId));
        }
        if (query.action) {
            conditions.push((0, drizzle_orm_1.eq)(audit_logs_1.auditLogs.action, query.action));
        }
        if (query.resourceType) {
            conditions.push((0, drizzle_orm_1.eq)(audit_logs_1.auditLogs.resourceType, query.resourceType));
        }
        if (query.status) {
            conditions.push((0, drizzle_orm_1.eq)(audit_logs_1.auditLogs.status, query.status));
        }
        if (query.startDate) {
            conditions.push((0, drizzle_orm_1.gte)(audit_logs_1.auditLogs.createdAt, query.startDate));
        }
        if (query.endDate) {
            conditions.push((0, drizzle_orm_1.lte)(audit_logs_1.auditLogs.createdAt, query.endDate));
        }
        let dbQuery = client_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(audit_logs_1.auditLogs);
        if (conditions.length > 0) {
            dbQuery = dbQuery.where((0, drizzle_orm_1.and)(...conditions));
        }
        const result = await dbQuery;
        return Number(result[0]?.count ?? 0);
    }
    /**
     * Count distinct users active since the given date
     */
    async countActiveUsers(startDate) {
        const result = await client_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(distinct ${audit_logs_1.auditLogs.userId})` })
            .from(audit_logs_1.auditLogs)
            .where((0, drizzle_orm_1.gte)(audit_logs_1.auditLogs.createdAt, startDate));
        return Number(result[0]?.count ?? 0);
    }
    /**
     * Get recent audit logs for a specific user
     */
    async findByUserId(userId, limit = 50) {
        return client_1.db
            .select()
            .from(audit_logs_1.auditLogs)
            .where((0, drizzle_orm_1.eq)(audit_logs_1.auditLogs.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(audit_logs_1.auditLogs.createdAt))
            .limit(limit);
    }
    /**
     * Get audit logs for a specific resource
     */
    async findByResource(resourceType, resourceId, limit = 50) {
        return client_1.db
            .select()
            .from(audit_logs_1.auditLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(audit_logs_1.auditLogs.resourceType, resourceType), (0, drizzle_orm_1.eq)(audit_logs_1.auditLogs.resourceId, resourceId)))
            .orderBy((0, drizzle_orm_1.desc)(audit_logs_1.auditLogs.createdAt))
            .limit(limit);
    }
    /**
     * Get audit logs for a specific action
     */
    async findByAction(action, limit = 100) {
        return client_1.db
            .select()
            .from(audit_logs_1.auditLogs)
            .where((0, drizzle_orm_1.eq)(audit_logs_1.auditLogs.action, action))
            .orderBy((0, drizzle_orm_1.desc)(audit_logs_1.auditLogs.createdAt))
            .limit(limit);
    }
    /**
     * Get audit logs within a date range
     */
    async findByDateRange(startDate, endDate) {
        return client_1.db
            .select()
            .from(audit_logs_1.auditLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(audit_logs_1.auditLogs.createdAt, startDate), (0, drizzle_orm_1.lte)(audit_logs_1.auditLogs.createdAt, endDate)))
            .orderBy((0, drizzle_orm_1.desc)(audit_logs_1.auditLogs.createdAt));
    }
    /**
     * Delete old audit logs (for retention policy compliance)
     */
    async deleteOlderThan(date) {
        const result = await client_1.db.delete(audit_logs_1.auditLogs).where((0, drizzle_orm_1.lte)(audit_logs_1.auditLogs.createdAt, date)).returning();
        return result.length;
    }
    /**
     * Get audit log statistics
     */
    async getStatistics(startDate, endDate) {
        const conditions = [];
        if (startDate) {
            conditions.push((0, drizzle_orm_1.gte)(audit_logs_1.auditLogs.createdAt, startDate));
        }
        if (endDate) {
            conditions.push((0, drizzle_orm_1.lte)(audit_logs_1.auditLogs.createdAt, endDate));
        }
        let baseQuery = client_1.db.select().from(audit_logs_1.auditLogs);
        if (conditions.length > 0) {
            baseQuery = baseQuery.where((0, drizzle_orm_1.and)(...conditions));
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
exports.DrizzleAuditLogsRepository = DrizzleAuditLogsRepository;
// Export singleton instance
exports.drizzleAuditLogsRepository = new DrizzleAuditLogsRepository();
//# sourceMappingURL=audit-logs.repository.js.map