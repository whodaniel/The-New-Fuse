/**
 * Agent Repository - Drizzle ORM Implementation
 * Example of migrating from Drizzle to Drizzle using the Repository Pattern
 */
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';
import { and, desc, eq, inArray, isNull, like, or, sql } from 'drizzle-orm';
import { db } from '../client';
import {
  agentCapabilityRegistry,
  agentDirectoryEntries,
  agentMetadata,
  agentOnboardingEvents,
  agentRegistrations,
  agents,
} from '../schema';
import type { Agent, AgentMetadata, NewAgent, NewAgentMetadata } from '../types';

// HMAC-SHA256 Hashing for Auth Tokens (Deterministic)
function hashToken(token: string): string {
  if (!process.env.ENCRYPTION_KEY) return token;

  try {
    const hmac = crypto.createHmac('sha256', process.env.ENCRYPTION_KEY);
    hmac.update(token);
    return `hmac_${hmac.digest('hex')}`;
  } catch (error) {
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
  async create(data: Omit<NewAgent, 'id'> & { id?: string }): Promise<Agent> {
    const id = data.id || `agent_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const [agent] = await db
      .insert(agents)
      .values({ ...data, id } as NewAgent)
      .returning();
    return agent;
  }

  /**
   * Find agent by ID (Safe: Requires userId)
   */
  async findById(id: string, userId?: string): Promise<Agent | null> {
    const [agent] = await db
      .select()
      .from(agents)
      .where(
        and(
          eq(agents.id, id),
          userId ? eq(agents.userId, userId) : undefined,
          isNull(agents.deletedAt)
        )
      );

    return agent ?? null;
  }

  /**
   * Find agent by ID (System: internal use only, ignores userId)
   */
  async findByIdSystem(id: string): Promise<Agent | null> {
    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, id), isNull(agents.deletedAt)));

    return agent ?? null;
  }

  /**
   * Find agent by ID with metadata
   */
  async findByIdWithMetadata(
    id: string,
    userId: string
  ): Promise<(Agent & { metadata: AgentMetadata | null }) | null> {
    const result = await db
      .select()
      .from(agents)
      .leftJoin(agentMetadata, eq(agents.id, agentMetadata.agentId))
      .where(and(eq(agents.id, id), eq(agents.userId, userId), isNull(agents.deletedAt)));

    if (!result[0]) return null;

    return {
      ...result[0].agents,
      metadata: result[0].agent_metadata,
    };
  }

  /**
   * Fetch metadata rows for a batch of agents
   */
  async findMetadataByAgentIds(agentIds: string[]): Promise<AgentMetadata[]> {
    const ids = agentIds.filter((id) => typeof id === 'string' && id.trim().length > 0);
    if (ids.length === 0) return [];

    return db.select().from(agentMetadata).where(inArray(agentMetadata.agentId, ids));
  }

  /**
   * Find all agents for a user
   */
  async findByUserId(userId: string): Promise<Agent[]> {
    return db
      .select()
      .from(agents)
      .where(and(eq(agents.userId, userId), isNull(agents.deletedAt)))
      .orderBy(desc(agents.createdAt));
  }

  /**
   * Find all active agents
   */
  async findActive(userId: string): Promise<Agent[]> {
    return db
      .select()
      .from(agents)
      .where(and(eq(agents.status, 'ACTIVE'), eq(agents.userId, userId), isNull(agents.deletedAt)));
  }

  /**
   * Find all agents (with optional limit)
   */
  async findAll(userId: string, limit?: number): Promise<Agent[]> {
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
  async findAllSystem(page = 1, limit = 50): Promise<{ data: Agent[]; total: number }> {
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
        .select({ count: sql<number>`cast(count(*) as integer)` })
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
  async update(
    id: string,
    userIdOrData: string | Partial<NewAgent>,
    dataArg?: Partial<NewAgent>
  ): Promise<Agent | null> {
    const hasScopedUser = typeof userIdOrData === 'string';
    const userId = hasScopedUser ? userIdOrData : undefined;
    const data = (hasScopedUser ? dataArg : userIdOrData) as Partial<NewAgent>;

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
  async softDelete(id: string, userId?: string): Promise<boolean> {
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
  async hardDelete(id: string, userId?: string): Promise<boolean> {
    const result = await db
      .delete(agents)
      .where(and(eq(agents.id, id), userId ? eq(agents.userId, userId) : undefined))
      .returning();
    return result.length > 0;
  }

  /**
   * Search agents by name or description
   */
  async search(query: string, userId?: string): Promise<Agent[]> {
    const searchPattern = `%${query}%`;

    let whereClause = and(
      or(like(agents.name, searchPattern), like(agents.description, searchPattern)),
      isNull(agents.deletedAt)
    );

    if (userId) {
      whereClause = and(whereClause, eq(agents.userId, userId));
    }

    return db.select().from(agents).where(whereClause).orderBy(desc(agents.createdAt)).limit(50);
  }

  /**
   * Count agents by status
   */
  async countByStatus(): Promise<{ status: string; count: number }[]> {
    const result = await db
      .select({
        status: agents.status,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(agents)
      .where(isNull(agents.deletedAt))
      .groupBy(agents.status);

    return result;
  }

  /**
   * Count total active agents across the system
   */
  async countActive(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(agents)
      .where(and(eq(agents.status, 'ACTIVE'), isNull(agents.deletedAt)));

    return Number(result[0]?.count ?? 0);
  }

  /**
   * Create or update agent metadata
   */
  async upsertMetadata(agentId: string, data: Partial<NewAgentMetadata>): Promise<AgentMetadata> {
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
    } else {
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
  async createRegistration(data: {
    agentId: string;
    authToken: string;
    registrationData: any;
    verificationStatus: string;
    onboardingStatus: string;
    onboardingProgress: number;
    heartbeatInterval: number;
    isOnline: boolean;
    metadata: any;
  }) {
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
      .values(insertData as any)
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
  async findRegistrationByToken(token: string) {
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
  async findRegistrationById(id: string, userId?: string) {
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
  async updateRegistrationHeartbeat(registrationId: string): Promise<void> {
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
  async createCapability(data: {
    registrationId: string;
    capabilityName: string;
    capabilityType: string;
    version: string;
    description?: string;
    parameters?: any;
    verificationStatus: string;
  }) {
    const [capability] = await db.insert(agentCapabilityRegistry).values(data).returning();
    return capability;
  }

  /**
   * Create onboarding event
   */
  async createOnboardingEvent(data: {
    registrationId: string;
    eventType: string;
    message: string;
    eventData?: any;
  }) {
    const [event] = await db.insert(agentOnboardingEvents).values(data).returning();
    return event;
  }

  /**
   * Create directory entry
   */
  async createDirectoryEntry(data: {
    agentId: string;
    displayName: string;
    description?: string;
    category: string;
    tags: string[];
    isPublic: boolean;
    isVerified: boolean;
    rating: number;
    usageCount: number;
    searchableData?: string;
  }) {
    const [entry] = await db.insert(agentDirectoryEntries).values(data).returning();
    return entry;
  }

  /**
   * Find registration with related data
   */
  async findRegistrationWithDetails(registrationId: string, userId: string) {
    // First get the registration (verifying ownership)
    const registration = await this.findRegistrationById(registrationId, userId);
    if (!registration || !registration.agentId) return null;

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
  async count(): Promise<number> {
    const result = await db
      .select({ count: db.$count(agents) })
      .from(agents)
      .where(isNull(agents.deletedAt));

    return result[0]?.count ?? 0;
  }

  /**
   * Verify if a list of capabilities exist in the registry
   */
  async verifyCapabilities(capabilityNames: string[]): Promise<string[]> {
    if (!capabilityNames.length) return [];

    const results = await db
      .select({ name: agentCapabilityRegistry.capabilityName })
      .from(agentCapabilityRegistry)
      .where(inArray(agentCapabilityRegistry.capabilityName, capabilityNames));

    const existingNames = new Set(results.map((r) => r.name));
    return capabilityNames.filter((name) => !existingNames.has(name));
  }

  // Compatibility methods for legacy callers (migrated code paths)
  async findByStatus(status: string, userId?: string): Promise<Agent[]> {
    return db
      .select()
      .from(agents)
      .where(
        and(
          eq(agents.status, status as any),
          userId ? eq(agents.userId, userId) : undefined,
          isNull(agents.deletedAt)
        )
      )
      .orderBy(desc(agents.createdAt));
  }

  async findByNameAndUserId(name: string, userId: string): Promise<Agent | null> {
    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.name, name), eq(agents.userId, userId), isNull(agents.deletedAt)))
      .limit(1);
    return agent ?? null;
  }

  async findWithPagination(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{ data: Agent[]; total: number }> {
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
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(agents)
        .where(and(eq(agents.userId, userId), isNull(agents.deletedAt))),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  async findByCapability(capability: string, userId: string): Promise<Agent[]> {
    const searchPattern = `%${capability}%`;
    return db
      .select()
      .from(agents)
      .where(
        and(
          eq(agents.userId, userId),
          like(agents.capabilities as any, searchPattern),
          isNull(agents.deletedAt)
        )
      )
      .orderBy(desc(agents.createdAt));
  }

  async findByStatusAndUserId(status: string, userId: string): Promise<Agent[]> {
    return this.findByStatus(status, userId);
  }

  async updateStatus(id: string, status: string, userId?: string): Promise<Agent | null> {
    return this.update(
      id,
      userId ?? { status: status as any },
      userId ? { status: status as any } : undefined
    );
  }

  async searchAgents(
    userId: string,
    filters: { name?: string; type?: string; status?: string; capability?: string } = {}
  ): Promise<Agent[]> {
    let whereClause = and(eq(agents.userId, userId), isNull(agents.deletedAt));

    if (filters.name) {
      whereClause = and(whereClause, like(agents.name, `%${filters.name}%`));
    }
    if (filters.type) {
      whereClause = and(whereClause, eq(agents.type, filters.type as any));
    }
    if (filters.status) {
      whereClause = and(whereClause, eq(agents.status, filters.status as any));
    }
    if (filters.capability) {
      whereClause = and(whereClause, like(agents.capabilities as any, `%${filters.capability}%`));
    }

    return db.select().from(agents).where(whereClause).orderBy(desc(agents.createdAt));
  }
}

// Export singleton instance
export const drizzleAgentRepository = new DrizzleAgentRepository();
