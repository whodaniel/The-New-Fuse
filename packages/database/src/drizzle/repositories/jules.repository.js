"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleJulesRepository = exports.DrizzleJulesRepository = void 0;
/**
 * Jules Repository - Drizzle ORM Implementation
 * Provides data access for Jules integration (configs, sessions, usage logs)
 */
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
/**
 * Jules Repository - provides data access for Jules-related entities
 */
class DrizzleJulesRepository {
    // =============================================================================
    // JULES CONFIGS
    // =============================================================================
    /**
     * Create a new Jules configuration
     */
    async createConfig(data) {
        const [config] = await client_1.db.insert(schema_1.julesConfigs).values(data).returning();
        return config;
    }
    /**
     * Find Jules config by user ID
     */
    async findConfigByUserId(userId) {
        const [config] = await client_1.db
            .select()
            .from(schema_1.julesConfigs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.julesConfigs.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.julesConfigs.deletedAt)));
        return config ?? null;
    }
    /**
     * Update Jules configuration
     */
    async updateConfig(id, data) {
        const [updated] = await client_1.db
            .update(schema_1.julesConfigs)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.julesConfigs.id, id))
            .returning();
        return updated ?? null;
    }
    // =============================================================================
    // JULES SESSIONS
    // =============================================================================
    /**
     * Create a new Jules session
     */
    async createSession(data) {
        const [session] = await client_1.db.insert(schema_1.julesSessions).values(data).returning();
        return session;
    }
    /**
     * Find Jules session by Jules session ID
     */
    async findSessionByJulesSessionId(julesSessionId) {
        const [session] = await client_1.db
            .select()
            .from(schema_1.julesSessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.julesSessions.julesSessionId, julesSessionId), (0, drizzle_orm_1.isNull)(schema_1.julesSessions.deletedAt)));
        return session ?? null;
    }
    /**
     * Find Jules session by task ID
     */
    async findSessionByTaskId(taskId) {
        const [session] = await client_1.db
            .select()
            .from(schema_1.julesSessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.julesSessions.taskId, taskId), (0, drizzle_orm_1.isNull)(schema_1.julesSessions.deletedAt)));
        return session ?? null;
    }
    /**
     * Find all sessions for a user
     */
    async findSessionsByUserId(userId) {
        return client_1.db
            .select()
            .from(schema_1.julesSessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.julesSessions.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.julesSessions.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.julesSessions.createdAt));
    }
    /**
     * Update Jules session
     */
    async updateSession(id, data) {
        const [updated] = await client_1.db
            .update(schema_1.julesSessions)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.julesSessions.id, id))
            .returning();
        return updated ?? null;
    }
    /**
     * Update Jules session by Jules session ID
     */
    async updateSessionByJulesSessionId(julesSessionId, data) {
        const [updated] = await client_1.db
            .update(schema_1.julesSessions)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.julesSessions.julesSessionId, julesSessionId))
            .returning();
        return updated ?? null;
    }
    // =============================================================================
    // JULES USAGE LOGS
    // =============================================================================
    /**
     * Create a new usage log entry
     */
    async createUsageLog(data) {
        const [log] = await client_1.db.insert(schema_1.julesUsageLogs).values(data).returning();
        return log;
    }
    /**
     * Find usage logs for a session
     */
    async findUsageLogsBySessionId(sessionId) {
        return client_1.db
            .select()
            .from(schema_1.julesUsageLogs)
            .where((0, drizzle_orm_1.eq)(schema_1.julesUsageLogs.sessionId, sessionId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.julesUsageLogs.createdAt));
    }
    /**
     * Find usage logs for a user
     */
    async findUsageLogsByUserId(userId) {
        return client_1.db
            .select()
            .from(schema_1.julesUsageLogs)
            .where((0, drizzle_orm_1.eq)(schema_1.julesUsageLogs.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.julesUsageLogs.createdAt));
    }
    /**
     * Update usage log
     */
    async updateUsageLog(id, data) {
        const [updated] = await client_1.db
            .update(schema_1.julesUsageLogs)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.julesUsageLogs.id, id))
            .returning();
        return updated ?? null;
    }
}
exports.DrizzleJulesRepository = DrizzleJulesRepository;
// Singleton instance
exports.drizzleJulesRepository = new DrizzleJulesRepository();
//# sourceMappingURL=jules.repository.js.map