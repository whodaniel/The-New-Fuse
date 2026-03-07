/**
 * Audit Logs Repository - Drizzle ORM Analysis
 *
 * This repository provides data access for Audit Log entities using Drizzle ORM.
 * Adapted for NestJS Dependency Injection.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  desc,
  DRIZZLE_CLIENT,
  type DrizzleClient,
  drizzleSchema,
  eq,
  gte,
  lte,
  sql,
} from '@the-new-fuse/database';

// Destructure the schema tables we need
const { auditLogs } = drizzleSchema;

// Types from database package
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

@Injectable()
export class AuditLogsRepository {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  /**
   * Create a new audit log entry
   */
  async create(data: AuditLogEntry): Promise<AuditLogEntry> {
    const [log] = await this.db.insert(auditLogs).values(data).returning();
    return log;
  }

  /**
   * Find audit log by ID
   */
  async findById(id: string): Promise<AuditLogEntry | null> {
    const [log] = await this.db.select().from(auditLogs).where(eq(auditLogs.id, id));
    return log ?? null;
  }

  /**
   * Find all audit logs with optional filtering and pagination
   */
  async findAll(query: AuditLogQuery = {}): Promise<AuditLogEntry[]> {
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
      dbQuery = dbQuery.where(and(...conditions)) as any;
    }

    if (query.limit !== undefined) {
      dbQuery = dbQuery.limit(query.limit) as any;
    }

    if (query.offset !== undefined) {
      dbQuery = dbQuery.offset(query.offset) as any;
    }

    return dbQuery;
  }

  /**
   * Get total count of audit logs with optional filters
   */
  async count(query: AuditLogQuery = {}): Promise<number> {
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

    let dbQuery = this.db.select({ count: sql<number>`cast(count(*) as integer)` }).from(auditLogs);

    if (conditions.length > 0) {
      dbQuery = dbQuery.where(and(...conditions)) as any;
    }

    const result = await dbQuery;
    return Number(result[0]?.count ?? 0);
  }

  /**
   * Get recent audit logs for a specific user
   */
  async findByUserId(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
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
  async findByResource(
    resourceType: string,
    resourceId: string,
    limit: number = 50
  ): Promise<AuditLogEntry[]> {
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
  async findByAction(action: string, limit: number = 100): Promise<AuditLogEntry[]> {
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
  async getStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total: number;
    byAction: Record<string, number>;
    byStatus: Record<string, number>;
    byResourceType: Record<string, number>;
  }> {
    const conditions = [];

    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, endDate));
    }

    let baseQuery = this.db.select().from(auditLogs);

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions)) as any;
    }

    const logs = await baseQuery;

    const stats = {
      total: logs.length,
      byAction: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byResourceType: {} as Record<string, number>,
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
}
