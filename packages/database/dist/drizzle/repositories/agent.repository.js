/**
 * Agent Repository - Drizzle ORM Implementation
 * Example of migrating from Drizzle to Drizzle using the Repository Pattern
 */
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';
import { and, desc, eq, inArray, isNull, like, or, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { agentCapabilityRegistry, agentDirectoryEntries, agentMetadata, agentOnboardingEvents, agentRegistrations, agents, } from '../schema.js';
// HMAC-SHA256 Hashing for Auth Tokens (Deterministic)
function hashToken(token) {
    if (!process.env.ENCRYPTION_KEY)
        return token;
    try {
        const hmac = crypto.createHmac('sha256', process.env.ENCRYPTION_KEY);
        hmac.update(token);
        return `hmac_${hmac.digest('hex')}`;
    }
    catch (error) {
        console.error('Hashing failed:', error);
        return token;
    }
}
/**
 * Agent Repository - provides data access for Agent entities
 *
 * This repository abstracts the database access layer, allowing for
 * easy migration from Drizzle to Drizzle without changing service code.
 */
export class DrizzleAgentRepository {
    /**
     * Create a new agent
     */
    async create(data) {
        const id = data.id || `agent_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
        const [agent] = await db
            .insert(agents)
            .values({ ...data, id })
            .returning();
        return agent;
    }
    /**
     * Find agent by ID (Safe: Requires userId)
     */
    async findById(id, userId) {
        const [agent] = await db
            .select()
            .from(agents)
            .where(and(eq(agents.id, id), userId ? eq(agents.userId, userId) : undefined, isNull(agents.deletedAt)));
        return agent ?? null;
    }
    /**
     * Find agent by ID (System: internal use only, ignores userId)
     */
    async findByIdSystem(id) {
        const [agent] = await db
            .select()
            .from(agents)
            .where(and(eq(agents.id, id), isNull(agents.deletedAt)));
        return agent ?? null;
    }
    /**
     * Find agent by ID with metadata
     */
    async findByIdWithMetadata(id, userId) {
        const result = await db
            .select()
            .from(agents)
            .leftJoin(agentMetadata, eq(agents.id, agentMetadata.agentId))
            .where(and(eq(agents.id, id), eq(agents.userId, userId), isNull(agents.deletedAt)));
        if (!result[0])
            return null;
        return {
            ...result[0].agents,
            metadata: result[0].agent_metadata,
        };
    }
    /**
     * Fetch metadata rows for a batch of agents
     */
    async findMetadataByAgentIds(agentIds) {
        const ids = agentIds.filter((id) => typeof id === 'string' && id.trim().length > 0);
        if (ids.length === 0)
            return [];
        return db.select().from(agentMetadata).where(inArray(agentMetadata.agentId, ids));
    }
    /**
     * Find all agents for a user
     */
    async findByUserId(userId) {
        return db
            .select()
            .from(agents)
            .where(and(eq(agents.userId, userId), isNull(agents.deletedAt)))
            .orderBy(desc(agents.createdAt));
    }
    /**
     * Find all active agents
     */
    async findActive(userId) {
        return db
            .select()
            .from(agents)
            .where(and(eq(agents.status, 'ACTIVE'), eq(agents.userId, userId), isNull(agents.deletedAt)));
    }
    /**
     * Find all agents (with optional limit)
     */
    async findAll(userId, limit) {
        let query = db
            .select()
            .from(agents)
            .where(and(eq(agents.userId, userId), isNull(agents.deletedAt)))
            .orderBy(desc(agents.createdAt));
        if (limit) {
            // @ts-ignore
            query = query.limit(limit);
        }
        return query;
    }
    /**
     * Find all agents (System: no userId filter)
     */
    async findAllSystem(page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [data, countResult] = await Promise.all([
            db
                .select()
                .from(agents)
                .where(isNull(agents.deletedAt))
                .orderBy(desc(agents.createdAt))
                .offset(skip)
                .limit(limit),
            db
                .select({ count: sql `cast(count(*) as integer)` })
                .from(agents)
                .where(isNull(agents.deletedAt)),
        ]);
        return {
            data,
            total: countResult[0]?.count ?? 0,
        };
    }
    /**
     * Update an agent
     */
    async update(id, userIdOrData, dataArg) {
        const hasScopedUser = typeof userIdOrData === 'string';
        const userId = hasScopedUser ? userIdOrData : undefined;
        const data = (hasScopedUser ? dataArg : userIdOrData);
        const [agent] = await db
            .update(agents)
            .set({ ...data, updatedAt: new Date() })
            .where(and(eq(agents.id, id), userId ? eq(agents.userId, userId) : undefined))
            .returning();
        return agent ?? null;
    }
    /**
     * Soft delete an agent
     */
    async softDelete(id, userId) {
        const result = await db
            .update(agents)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(and(eq(agents.id, id), userId ? eq(agents.userId, userId) : undefined))
            .returning();
        return result.length > 0;
    }
    /**
     * Hard delete an agent (use with caution)
     */
    async hardDelete(id, userId) {
        const result = await db
            .delete(agents)
            .where(and(eq(agents.id, id), userId ? eq(agents.userId, userId) : undefined))
            .returning();
        return result.length > 0;
    }
    /**
     * Search agents by name or description
     */
    async search(query, userId) {
        const searchPattern = `%${query}%`;
        let whereClause = and(or(like(agents.name, searchPattern), like(agents.description, searchPattern)), isNull(agents.deletedAt));
        if (userId) {
            whereClause = and(whereClause, eq(agents.userId, userId));
        }
        return db.select().from(agents).where(whereClause).orderBy(desc(agents.createdAt)).limit(50);
    }
    /**
     * Count agents by status
     */
    async countByStatus() {
        const result = await db
            .select({
            status: agents.status,
            count: sql `cast(count(*) as integer)`,
        })
            .from(agents)
            .where(isNull(agents.deletedAt))
            .groupBy(agents.status);
        return result;
    }
    /**
     * Count total active agents across the system
     */
    async countActive() {
        const result = await db
            .select({ count: sql `cast(count(*) as integer)` })
            .from(agents)
            .where(and(eq(agents.status, 'ACTIVE'), isNull(agents.deletedAt)));
        return Number(result[0]?.count ?? 0);
    }
    /**
     * Create or update agent metadata
     */
    async upsertMetadata(agentId, data) {
        const existing = await db
            .select()
            .from(agentMetadata)
            .where(eq(agentMetadata.agentId, agentId));
        if (existing[0]) {
            const [updated] = await db
                .update(agentMetadata)
                .set(data)
                .where(eq(agentMetadata.agentId, agentId))
                .returning();
            return updated;
        }
        else {
            const [created] = await db
                .insert(agentMetadata)
                .values({ agentId, ...data })
                .returning();
            return created;
        }
    }
    /**
     * Create agent registration
     */
    async createRegistration(data) {
        // Hash auth token before storage (deterministic for lookup)
        const hashedToken = hashToken(data.authToken);
        const insertData = {
            agentId: data.agentId,
            encryptedAuthToken: hashedToken, // Using hash for lookup consistency
            registrationData: data.registrationData,
            verificationStatus: data.verificationStatus,
            onboardingStatus: data.onboardingStatus,
            onboardingProgress: data.onboardingProgress,
            heartbeatInterval: data.heartbeatInterval,
            isOnline: data.isOnline,
            metadata: data.metadata,
        };
        const [registration] = await db
            .insert(agentRegistrations)
            .values(insertData)
            .returning();
        // Return the original plain token so the caller can see it once
        return {
            ...registration,
            authToken: data.authToken,
        };
    }
    /**
     * Find registration by auth token
     */
    async findRegistrationByToken(token) {
        const hashedToken = hashToken(token);
        const [match] = await db
            .select()
            .from(agentRegistrations)
            .where(eq(agentRegistrations.encryptedAuthToken, hashedToken));
        return match ?? null;
    }
    /**
     * Find registration by ID
     */
    async findRegistrationById(id, userId) {
        // Join to check ownership if userId provided
        const [row] = await db
            .select({
            registration: agentRegistrations,
        })
            .from(agentRegistrations)
            .innerJoin(agents, eq(agentRegistrations.agentId, agents.id))
            .where(and(eq(agentRegistrations.id, id), userId ? eq(agents.userId, userId) : undefined));
        if (row?.registration) {
            return row.registration; // Returns hashed token
        }
        return null;
    }
    /**
     * Update registration heartbeat
     */
    async updateRegistrationHeartbeat(registrationId) {
        await db
            .update(agentRegistrations)
            .set({
            lastHeartbeat: new Date(),
            isOnline: true,
            updatedAt: new Date(),
        })
            .where(eq(agentRegistrations.id, registrationId));
    }
    /**
     * Create capability registry entry
     */
    async createCapability(data) {
        const [capability] = await db.insert(agentCapabilityRegistry).values(data).returning();
        return capability;
    }
    /**
     * Create onboarding event
     */
    async createOnboardingEvent(data) {
        const [event] = await db.insert(agentOnboardingEvents).values(data).returning();
        return event;
    }
    /**
     * Create directory entry
     */
    async createDirectoryEntry(data) {
        const [entry] = await db.insert(agentDirectoryEntries).values(data).returning();
        return entry;
    }
    /**
     * Find registration with related data
     */
    async findRegistrationWithDetails(registrationId, userId) {
        // First get the registration (verifying ownership)
        const registration = await this.findRegistrationById(registrationId, userId);
        if (!registration || !registration.agentId)
            return null;
        // Get the agent (we know userId matches because findRegistrationById checked it)
        const agent = await this.findById(registration.agentId, userId);
        // Get capabilities
        const capabilities = await db
            .select()
            .from(agentCapabilityRegistry)
            .where(eq(agentCapabilityRegistry.registrationId, registrationId));
        // Get recent onboarding events (last 10)
        const onboardingEvents = await db
            .select()
            .from(agentOnboardingEvents)
            .where(eq(agentOnboardingEvents.registrationId, registrationId))
            .orderBy(desc(agentOnboardingEvents.timestamp))
            .limit(10);
        return {
            ...registration,
            agent,
            capabilities,
            onboardingEvents,
        };
    }
    /**
     * Count total agents
     */
    async count() {
        const result = await db
            .select({ count: db.$count(agents) })
            .from(agents)
            .where(isNull(agents.deletedAt));
        return result[0]?.count ?? 0;
    }
    /**
     * Verify if a list of capabilities exist in the registry
     */
    async verifyCapabilities(capabilityNames) {
        if (!capabilityNames.length)
            return [];
        const results = await db
            .select({ name: agentCapabilityRegistry.capabilityName })
            .from(agentCapabilityRegistry)
            .where(inArray(agentCapabilityRegistry.capabilityName, capabilityNames));
        const existingNames = new Set(results.map((r) => r.name));
        return capabilityNames.filter((name) => !existingNames.has(name));
    }
    // Compatibility methods for legacy callers (migrated code paths)
    async findByStatus(status, userId) {
        return db
            .select()
            .from(agents)
            .where(and(eq(agents.status, status), userId ? eq(agents.userId, userId) : undefined, isNull(agents.deletedAt)))
            .orderBy(desc(agents.createdAt));
    }
    async findByNameAndUserId(name, userId) {
        const [agent] = await db
            .select()
            .from(agents)
            .where(and(eq(agents.name, name), eq(agents.userId, userId), isNull(agents.deletedAt)))
            .limit(1);
        return agent ?? null;
    }
    async findWithPagination(userId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const [data, countResult] = await Promise.all([
            db
                .select()
                .from(agents)
                .where(and(eq(agents.userId, userId), isNull(agents.deletedAt)))
                .orderBy(desc(agents.createdAt))
                .offset(offset)
                .limit(limit),
            db
                .select({ count: sql `cast(count(*) as integer)` })
                .from(agents)
                .where(and(eq(agents.userId, userId), isNull(agents.deletedAt))),
        ]);
        return { data, total: countResult[0]?.count ?? 0 };
    }
    async findByCapability(capability, userId) {
        const searchPattern = `%${capability}%`;
        return db
            .select()
            .from(agents)
            .where(and(eq(agents.userId, userId), like(agents.capabilities, searchPattern), isNull(agents.deletedAt)))
            .orderBy(desc(agents.createdAt));
    }
    async findByStatusAndUserId(status, userId) {
        return this.findByStatus(status, userId);
    }
    async updateStatus(id, status, userId) {
        return this.update(id, userId ?? { status: status }, userId ? { status: status } : undefined);
    }
    async searchAgents(userId, filters = {}) {
        let whereClause = and(eq(agents.userId, userId), isNull(agents.deletedAt));
        if (filters.name) {
            whereClause = and(whereClause, like(agents.name, `%${filters.name}%`));
        }
        if (filters.type) {
            whereClause = and(whereClause, eq(agents.type, filters.type));
        }
        if (filters.status) {
            whereClause = and(whereClause, eq(agents.status, filters.status));
        }
        if (filters.capability) {
            whereClause = and(whereClause, like(agents.capabilities, `%${filters.capability}%`));
        }
        return db.select().from(agents).where(whereClause).orderBy(desc(agents.createdAt));
    }
}
// Export singleton instance
export const drizzleAgentRepository = new DrizzleAgentRepository();
//# sourceMappingURL=agent.repository.js.map