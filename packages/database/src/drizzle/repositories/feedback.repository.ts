/**
 * Feedback Repository - Drizzle ORM Implementation
 * Provides data access for Feedback entities
 */
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { feedback } from '../schema.js';

export class DrizzleFeedbackRepository {
  async create(data: {
    type?: string;
    message: string;
    source?: string;
    contextUrl?: string;
    priority?: string;
    reporterName?: string;
    reporterEmail?: string;
  }): Promise<{
    id: string;
    type: string;
    message: string;
    source: string;
    priority: string;
    status: string;
    createdAt: Date;
  }> {
    const [record] = await db
      .insert(feedback)
      .values({
        type: data.type || 'other',
        message: data.message,
        source: data.source || 'beta',
        contextUrl: data.contextUrl,
        priority: data.priority || 'medium',
        status: 'new',
        reporterName: data.reporterName,
        reporterEmail: data.reporterEmail,
      })
      .returning();
    return record as any;
  }

  async findAll(query?: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const conditions = [];
    if (query?.status) conditions.push(eq(feedback.status, query.status));
    if (query?.type) conditions.push(eq(feedback.type, query.type));

    let q: any = db.select().from(feedback).orderBy(desc(feedback.createdAt));
    if (conditions.length > 0) {
      q = q.where(and(...conditions));
    }
    if (query?.limit) {
      q = q.limit(query.limit);
    }
    return q.execute();
  }

  async findById(id: string): Promise<any | null> {
    const [record] = await db.select().from(feedback).where(eq(feedback.id, id));
    return record || null;
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const totalResult = await db.select({ count: sql<number>`count(*)::int` }).from(feedback);
    const total = totalResult[0]?.count || 0;

    const statusResult = await db
      .select({ status: feedback.status, count: sql<number>`count(*)::int` })
      .from(feedback)
      .groupBy(feedback.status);
    const byStatus: Record<string, number> = {};
    for (const r of statusResult) {
      byStatus[r.status || 'unknown'] = Number(r.count);
    }

    const typeResult = await db
      .select({ type: feedback.type, count: sql<number>`count(*)::int` })
      .from(feedback)
      .groupBy(feedback.type);
    const byType: Record<string, number> = {};
    for (const r of typeResult) {
      byType[r.type || 'unknown'] = Number(r.count);
    }

    const priorityResult = await db
      .select({ priority: feedback.priority, count: sql<number>`count(*)::int` })
      .from(feedback)
      .groupBy(feedback.priority);
    const byPriority: Record<string, number> = {};
    for (const r of priorityResult) {
      byPriority[r.priority || 'unknown'] = Number(r.count);
    }

    return { total, byStatus, byType, byPriority };
  }
}

export const drizzleFeedbackRepository = new DrizzleFeedbackRepository();
