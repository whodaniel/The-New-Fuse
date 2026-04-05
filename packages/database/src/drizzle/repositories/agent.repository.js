"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleAgentRepository = exports.DrizzleAgentRepository = void 0;
/**
 * Agent Repository - Drizzle ORM Implementation
 * Example of migrating from Drizzle to Drizzle using the Repository Pattern
 */
const crypto = __importStar(require("crypto"));
const crypto_1 = require("crypto");
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
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
class DrizzleAgentRepository {
    /**
     * Create a new agent
     */
    async create(data) {
        const id = data.id || `agent_${(0, crypto_1.randomUUID)().replace(/-/g, '').slice(0, 16)}`;
        const [agent] = await client_1.db
            .insert(schema_1.agents)
            .values({ ...data, id })
            .returning();
        return agent;
    }
    /**
     * Find agent by ID (Safe: Requires userId)
     */
    async findById(id, userId) {
        const [agent] = await client_1.db
            .select()
            .from(schema_1.agents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agents.id, id), userId ? (0, drizzle_orm_1.eq)(schema_1.agents.userId, userId) : undefined, (0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt)));
        return agent ?? null;
    }
    /**
     * Find agent by ID (System: internal use only, ignores userId)
     */
    async findByIdSystem(id) {
        const [agent] = await client_1.db
            .select()
            .from(schema_1.agents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agents.id, id), (0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt)));
        return agent ?? null;
    }
    /**
     * Find agent by ID with metadata
     */
    async findByIdWithMetadata(id, userId) {
        const result = await client_1.db
            .select()
            .from(schema_1.agents)
            .leftJoin(schema_1.agentMetadata, (0, drizzle_orm_1.eq)(schema_1.agents.id, schema_1.agentMetadata.agentId))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agents.id, id), (0, drizzle_orm_1.eq)(schema_1.agents.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt)));
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
        return client_1.db.select().from(schema_1.agentMetadata).where((0, drizzle_orm_1.inArray)(schema_1.agentMetadata.agentId, ids));
    }
    /**
     * Find all agents for a user
     */
    async findByUserId(userId) {
        return client_1.db
            .select()
            .from(schema_1.agents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agents.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.agents.createdAt));
    }
    /**
     * Find all active agents
     */
    async findActive(userId) {
        return client_1.db
            .select()
            .from(schema_1.agents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agents.status, 'ACTIVE'), (0, drizzle_orm_1.eq)(schema_1.agents.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt)));
    }
    /**
     * Find all agents (with optional limit)
     */
    async findAll(userId, limit) {
        let query = client_1.db
            .select()
            .from(schema_1.agents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agents.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.agents.createdAt));
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
            client_1.db
                .select()
                .from(schema_1.agents)
                .where((0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.agents.createdAt))
                .offset(skip)
                .limit(limit),
            client_1.db
                .select({ count: (0, drizzle_orm_1.sql) `cast(count(*) as integer)` })
                .from(schema_1.agents)
                .where((0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt)),
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
        const [agent] = await client_1.db
            .update(schema_1.agents)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agents.id, id), userId ? (0, drizzle_orm_1.eq)(schema_1.agents.userId, userId) : undefined))
            .returning();
        return agent ?? null;
    }
    /**
     * Soft delete an agent
     */
    async softDelete(id, userId) {
        const result = await client_1.db
            .update(schema_1.agents)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agents.id, id), userId ? (0, drizzle_orm_1.eq)(schema_1.agents.userId, userId) : undefined))
            .returning();
        return result.length > 0;
    }
    /**
     * Hard delete an agent (use with caution)
     */
    async hardDelete(id, userId) {
        const result = await client_1.db
            .delete(schema_1.agents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agents.id, id), userId ? (0, drizzle_orm_1.eq)(schema_1.agents.userId, userId) : undefined))
            .returning();
        return result.length > 0;
    }
    /**
     * Search agents by name or description
     */
    async search(query, userId) {
        const searchPattern = `%${query}%`;
        let whereClause = (0, drizzle_orm_1.and)((0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema_1.agents.name, searchPattern), (0, drizzle_orm_1.like)(schema_1.agents.description, searchPattern)), (0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt));
        if (userId) {
            whereClause = (0, drizzle_orm_1.and)(whereClause, (0, drizzle_orm_1.eq)(schema_1.agents.userId, userId));
        }
        return client_1.db.select().from(schema_1.agents).where(whereClause).orderBy((0, drizzle_orm_1.desc)(schema_1.agents.createdAt)).limit(50);
    }
    /**
     * Count agents by status
     */
    async countByStatus() {
        const result = await client_1.db
            .select({
            status: schema_1.agents.status,
            count: (0, drizzle_orm_1.sql) `cast(count(*) as integer)`,
        })
            .from(schema_1.agents)
            .where((0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt))
            .groupBy(schema_1.agents.status);
        return result;
    }
    /**
     * Count total active agents across the system
     */
    async countActive() {
        const result = await client_1.db
            .select({ count: (0, drizzle_orm_1.sql) `cast(count(*) as integer)` })
            .from(schema_1.agents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agents.status, 'ACTIVE'), (0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt)));
        return Number(result[0]?.count ?? 0);
    }
    /**
     * Create or update agent metadata
     */
    async upsertMetadata(agentId, data) {
        const existing = await client_1.db
            .select()
            .from(schema_1.agentMetadata)
            .where((0, drizzle_orm_1.eq)(schema_1.agentMetadata.agentId, agentId));
        if (existing[0]) {
            const [updated] = await client_1.db
                .update(schema_1.agentMetadata)
                .set(data)
                .where((0, drizzle_orm_1.eq)(schema_1.agentMetadata.agentId, agentId))
                .returning();
            return updated;
        }
        else {
            const [created] = await client_1.db
                .insert(schema_1.agentMetadata)
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
        const [registration] = await client_1.db
            .insert(schema_1.agentRegistrations)
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
        const [match] = await client_1.db
            .select()
            .from(schema_1.agentRegistrations)
            .where((0, drizzle_orm_1.eq)(schema_1.agentRegistrations.encryptedAuthToken, hashedToken));
        return match ?? null;
    }
    /**
     * Find registration by ID
     */
    async findRegistrationById(id, userId) {
        // Join to check ownership if userId provided
        const [row] = await client_1.db
            .select({
            registration: schema_1.agentRegistrations,
        })
            .from(schema_1.agentRegistrations)
            .innerJoin(schema_1.agents, (0, drizzle_orm_1.eq)(schema_1.agentRegistrations.agentId, schema_1.agents.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agentRegistrations.id, id), userId ? (0, drizzle_orm_1.eq)(schema_1.agents.userId, userId) : undefined));
        if (row?.registration) {
            return row.registration; // Returns hashed token
        }
        return null;
    }
    /**
     * Update registration heartbeat
     */
    async updateRegistrationHeartbeat(registrationId) {
        await client_1.db
            .update(schema_1.agentRegistrations)
            .set({
            lastHeartbeat: new Date(),
            isOnline: true,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.agentRegistrations.id, registrationId));
    }
    /**
     * Create capability registry entry
     */
    async createCapability(data) {
        const [capability] = await client_1.db.insert(schema_1.agentCapabilityRegistry).values(data).returning();
        return capability;
    }
    /**
     * Create onboarding event
     */
    async createOnboardingEvent(data) {
        const [event] = await client_1.db.insert(schema_1.agentOnboardingEvents).values(data).returning();
        return event;
    }
    /**
     * Create directory entry
     */
    async createDirectoryEntry(data) {
        const [entry] = await client_1.db.insert(schema_1.agentDirectoryEntries).values(data).returning();
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
        const capabilities = await client_1.db
            .select()
            .from(schema_1.agentCapabilityRegistry)
            .where((0, drizzle_orm_1.eq)(schema_1.agentCapabilityRegistry.registrationId, registrationId));
        // Get recent onboarding events (last 10)
        const onboardingEvents = await client_1.db
            .select()
            .from(schema_1.agentOnboardingEvents)
            .where((0, drizzle_orm_1.eq)(schema_1.agentOnboardingEvents.registrationId, registrationId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.agentOnboardingEvents.timestamp))
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
        const result = await client_1.db
            .select({ count: client_1.db.$count(schema_1.agents) })
            .from(schema_1.agents)
            .where((0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt));
        return result[0]?.count ?? 0;
    }
    /**
     * Verify if a list of capabilities exist in the registry
     */
    async verifyCapabilities(capabilityNames) {
        if (!capabilityNames.length)
            return [];
        const results = await client_1.db
            .select({ name: schema_1.agentCapabilityRegistry.capabilityName })
            .from(schema_1.agentCapabilityRegistry)
            .where((0, drizzle_orm_1.inArray)(schema_1.agentCapabilityRegistry.capabilityName, capabilityNames));
        const existingNames = new Set(results.map((r) => r.name));
        return capabilityNames.filter((name) => !existingNames.has(name));
    }
    // Compatibility methods for legacy callers (migrated code paths)
    async findByStatus(status, userId) {
        return client_1.db
            .select()
            .from(schema_1.agents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agents.status, status), userId ? (0, drizzle_orm_1.eq)(schema_1.agents.userId, userId) : undefined, (0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.agents.createdAt));
    }
    async findByNameAndUserId(name, userId) {
        const [agent] = await client_1.db
            .select()
            .from(schema_1.agents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agents.name, name), (0, drizzle_orm_1.eq)(schema_1.agents.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt)))
            .limit(1);
        return agent ?? null;
    }
    async findWithPagination(userId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const [data, countResult] = await Promise.all([
            client_1.db
                .select()
                .from(schema_1.agents)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agents.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt)))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.agents.createdAt))
                .offset(offset)
                .limit(limit),
            client_1.db
                .select({ count: (0, drizzle_orm_1.sql) `cast(count(*) as integer)` })
                .from(schema_1.agents)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agents.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt))),
        ]);
        return { data, total: countResult[0]?.count ?? 0 };
    }
    async findByCapability(capability, userId) {
        const searchPattern = `%${capability}%`;
        return client_1.db
            .select()
            .from(schema_1.agents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agents.userId, userId), (0, drizzle_orm_1.like)(schema_1.agents.capabilities, searchPattern), (0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.agents.createdAt));
    }
    async findByStatusAndUserId(status, userId) {
        return this.findByStatus(status, userId);
    }
    async updateStatus(id, status, userId) {
        return this.update(id, userId ?? { status: status }, userId ? { status: status } : undefined);
    }
    async searchAgents(userId, filters = {}) {
        let whereClause = (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agents.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.agents.deletedAt));
        if (filters.name) {
            whereClause = (0, drizzle_orm_1.and)(whereClause, (0, drizzle_orm_1.like)(schema_1.agents.name, `%${filters.name}%`));
        }
        if (filters.type) {
            whereClause = (0, drizzle_orm_1.and)(whereClause, (0, drizzle_orm_1.eq)(schema_1.agents.type, filters.type));
        }
        if (filters.status) {
            whereClause = (0, drizzle_orm_1.and)(whereClause, (0, drizzle_orm_1.eq)(schema_1.agents.status, filters.status));
        }
        if (filters.capability) {
            whereClause = (0, drizzle_orm_1.and)(whereClause, (0, drizzle_orm_1.like)(schema_1.agents.capabilities, `%${filters.capability}%`));
        }
        return client_1.db.select().from(schema_1.agents).where(whereClause).orderBy((0, drizzle_orm_1.desc)(schema_1.agents.createdAt));
    }
}
exports.DrizzleAgentRepository = DrizzleAgentRepository;
// Export singleton instance
exports.drizzleAgentRepository = new DrizzleAgentRepository();
//# sourceMappingURL=agent.repository.js.map