/**
 * Agent Repository - Drizzle ORM Implementation
 * Example of migrating from Prisma to Drizzle using the Repository Pattern
 */
import { and, desc, eq, isNull, like, or, sql } from 'drizzle-orm';
import { db } from '../client';
import { agentDirectoryEntries, agentMetadata, agentRegistrations, agents } from '../schema';
import type { Agent, AgentMetadata, NewAgent, NewAgentMetadata } from '../types';

/**
 * Agent Repository - provides data access for Agent entities
 *
 * This repository abstracts the database access layer, allowing for
 * easy migration from Prisma to Drizzle without changing service code.
 */
export class DrizzleAgentRepository {
  /**
   * Create a new agent
   */
  async create(data: NewAgent): Promise<Agent> {
    const [agent] = await db.insert(agents).values(data).returning();
    return agent;
  }

  /**
   * Find agent by ID
   */
  async findById(id: string): Promise<Agent | null> {
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
    id: string
  ): Promise<(Agent & { metadata: AgentMetadata | null }) | null> {
    const result = await db
      .select()
      .from(agents)
      .leftJoin(agentMetadata, eq(agents.id, agentMetadata.agentId))
      .where(and(eq(agents.id, id), isNull(agents.deletedAt)));

    if (!result[0]) return null;

    return {
      ...result[0].agents,
      metadata: result[0].agent_metadata,
    };
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
  async findActive(): Promise<Agent[]> {
    return db
      .select()
      .from(agents)
      .where(and(eq(agents.status, 'ACTIVE'), isNull(agents.deletedAt)));
  }

  /**
   * Update an agent
   */
  async update(id: string, data: Partial<NewAgent>): Promise<Agent | null> {
    const [agent] = await db
      .update(agents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(agents.id, id))
      .returning();

    return agent ?? null;
  }

  /**
   * Soft delete an agent
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await db
      .update(agents)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(agents.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * Hard delete an agent (use with caution)
   */
  async hardDelete(id: string): Promise<boolean> {
    const result = await db.delete(agents).where(eq(agents.id, id)).returning();
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
   * Update agent heartbeat (for registry)
   */
  async updateHeartbeat(agentId: string): Promise<void> {
    await db
      .update(agentRegistrations)
      .set({
        lastHeartbeat: new Date(),
        isOnline: true,
        updatedAt: new Date(),
      })
      .where(eq(agentRegistrations.agentId, agentId));
  }

  /**
   * Mark agents as offline if no heartbeat received
   */
  async markStaleAgentsOffline(staleThresholdMs: number): Promise<number> {
    const staleTime = new Date(Date.now() - staleThresholdMs);

    const result = await db
      .update(agentRegistrations)
      .set({ isOnline: false, updatedAt: new Date() })
      .where(
        and(
          eq(agentRegistrations.isOnline, true),
          sql`${agentRegistrations.lastHeartbeat} < ${staleTime}`
        )
      )
      .returning();

    return result.length;
  }

  /**
   * Get agents with directory entries (for discovery)
   */
  async findPublicAgents(
    category?: string,
    limit = 20
  ): Promise<Array<Agent & { directoryEntry: typeof agentDirectoryEntries.$inferSelect }>> {
    // Build the base query conditions
    const baseCondition = and(eq(agentDirectoryEntries.isPublic, true), isNull(agents.deletedAt));

    // Add category filter if provided
    const whereCondition = category
      ? and(baseCondition, eq(agentDirectoryEntries.category, category))
      : baseCondition;

    const results = await db
      .select()
      .from(agents)
      .innerJoin(agentDirectoryEntries, eq(agents.id, agentDirectoryEntries.agentId))
      .where(whereCondition)
      .orderBy(desc(agentDirectoryEntries.rating))
      .limit(limit);

    return results.map((r) => ({
      ...r.agents,
      directoryEntry: r.agent_directory_entries,
    }));
  }
}

// Export singleton instance
export const drizzleAgentRepository = new DrizzleAgentRepository();
