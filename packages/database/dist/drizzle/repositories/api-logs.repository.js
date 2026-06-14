import { and, desc, gte, lte, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { apiLogs } from '../schema/api-logs.js';
export class DrizzleApiLogsRepository {
    async logRequest(data) {
        return db.insert(apiLogs).values(data).returning();
    }
    async getRecentLogs(limit = 50) {
        return db.select().from(apiLogs).orderBy(desc(apiLogs.createdAt)).limit(limit);
    }
    async getStats(startDate, endDate) {
        const conditions = [];
        if (startDate)
            conditions.push(gte(apiLogs.createdAt, startDate));
        if (endDate)
            conditions.push(lte(apiLogs.createdAt, endDate));
        const query = db
            .select({
            count: sql `count(*)`,
            avgDuration: sql `avg(${apiLogs.duration})`,
            errorCount: sql `count(*) filter (where ${apiLogs.statusCode} >= 400)`,
        })
            .from(apiLogs);
        if (conditions.length) {
            query.where(and(...conditions));
        }
        return query;
    }
    async getStatusCodeDistribution(startDate, endDate) {
        const conditions = [];
        if (startDate)
            conditions.push(gte(apiLogs.createdAt, startDate));
        if (endDate)
            conditions.push(lte(apiLogs.createdAt, endDate));
        const query = db
            .select({
            status: apiLogs.statusCode,
            count: sql `count(*)`,
        })
            .from(apiLogs)
            .groupBy(apiLogs.statusCode);
        if (conditions.length) {
            query.where(and(...conditions));
        }
        return query;
    }
    async getMethodDistribution(startDate, endDate) {
        const conditions = [];
        if (startDate)
            conditions.push(gte(apiLogs.createdAt, startDate));
        if (endDate)
            conditions.push(lte(apiLogs.createdAt, endDate));
        const query = db
            .select({
            method: apiLogs.method,
            count: sql `count(*)`,
        })
            .from(apiLogs)
            .groupBy(apiLogs.method);
        if (conditions.length) {
            query.where(and(...conditions));
        }
        return query;
    }
    async getTopEndpoints(limit = 5, startDate, endDate) {
        const conditions = [];
        if (startDate)
            conditions.push(gte(apiLogs.createdAt, startDate));
        if (endDate)
            conditions.push(lte(apiLogs.createdAt, endDate));
        const query = db
            .select({
            endpoint: apiLogs.path,
            count: sql `count(*)`,
            avgDuration: sql `avg(${apiLogs.duration})`,
            errorCount: sql `count(*) filter (where ${apiLogs.statusCode} >= 400)`,
        })
            .from(apiLogs)
            .groupBy(apiLogs.path)
            .orderBy(desc(sql `count(*)`))
            .limit(limit);
        if (conditions.length) {
            query.where(and(...conditions));
        }
        return query;
    }
    // Group by hour for last 24h, etc. Simplification: Group by date_trunc('hour', created_at)
    async getTimeSeriesData(startDate, endDate) {
        // Note: This SQL might be specific to Postgres
        const query = db
            .select({
            time: sql `date_trunc('hour', ${apiLogs.createdAt})`,
            requests: sql `count(*)`,
            errors: sql `count(*) filter (where ${apiLogs.statusCode} >= 400)`,
            avgDuration: sql `avg(${apiLogs.duration})`,
        })
            .from(apiLogs)
            .where(and(gte(apiLogs.createdAt, startDate), lte(apiLogs.createdAt, endDate)))
            .groupBy(sql `date_trunc('hour', ${apiLogs.createdAt})`)
            .orderBy(sql `date_trunc('hour', ${apiLogs.createdAt})`);
        return query;
    }
}
export const drizzleApiLogsRepository = new DrizzleApiLogsRepository();
//# sourceMappingURL=api-logs.repository.js.map