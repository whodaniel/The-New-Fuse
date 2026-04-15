import { and, desc, gte, lte, sql } from 'drizzle-orm';
import { db } from '../client';
import { apiLogs } from '../schema/api-logs';

export class DrizzleApiLogsRepository {
  async logRequest(data: typeof apiLogs.$inferInsert) {
    return db.insert(apiLogs).values(data).returning();
  }

  async getRecentLogs(limit: number = 50) {
    return db.select().from(apiLogs).orderBy(desc(apiLogs.createdAt)).limit(limit);
  }

  async getStats(startDate?: Date, endDate?: Date) {
    const conditions = [];
    if (startDate) conditions.push(gte(apiLogs.createdAt, startDate));
    if (endDate) conditions.push(lte(apiLogs.createdAt, endDate));

    const query = db
      .select({
        count: sql<number>`count(*)`,
        avgDuration: sql<number>`avg(${apiLogs.duration})`,
        errorCount: sql<number>`count(*) filter (where ${apiLogs.statusCode} >= 400)`,
      })
      .from(apiLogs);

    if (conditions.length) {
      query.where(and(...conditions));
    }

    return query;
  }

  async getStatusCodeDistribution(startDate?: Date, endDate?: Date) {
    const conditions = [];
    if (startDate) conditions.push(gte(apiLogs.createdAt, startDate));
    if (endDate) conditions.push(lte(apiLogs.createdAt, endDate));

    const query = db
      .select({
        status: apiLogs.statusCode,
        count: sql<number>`count(*)`,
      })
      .from(apiLogs)
      .groupBy(apiLogs.statusCode);

    if (conditions.length) {
      query.where(and(...conditions));
    }

    return query;
  }

  async getMethodDistribution(startDate?: Date, endDate?: Date) {
    const conditions = [];
    if (startDate) conditions.push(gte(apiLogs.createdAt, startDate));
    if (endDate) conditions.push(lte(apiLogs.createdAt, endDate));

    const query = db
      .select({
        method: apiLogs.method,
        count: sql<number>`count(*)`,
      })
      .from(apiLogs)
      .groupBy(apiLogs.method);

    if (conditions.length) {
      query.where(and(...conditions));
    }
    return query;
  }

  async getTopEndpoints(limit: number = 5, startDate?: Date, endDate?: Date) {
    const conditions = [];
    if (startDate) conditions.push(gte(apiLogs.createdAt, startDate));
    if (endDate) conditions.push(lte(apiLogs.createdAt, endDate));

    const query = db
      .select({
        endpoint: apiLogs.path,
        count: sql<number>`count(*)`,
        avgDuration: sql<number>`avg(${apiLogs.duration})`,
        errorCount: sql<number>`count(*) filter (where ${apiLogs.statusCode} >= 400)`,
      })
      .from(apiLogs)
      .groupBy(apiLogs.path)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    if (conditions.length) {
      query.where(and(...conditions));
    }
    return query;
  }

  // Group by hour for last 24h, etc. Simplification: Group by date_trunc('hour', created_at)
  async getTimeSeriesData(startDate: Date, endDate: Date) {
    // Note: This SQL might be specific to Postgres
    const query = db
      .select({
        time: sql<string>`date_trunc('hour', ${apiLogs.createdAt})`,
        requests: sql<number>`count(*)`,
        errors: sql<number>`count(*) filter (where ${apiLogs.statusCode} >= 400)`,
        avgDuration: sql<number>`avg(${apiLogs.duration})`,
      })
      .from(apiLogs)
      .where(and(gte(apiLogs.createdAt, startDate), lte(apiLogs.createdAt, endDate)))
      .groupBy(sql`date_trunc('hour', ${apiLogs.createdAt})`)
      .orderBy(sql`date_trunc('hour', ${apiLogs.createdAt})`);

    return query;
  }
}

export const drizzleApiLogsRepository = new DrizzleApiLogsRepository();
