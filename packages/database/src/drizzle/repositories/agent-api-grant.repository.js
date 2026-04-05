"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleAgentApiGrantRepository = exports.DrizzleAgentApiGrantRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
class DrizzleAgentApiGrantRepository {
    async listByUser(userId) {
        return client_1.db
            .select()
            .from(schema_1.agentApiGrants)
            .where((0, drizzle_orm_1.eq)(schema_1.agentApiGrants.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.agentApiGrants.createdAt));
    }
    async findByIdForUser(id, userId) {
        const [row] = await client_1.db
            .select()
            .from(schema_1.agentApiGrants)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agentApiGrants.id, id), (0, drizzle_orm_1.eq)(schema_1.agentApiGrants.userId, userId)));
        return row ?? null;
    }
    async findById(id) {
        const [row] = await client_1.db.select().from(schema_1.agentApiGrants).where((0, drizzle_orm_1.eq)(schema_1.agentApiGrants.id, id));
        return row ?? null;
    }
    async create(data) {
        const [row] = await client_1.db.insert(schema_1.agentApiGrants).values(data).returning();
        return row;
    }
    async revoke(id, userId) {
        const [row] = await client_1.db
            .update(schema_1.agentApiGrants)
            .set({ revoked: true, updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agentApiGrants.id, id), (0, drizzle_orm_1.eq)(schema_1.agentApiGrants.userId, userId)))
            .returning();
        return row ?? null;
    }
    async rotateTokenVersion(id, userId) {
        const current = await this.findByIdForUser(id, userId);
        if (!current)
            return null;
        const [row] = await client_1.db
            .update(schema_1.agentApiGrants)
            .set({ tokenVersion: current.tokenVersion + 1, updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agentApiGrants.id, id), (0, drizzle_orm_1.eq)(schema_1.agentApiGrants.userId, userId)))
            .returning();
        return row ?? null;
    }
    async isGrantActive(grantId, expectedTokenVersion) {
        const [row] = await client_1.db
            .select()
            .from(schema_1.agentApiGrants)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agentApiGrants.id, grantId), (0, drizzle_orm_1.eq)(schema_1.agentApiGrants.revoked, false), (0, drizzle_orm_1.eq)(schema_1.agentApiGrants.tokenVersion, expectedTokenVersion), (0, drizzle_orm_1.gte)(schema_1.agentApiGrants.expiresAt, new Date())));
        return row ?? null;
    }
    async logUsage(data) {
        const [row] = await client_1.db.insert(schema_1.agentApiGrantUsage).values(data).returning();
        return row;
    }
    async getUsageSummary(grantId) {
        const oneMinuteAgo = new Date(Date.now() - 60_000);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60_000);
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const [rpm] = await client_1.db
            .select({ value: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.agentApiGrantUsage)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agentApiGrantUsage.grantId, grantId), (0, drizzle_orm_1.gte)(schema_1.agentApiGrantUsage.createdAt, oneMinuteAgo)));
        const [dailyTokens] = await client_1.db
            .select({ value: (0, drizzle_orm_1.sql) `coalesce(sum(${schema_1.agentApiGrantUsage.totalTokens}), 0)` })
            .from(schema_1.agentApiGrantUsage)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agentApiGrantUsage.grantId, grantId), (0, drizzle_orm_1.gte)(schema_1.agentApiGrantUsage.createdAt, oneDayAgo)));
        const [monthlyCostCents] = await client_1.db
            .select({ value: (0, drizzle_orm_1.sql) `coalesce(sum(${schema_1.agentApiGrantUsage.estimatedCostCents}), 0)` })
            .from(schema_1.agentApiGrantUsage)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agentApiGrantUsage.grantId, grantId), (0, drizzle_orm_1.gte)(schema_1.agentApiGrantUsage.createdAt, monthStart)));
        return {
            requestsLastMinute: Number(rpm?.value ?? 0),
            dailyTokens: Number(dailyTokens?.value ?? 0),
            monthlyCostCents: Number(monthlyCostCents?.value ?? 0),
        };
    }
}
exports.DrizzleAgentApiGrantRepository = DrizzleAgentApiGrantRepository;
exports.drizzleAgentApiGrantRepository = new DrizzleAgentApiGrantRepository();
//# sourceMappingURL=agent-api-grant.repository.js.map