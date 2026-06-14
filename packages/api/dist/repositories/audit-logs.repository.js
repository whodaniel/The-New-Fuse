/**
 * Audit Logs Repository - Drizzle ORM Analysis
 *
 * This repository provides data access for Audit Log entities using Drizzle ORM.
 * Adapted for NestJS Dependency Injection.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, DRIZZLE_CLIENT, drizzleSchema, eq, gte, lte, sql, } from '@the-new-fuse/database';
// Destructure the schema tables we need
const { auditLogs } = drizzleSchema;
let AuditLogsRepository = class AuditLogsRepository {
    constructor(db) {
        this.db = db;
    }
    /**
     * Create a new audit log entry
     */
    async create(data) {
        const [log] = await this.db.insert(auditLogs).values(data).returning();
        return log;
    }
    /**
     * Find audit log by ID
     */
    async findById(id) {
        const [log] = await this.db.select().from(auditLogs).where(eq(auditLogs.id, id));
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
        let dbQuery = this.db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
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
        let dbQuery = this.db.select({ count: sql `cast(count(*) as integer)` }).from(auditLogs);
        if (conditions.length > 0) {
            dbQuery = dbQuery.where(and(...conditions));
        }
        const result = await dbQuery;
        return Number(result[0]?.count ?? 0);
    }
    /**
     * Get recent audit logs for a specific user
     */
    async findByUserId(userId, limit = 50) {
        return this.db
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
        return this.db
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
        return this.db
            .select()
            .from(auditLogs)
            .where(eq(auditLogs.action, action))
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit);
    }
    /**
     * Get audit logs statistics
     */
    async getStatistics(startDate, endDate) {
        const conditions = [];
        if (startDate) {
            conditions.push(gte(auditLogs.createdAt, startDate));
        }
        if (endDate) {
            conditions.push(lte(auditLogs.createdAt, endDate));
        }
        let baseQuery = this.db.select().from(auditLogs);
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
                if (log.resourceType) {
                    stats.byResourceType[log.resourceType] =
                        (stats.byResourceType[log.resourceType] || 0) + 1;
                }
            }
        });
        return stats;
    }
};
AuditLogsRepository = __decorate([
    Injectable(),
    __param(0, Inject(DRIZZLE_CLIENT)),
    __metadata("design:paramtypes", [Object])
], AuditLogsRepository);
export { AuditLogsRepository };
//# sourceMappingURL=audit-logs.repository.js.map