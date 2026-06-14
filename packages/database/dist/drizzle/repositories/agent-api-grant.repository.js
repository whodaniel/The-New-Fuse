import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { agentApiGrantUsage, agentApiGrants } from '../schema.js';
export class DrizzleAgentApiGrantRepository {
    async listByUser(userId) {
        return db
            .select()
            .from(agentApiGrants)
            .where(eq(agentApiGrants.userId, userId))
            .orderBy(desc(agentApiGrants.createdAt));
    }
    async findByIdForUser(id, userId) {
        const [row] = await db
            .select()
            .from(agentApiGrants)
            .where(and(eq(agentApiGrants.id, id), eq(agentApiGrants.userId, userId)));
        return row ?? null;
    }
    async findById(id) {
        const [row] = await db.select().from(agentApiGrants).where(eq(agentApiGrants.id, id));
        return row ?? null;
    }
    async create(data) {
        const [row] = await db.insert(agentApiGrants).values(data).returning();
        return row;
    }
    async revoke(id, userId) {
        const [row] = await db
            .update(agentApiGrants)
            .set({ revoked: true, updatedAt: new Date() })
            .where(and(eq(agentApiGrants.id, id), eq(agentApiGrants.userId, userId)))
            .returning();
        return row ?? null;
    }
    async rotateTokenVersion(id, userId) {
        const current = await this.findByIdForUser(id, userId);
        if (!current)
            return null;
        const [row] = await db
            .update(agentApiGrants)
            .set({ tokenVersion: current.tokenVersion + 1, updatedAt: new Date() })
            .where(and(eq(agentApiGrants.id, id), eq(agentApiGrants.userId, userId)))
            .returning();
        return row ?? null;
    }
    async isGrantActive(grantId, expectedTokenVersion) {
        const [row] = await db
            .select()
            .from(agentApiGrants)
            .where(and(eq(agentApiGrants.id, grantId), eq(agentApiGrants.revoked, false), eq(agentApiGrants.tokenVersion, expectedTokenVersion), gte(agentApiGrants.expiresAt, new Date())));
        return row ?? null;
    }
    async logUsage(data) {
        const [row] = await db.insert(agentApiGrantUsage).values(data).returning();
        return row;
    }
    async getUsageSummary(grantId) {
        const oneMinuteAgo = new Date(Date.now() - 60_000);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60_000);
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const [rpm] = await db
            .select({ value: sql `count(*)` })
            .from(agentApiGrantUsage)
            .where(and(eq(agentApiGrantUsage.grantId, grantId), gte(agentApiGrantUsage.createdAt, oneMinuteAgo)));
        const [dailyTokens] = await db
            .select({ value: sql `coalesce(sum(${agentApiGrantUsage.totalTokens}), 0)` })
            .from(agentApiGrantUsage)
            .where(and(eq(agentApiGrantUsage.grantId, grantId), gte(agentApiGrantUsage.createdAt, oneDayAgo)));
        const [monthlyCostCents] = await db
            .select({ value: sql `coalesce(sum(${agentApiGrantUsage.estimatedCostCents}), 0)` })
            .from(agentApiGrantUsage)
            .where(and(eq(agentApiGrantUsage.grantId, grantId), gte(agentApiGrantUsage.createdAt, monthStart)));
        return {
            requestsLastMinute: Number(rpm?.value ?? 0),
            dailyTokens: Number(dailyTokens?.value ?? 0),
            monthlyCostCents: Number(monthlyCostCents?.value ?? 0),
        };
    }
}
export const drizzleAgentApiGrantRepository = new DrizzleAgentApiGrantRepository();
//# sourceMappingURL=agent-api-grant.repository.js.map