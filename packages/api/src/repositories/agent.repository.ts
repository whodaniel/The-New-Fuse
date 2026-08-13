/**
 * Agent Repository - Drizzle ORM Implementation
 *
 * This repository provides data access for Agent entities using Drizzle ORM.
 * It replaces the legacy Drizzle-based repository.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  desc,
  DRIZZLE_CLIENT,
  type DrizzleClient,
  drizzleSchema,
  eq,
  isNull,
  like,
  or,
  sql,
} from '@the-new-fuse/database';

// Destructure the schema tables we need
const { agents } = drizzleSchema;

// Type alias for the select model
type Agent = typeof agents.$inferSelect;

// Custom insert type that includes all optional fields
interface AgentInsert {
  name: string;
  type: (typeof agents.$inferInsert)['type'];
  userId: string;
  status?: string | null;
  description?: string | null;
  systemPrompt?: string | null;
  config?: any;
  profile?: any;
  capabilities?: string[];
  provider?: string;
  deletedAt?: Date | null;
}

/**
 * Interface for the repository
 */
export interface IAgentRepository {
  create(data: AgentInsert): Promise<Agent>;
  findById(id: string): Promise<Agent | null>;
  findByUserId(userId: string): Promise<Agent[]>;
  findAll(filter?: Partial<Agent>): Promise<Agent[]>;
  findOne(filter: Partial<Agent>): Promise<Agent | null>;
  update(id: string, data: Partial<AgentInsert>): Promise<Agent | null>;
  delete(id: string): Promise<boolean>;
}

@Injectable()
export class AgentRepository implements IAgentRepository {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  /**
   * Create a new agent
   */
  async create(data: AgentInsert): Promise<Agent> {
    const [agent] = await this.db
      .insert(agents)
      .values(data as any)
      .returning();
    return agent;
  }

  /**
   * Find agent by ID
   */
  async findById(id: string): Promise<Agent | null> {
    const [agent] = await this.db
      .select()
      .from(agents)
      .where(and(eq(agents.id, id), isNull(agents.deletedAt)));

    return agent ?? null;
  }

  /**
   * Find all agents for a user
   */
  async findByUserId(userId: string): Promise<Agent[]> {
    return this.db
      .select()
      .from(agents)
      .where(and(eq(agents.userId, userId), isNull(agents.deletedAt)))
      .orderBy(desc(agents.createdAt));
  }

  /**
   * Find all agents with optional filter
   */
  async findAll(filter?: Partial<Agent>): Promise<Agent[]> {
    const conditions = [isNull(agents.deletedAt)];

    if (filter?.userId) {
      conditions.push(eq(agents.userId, filter.userId));
    }
    if (filter?.status) {
      conditions.push(eq(agents.status, filter.status));
    }
    if (filter?.type) {
      conditions.push(eq(agents.type, filter.type));
    }

    return this.db
      .select()
      .from(agents)
      .where(and(...conditions))
      .orderBy(desc(agents.createdAt));
  }

  /**
   * Find agents with semantic chain filters (category, visibility, dacc_role, domain).
   * This supports the progressive disclosure API by allowing drill-down by department
   * and visibility tier instead of returning all 194 agents flat.
   */
  async findWithSemanticFilters(options: {
    userId?: string;
    category?: string;
    domain?: string;
    visibility?: string;
    daccRole?: string;
    limit?: number;
  }): Promise<Agent[]> {
    const conditions = [isNull(agents.deletedAt)];

    if (options.userId) {
      conditions.push(eq(agents.userId, options.userId));
    }
    if (options.category) {
      conditions.push(eq(drizzleSchema.agentDirectoryEntries.category, options.category));
    }
    if (options.visibility) {
      // visibility is stored in agent metadata profile
      conditions.push(sql`${agents.profile}->>'visibility' = ${options.visibility}`);
    }
    if (options.daccRole) {
      // dacc_role is stored in the profile jsonb
      conditions.push(sql`${agents.profile}->>'dacc_role' = ${options.daccRole}`);
    }
    if (options.domain) {
      // domain is stored in the profile jsonb
      conditions.push(sql`${agents.profile}->>'domain' = ${options.domain}`);
    }

    const query = this.db
      .select()
      .from(agents)
      .where(and(...conditions))
      .orderBy(desc(agents.createdAt));

    if (options.limit) {
      return query.limit(options.limit);
    }
    return query;
  }

  /**
   * Get distinct categories (departments) from agent directory entries
   */
  async getDistinctCategories(): Promise<string[]> {
    const results = await this.db
      .selectDistinct({ category: drizzleSchema.agentDirectoryEntries.category })
      .from(drizzleSchema.agentDirectoryEntries);

    return results.map((r) => r.category).filter(Boolean) as string[];
  }

  /**
   * Get agent directory entries with optional category and visibility filtering
   */
  async findDirectoryEntries(options: {
    category?: string;
    isPublicOnly?: boolean;
    limit?: number;
  }): Promise<any[]> {
    const conditions: any[] = [];

    if (options.category) {
      conditions.push(eq(drizzleSchema.agentDirectoryEntries.category, options.category));
    }
    if (options.isPublicOnly) {
      conditions.push(eq(drizzleSchema.agentDirectoryEntries.isPublic, true));
    }

    const query = this.db
      .select()
      .from(drizzleSchema.agentDirectoryEntries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(drizzleSchema.agentDirectoryEntries.lastActiveAt));

    if (options.limit) {
      return query.limit(options.limit);
    }
    return query;
  }

  /**
   * Find one agent matching filter
   */
  async findOne(filter: Partial<Agent>): Promise<Agent | null> {
    const conditions = [isNull(agents.deletedAt)];

    if (filter.id) {
      conditions.push(eq(agents.id, filter.id));
    }
    if (filter.userId) {
      conditions.push(eq(agents.userId, filter.userId));
    }
    if (filter.name) {
      conditions.push(eq(agents.name, filter.name));
    }

    const [agent] = await this.db
      .select()
      .from(agents)
      .where(and(...conditions))
      .limit(1);

    return agent ?? null;
  }

  /**
   * Update an agent
   */
  async update(id: string, data: Partial<AgentInsert>): Promise<Agent | null> {
    const updateData = { ...data, updatedAt: new Date() };
    const [agent] = await this.db
      .update(agents)
      .set(updateData as any)
      .where(eq(agents.id, id))
      .returning();

    return agent ?? null;
  }

  /**
   * Soft delete an agent
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .update(agents)
      .set({ deletedAt: new Date(), updatedAt: new Date() } as any)
      .where(eq(agents.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * Search agents by name or description
   */
  async search(query: string, userId?: string): Promise<Agent[]> {
    const searchPattern = `%${query}%`;

    const conditions = [
      or(like(agents.name, searchPattern), like(agents.description, searchPattern)),
      isNull(agents.deletedAt),
    ];

    if (userId) {
      conditions.push(eq(agents.userId, userId));
    }

    return this.db
      .select()
      .from(agents)
      .where(and(...conditions))
      .orderBy(desc(agents.createdAt))
      .limit(50);
  }

  /**
   * Count agents by status
   */
  async countByStatus(): Promise<{ status: string; count: number }[]> {
    const result = await this.db
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
   * Find agents with specific capability
   */
  async findByCapability(capability: string, userId: string): Promise<Agent[]> {
    return this.db
      .select()
      .from(agents)
      .where(
        and(
          eq(agents.userId, userId),
          isNull(agents.deletedAt),
          sql`${agents.capabilities} @> ${JSON.stringify([capability])}`
        )
      )
      .orderBy(desc(agents.createdAt));
  }

  /**
   * Find active agents for a user
   */
  async findActiveByUserId(userId: string): Promise<Agent[]> {
    return this.db
      .select()
      .from(agents)
      .where(and(eq(agents.userId, userId), eq(agents.status, 'ACTIVE'), isNull(agents.deletedAt)))
      .orderBy(desc(agents.createdAt));
  }
}

// Re-export types for consumers
export type { Agent, AgentInsert as NewAgent };
