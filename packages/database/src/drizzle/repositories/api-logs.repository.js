"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleApiLogsRepository = exports.DrizzleApiLogsRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const api_logs_1 = require("../schema/api-logs");
class DrizzleApiLogsRepository {
    async logRequest(data) {
        return client_1.db.insert(api_logs_1.apiLogs).values(data).returning();
    }
    async getRecentLogs(limit = 50) {
        return client_1.db.select().from(api_logs_1.apiLogs).orderBy((0, drizzle_orm_1.desc)(api_logs_1.apiLogs.createdAt)).limit(limit);
    }
    async getStats(startDate, endDate) {
        const conditions = [];
        if (startDate)
            conditions.push((0, drizzle_orm_1.gte)(api_logs_1.apiLogs.createdAt, startDate));
        if (endDate)
            conditions.push((0, drizzle_orm_1.lte)(api_logs_1.apiLogs.createdAt, endDate));
        const query = client_1.db
            .select({
            count: (0, drizzle_orm_1.sql) `count(*)`,
            avgDuration: (0, drizzle_orm_1.sql) `avg(${api_logs_1.apiLogs.duration})`,
            errorCount: (0, drizzle_orm_1.sql) `count(*) filter (where ${api_logs_1.apiLogs.statusCode} >= 400)`,
        })
            .from(api_logs_1.apiLogs);
        if (conditions.length) {
            query.where((0, drizzle_orm_1.and)(...conditions));
        }
        return query;
    }
    async getStatusCodeDistribution(startDate, endDate) {
        const conditions = [];
        if (startDate)
            conditions.push((0, drizzle_orm_1.gte)(api_logs_1.apiLogs.createdAt, startDate));
        if (endDate)
            conditions.push((0, drizzle_orm_1.lte)(api_logs_1.apiLogs.createdAt, endDate));
        const query = client_1.db
            .select({
            status: api_logs_1.apiLogs.statusCode,
            count: (0, drizzle_orm_1.sql) `count(*)`,
        })
            .from(api_logs_1.apiLogs)
            .groupBy(api_logs_1.apiLogs.statusCode);
        if (conditions.length) {
            query.where((0, drizzle_orm_1.and)(...conditions));
        }
        return query;
    }
    async getMethodDistribution(startDate, endDate) {
        const conditions = [];
        if (startDate)
            conditions.push((0, drizzle_orm_1.gte)(api_logs_1.apiLogs.createdAt, startDate));
        if (endDate)
            conditions.push((0, drizzle_orm_1.lte)(api_logs_1.apiLogs.createdAt, endDate));
        const query = client_1.db
            .select({
            method: api_logs_1.apiLogs.method,
            count: (0, drizzle_orm_1.sql) `count(*)`,
        })
            .from(api_logs_1.apiLogs)
            .groupBy(api_logs_1.apiLogs.method);
        if (conditions.length) {
            query.where((0, drizzle_orm_1.and)(...conditions));
        }
        return query;
    }
    async getTopEndpoints(limit = 5, startDate, endDate) {
        const conditions = [];
        if (startDate)
            conditions.push((0, drizzle_orm_1.gte)(api_logs_1.apiLogs.createdAt, startDate));
        if (endDate)
            conditions.push((0, drizzle_orm_1.lte)(api_logs_1.apiLogs.createdAt, endDate));
        const query = client_1.db
            .select({
            endpoint: api_logs_1.apiLogs.path,
            count: (0, drizzle_orm_1.sql) `count(*)`,
            avgDuration: (0, drizzle_orm_1.sql) `avg(${api_logs_1.apiLogs.duration})`,
            errorCount: (0, drizzle_orm_1.sql) `count(*) filter (where ${api_logs_1.apiLogs.statusCode} >= 400)`,
        })
            .from(api_logs_1.apiLogs)
            .groupBy(api_logs_1.apiLogs.path)
            .orderBy((0, drizzle_orm_1.desc)((0, drizzle_orm_1.sql) `count(*)`))
            .limit(limit);
        if (conditions.length) {
            query.where((0, drizzle_orm_1.and)(...conditions));
        }
        return query;
    }
    // Group by hour for last 24h, etc. Simplification: Group by date_trunc('hour', created_at)
    async getTimeSeriesData(startDate, endDate) {
        // Note: This SQL might be specific to Postgres
        const query = client_1.db
            .select({
            time: (0, drizzle_orm_1.sql) `date_trunc('hour', ${api_logs_1.apiLogs.createdAt})`,
            requests: (0, drizzle_orm_1.sql) `count(*)`,
            errors: (0, drizzle_orm_1.sql) `count(*) filter (where ${api_logs_1.apiLogs.statusCode} >= 400)`,
            avgDuration: (0, drizzle_orm_1.sql) `avg(${api_logs_1.apiLogs.duration})`,
        })
            .from(api_logs_1.apiLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(api_logs_1.apiLogs.createdAt, startDate), (0, drizzle_orm_1.lte)(api_logs_1.apiLogs.createdAt, endDate)))
            .groupBy((0, drizzle_orm_1.sql) `date_trunc('hour', ${api_logs_1.apiLogs.createdAt})`)
            .orderBy((0, drizzle_orm_1.sql) `date_trunc('hour', ${api_logs_1.apiLogs.createdAt})`);
        return query;
    }
}
exports.DrizzleApiLogsRepository = DrizzleApiLogsRepository;
exports.drizzleApiLogsRepository = new DrizzleApiLogsRepository();
//# sourceMappingURL=api-logs.repository.js.map