import { Injectable, Logger } from '@nestjs/common';
import {
  agentCapabilityRegistry,
  agentDirectoryEntries,
  agentMetrics,
  agentRegistrations,
  agents,
  and,
  asc,
  db,
  desc,
  eq,
  ilike,
  or,
  sql,
} from '@the-new-fuse/database';
import { AgentDirectoryEntryDto, AgentDirectoryResponseDto, SearchAgentsDto } from '../dto';
import { IAgentMetric } from '../interfaces/agent-registry.interfaces';

@Injectable()
export class AgentDirectoryService {
  private readonly logger = new Logger(AgentDirectoryService.name);

  constructor() {}

  private rows(result: any): Record<string, any>[] {
    if (Array.isArray(result)) return result as Record<string, any>[];
    if (result?.rows && Array.isArray(result.rows)) return result.rows as Record<string, any>[];
    return [];
  }

  /**
   * Search agents in the directory
   */
  async searchAgents(query: SearchAgentsDto): Promise<AgentDirectoryResponseDto> {
    try {
      return await this.searchAgentsFromTnf(query);
    } catch (error: any) {
      this.logger.warn(
        `TNF V2 directory search failed, using legacy fallback: ${error?.message || 'unknown error'}`
      );
      return this.searchAgentsLegacy(query);
    }
  }

  private async searchAgentsFromTnf(query: SearchAgentsDto): Promise<AgentDirectoryResponseDto> {
    const {
      query: searchQuery,
      category,
      capability,
      verifiedOnly,
      publicOnly,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'lastActiveAt',
      sortOrder = 'desc',
    } = query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

    const result = await db.execute(sql`
      SELECT
        d.id::text AS id,
        d.tnf_id,
        d.name,
        d.description,
        d.agent_type,
        d.access_level,
        d.is_system,
        d.capabilities,
        d.skills,
        d.tags,
        d.updated_at,
        d.created_at
      FROM tnf_agent_definitions d
      ORDER BY d.is_system DESC, d.name ASC
    `);

    const raw = this.rows(result);
    const normalized = raw.map((row) => {
      const rowTags = Array.isArray(row.tags) ? row.tags : [];
      const rowSkills = Array.isArray(row.skills) ? row.skills : [];
      const rowCapabilities = Array.isArray(row.capabilities) ? row.capabilities : [];
      const allTags = Array.from(new Set([...rowTags, ...rowSkills]));
      const derivedCategory = String(row.agent_type || 'general').toLowerCase();
      const isPublicDerived = ['guest', 'user', 'dev'].includes(
        String(row.access_level || '').toLowerCase()
      );
      return {
        id: row.tnf_id || row.id,
        displayName: row.name,
        description: row.description || undefined,
        category: derivedCategory,
        tags: allTags,
        isPublic: isPublicDerived,
        isVerified: true,
        rating: row.is_system ? 5 : 4,
        usageCount: 0,
        lastActiveAt: row.updated_at || row.created_at || new Date(),
        featured: Boolean(row.is_system),
        capabilities: rowCapabilities.map((c: any) => String(c)),
      };
    });

    let filtered = normalized;

    if (searchQuery) {
      const needle = searchQuery.toLowerCase();
      filtered = filtered.filter((entry) =>
        [
          entry.displayName,
          entry.description || '',
          entry.tags.join(' '),
          entry.capabilities.join(' '),
        ]
          .join(' ')
          .toLowerCase()
          .includes(needle)
      );
    }

    if (category) {
      const cat = category.toLowerCase();
      filtered = filtered.filter((entry) => (entry.category || '').toLowerCase() === cat);
    }

    if (verifiedOnly) {
      filtered = filtered.filter((entry) => entry.isVerified);
    }

    if (publicOnly !== undefined) {
      filtered = filtered.filter((entry) => entry.isPublic === publicOnly);
    }

    if (capability) {
      const capNeedle = capability.toLowerCase();
      filtered = filtered.filter((entry) =>
        entry.capabilities.some((c) => c.toLowerCase().includes(capNeedle))
      );
    }

    if (tags?.length) {
      const lowerTags = tags.map((t) => t.toLowerCase());
      filtered = filtered.filter((entry) =>
        lowerTags.every((tag) => entry.tags.some((entryTag) => entryTag.toLowerCase() === tag))
      );
    }

    const dir = sortOrder === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (a.rating - b.rating) * dir;
        case 'usageCount':
          return (a.usageCount - b.usageCount) * dir;
        case 'createdAt':
          return (new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime()) * dir;
        case 'lastActiveAt':
        default:
          return (new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime()) * dir;
      }
    });

    const total = filtered.length;
    const offset = (pageNum - 1) * limitNum;
    const data = filtered.slice(offset, offset + limitNum);

    return {
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  private async searchAgentsLegacy(query: SearchAgentsDto): Promise<AgentDirectoryResponseDto> {
    const {
      query: searchQuery,
      category,
      capability,
      verifiedOnly,
      publicOnly,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'lastActiveAt',
      sortOrder = 'desc',
    } = query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

    // Build where conditions
    const conditions: any[] = [];

    if (searchQuery) {
      conditions.push(
        or(
          ilike(agentDirectoryEntries.displayName, `%${searchQuery}%`),
          ilike(agentDirectoryEntries.description, `%${searchQuery}%`),
          ilike(agentDirectoryEntries.searchableData, `%${searchQuery}%`)
        )
      );
    }

    if (category) {
      conditions.push(eq(agentDirectoryEntries.category, category));
    }

    if (verifiedOnly) {
      conditions.push(eq(agentDirectoryEntries.isVerified, true));
    }

    if (publicOnly !== undefined) {
      conditions.push(eq(agentDirectoryEntries.isPublic, publicOnly));
    }

    // Calculate pagination
    const offset = (pageNum - 1) * limitNum;

    // Build the order clause
    const orderColumn =
      agentDirectoryEntries[sortBy as keyof typeof agentDirectoryEntries] ||
      agentDirectoryEntries.lastActiveAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Execute query
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [entries, countResult] = await Promise.all([
      db.query.agentDirectoryEntries.findMany({
        where: whereClause,
        limit: limitNum,
        offset,
        orderBy: [orderFn(orderColumn as any)],
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(agentDirectoryEntries)
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count || 0);

    // Get capabilities for each agent
    const entriesWithCapabilities = await Promise.all(
      entries.map(async (entry) => {
        const registration = await db.query.agentRegistrations.findFirst({
          where: eq(agentRegistrations.agentId, entry.agentId),
        });

        let capabilities: string[] = [];
        if (registration) {
          const caps = await db.query.agentCapabilityRegistry.findMany({
            where: eq(agentCapabilityRegistry.registrationId, registration.id),
          });
          capabilities = caps.map((c) => c.capabilityName);
        }

        return {
          id: entry.agentId,
          displayName: entry.displayName,
          description: entry.description || undefined,
          category: entry.category || undefined,
          tags: entry.tags as string[],
          isPublic: entry.isPublic,
          isVerified: entry.isVerified,
          rating: entry.rating || 0,
          usageCount: entry.usageCount,
          lastActiveAt: entry.lastActiveAt,
          featured: entry.featured,
          capabilities,
        };
      })
    );

    // Filter by capability if specified
    let filteredEntries = entriesWithCapabilities;
    if (capability) {
      filteredEntries = entriesWithCapabilities.filter((e) =>
        e.capabilities.some((c) => c.toLowerCase().includes(capability.toLowerCase()))
      );
    }

    return {
      data: filteredEntries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: capability ? filteredEntries.length : total,
        totalPages: Math.ceil((capability ? filteredEntries.length : total) / limitNum),
      },
    };
  }

  /**
   * Get agent details from directory
   */
  async getAgentDetails(agentId: string) {
    try {
      return await this.getAgentDetailsFromTnf(agentId);
    } catch (error: any) {
      this.logger.warn(
        `TNF V2 agent details failed, using legacy fallback: ${error?.message || 'unknown error'}`
      );
      return this.getAgentDetailsLegacy(agentId);
    }
  }

  private async getAgentDetailsFromTnf(agentId: string) {
    const result = await db.execute(sql`
      SELECT
        d.id::text AS id,
        d.tnf_id,
        d.name,
        d.description,
        d.agent_type,
        d.access_level,
        d.is_system,
        d.capabilities,
        d.skills,
        d.tags,
        d.version,
        d.metadata,
        d.created_at,
        d.updated_at
      FROM tnf_agent_definitions d
      WHERE d.tnf_id = ${agentId} OR d.id::text = ${agentId}
      LIMIT 1
    `);

    const rows = this.rows(result);
    const row = rows[0];
    if (!row) {
      return null;
    }

    const tags = Array.isArray(row.tags) ? row.tags : [];
    const skills = Array.isArray(row.skills) ? row.skills : [];
    const capabilities = Array.isArray(row.capabilities) ? row.capabilities : [];

    return {
      id: row.tnf_id || row.id,
      displayName: row.name,
      description: row.description,
      category: String(row.agent_type || 'general').toLowerCase(),
      tags: Array.from(new Set([...tags, ...skills])),
      isPublic: ['guest', 'user', 'dev'].includes(String(row.access_level || '').toLowerCase()),
      isVerified: true,
      rating: row.is_system ? 5 : 4,
      usageCount: 0,
      lastActiveAt: row.updated_at || row.created_at,
      featured: Boolean(row.is_system),
      status: 'ACTIVE',
      capabilities: capabilities.map((cap: any) => ({
        name: String(cap),
        type: 'tnf-capability',
        version: row.version || '1.0.0',
        description: null,
        verified: true,
      })),
      metadata: row.metadata || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async getAgentDetailsLegacy(agentId: string) {
    const entry = await db.query.agentDirectoryEntries.findFirst({
      where: eq(agentDirectoryEntries.agentId, agentId),
    });

    if (!entry) {
      return null;
    }

    const [agent, registration] = await Promise.all([
      db.query.agents.findFirst({
        where: eq(agents.id, agentId),
      }),
      db.query.agentRegistrations.findFirst({
        where: eq(agentRegistrations.agentId, agentId),
      }),
    ]);

    let capabilities: any[] = [];
    if (registration) {
      const caps = await db.query.agentCapabilityRegistry.findMany({
        where: eq(agentCapabilityRegistry.registrationId, registration.id),
      });
      capabilities = caps.map((c) => ({
        name: c.capabilityName,
        type: c.capabilityType,
        version: c.version,
        description: c.description,
        verified: c.verificationStatus === 'VERIFIED',
      }));
    }

    return {
      id: entry.agentId,
      displayName: entry.displayName,
      description: entry.description,
      category: entry.category,
      tags: entry.tags,
      isPublic: entry.isPublic,
      isVerified: entry.isVerified,
      rating: entry.rating,
      usageCount: entry.usageCount,
      lastActiveAt: entry.lastActiveAt,
      featured: entry.featured,
      status: agent?.status,
      capabilities,
      metadata: null, // entry.metadata if needed
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  /**
   * Get featured agents
   */
  async getFeaturedAgents(limit: number = 10): Promise<AgentDirectoryEntryDto[]> {
    try {
      return await this.getFeaturedAgentsFromTnf(limit);
    } catch (error: any) {
      this.logger.warn(
        `TNF V2 featured agents failed, using legacy fallback: ${error?.message || 'unknown error'}`
      );
      return this.getFeaturedAgentsLegacy(limit);
    }
  }

  private async getFeaturedAgentsFromTnf(limit: number): Promise<AgentDirectoryEntryDto[]> {
    const result = await db.execute(sql`
      SELECT
        d.id::text AS id,
        d.tnf_id,
        d.name,
        d.description,
        d.agent_type,
        d.access_level,
        d.is_system,
        d.capabilities,
        d.skills,
        d.tags,
        d.updated_at
      FROM tnf_agent_definitions d
      ORDER BY d.is_system DESC, d.updated_at DESC
      LIMIT ${limit}
    `);

    return this.rows(result).map((row) => {
      const tags = Array.isArray(row.tags) ? row.tags : [];
      const skills = Array.isArray(row.skills) ? row.skills : [];
      const capabilities = Array.isArray(row.capabilities) ? row.capabilities : [];

      return {
        id: row.tnf_id || row.id,
        displayName: row.name,
        description: row.description || undefined,
        category: String(row.agent_type || 'general').toLowerCase(),
        tags: Array.from(new Set([...tags, ...skills])),
        isPublic: ['guest', 'user', 'dev'].includes(String(row.access_level || '').toLowerCase()),
        isVerified: true,
        rating: row.is_system ? 5 : 4,
        usageCount: 0,
        lastActiveAt: row.updated_at || new Date(),
        featured: Boolean(row.is_system),
        capabilities: capabilities.map((c: any) => String(c)),
      };
    });
  }

  private async getFeaturedAgentsLegacy(limit: number = 10): Promise<AgentDirectoryEntryDto[]> {
    const entries = await db.query.agentDirectoryEntries.findMany({
      where: and(
        eq(agentDirectoryEntries.featured, true),
        eq(agentDirectoryEntries.isPublic, true),
        eq(agentDirectoryEntries.isVerified, true)
      ),
      limit,
      orderBy: [desc(agentDirectoryEntries.rating)],
    });

    return Promise.all(
      entries.map(async (entry) => {
        const registration = await db.query.agentRegistrations.findFirst({
          where: eq(agentRegistrations.agentId, entry.agentId),
        });

        let capabilities: string[] = [];
        if (registration) {
          const caps = await db.query.agentCapabilityRegistry.findMany({
            where: eq(agentCapabilityRegistry.registrationId, registration.id),
          });
          capabilities = caps.map((c) => c.capabilityName);
        }

        return {
          id: entry.agentId,
          displayName: entry.displayName,
          description: entry.description || undefined,
          category: entry.category || undefined,
          tags: entry.tags as string[],
          isPublic: entry.isPublic,
          isVerified: entry.isVerified,
          rating: entry.rating || 0,
          usageCount: entry.usageCount,
          lastActiveAt: entry.lastActiveAt,
          featured: entry.featured,
          capabilities,
        };
      })
    );
  }

  /**
   * Update agent rating
   */
  async updateRating(agentId: string, rating: number): Promise<void> {
    await db
      .update(agentDirectoryEntries)
      .set({ rating, updatedAt: new Date() } as any)
      .where(eq(agentDirectoryEntries.agentId, agentId));
  }

  /**
   * Increment usage count
   */
  async incrementUsage(agentId: string): Promise<void> {
    await db
      .update(agentDirectoryEntries)
      .set({
        usageCount: sql`${agentDirectoryEntries.usageCount} + 1`,
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(agentDirectoryEntries.agentId, agentId));
  }

  /**
   * Record agent metric
   */
  async recordMetric(registrationId: string, metric: IAgentMetric): Promise<void> {
    await db.insert(agentMetrics).values({
      registrationId,
      metricType: metric.type,
      value: metric.value,
      unit: metric.unit,
      tags: metric.tags || {},
    } as any);
  }

  /**
   * Get agent metrics
   */
  async getAgentMetrics(
    registrationId: string,
    metricType?: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const conditions: any[] = [eq(agentMetrics.registrationId, registrationId)];

    if (metricType) {
      conditions.push(eq(agentMetrics.metricType, metricType));
    }

    // Note: Date filtering would need gte/lte operators
    // For simplicity, we'll filter in memory if needed

    const metrics = await db.query.agentMetrics.findMany({
      where: and(...conditions),
      orderBy: [desc(agentMetrics.timestamp)],
      limit: 1000,
    });

    // Filter by date if needed
    let filteredMetrics = metrics;
    if (startDate || endDate) {
      filteredMetrics = metrics.filter((m) => {
        const ts = m.timestamp;
        if (startDate && ts < startDate) return false;
        if (endDate && ts > endDate) return false;
        return true;
      });
    }

    // Aggregate metrics by type
    const aggregated: Record<string, any> = {};

    filteredMetrics.forEach((metric) => {
      if (!aggregated[metric.metricType]) {
        aggregated[metric.metricType] = {
          type: metric.metricType,
          count: 0,
          sum: 0,
          avg: 0,
          min: Infinity,
          max: -Infinity,
          unit: metric.unit,
        };
      }

      const agg = aggregated[metric.metricType];
      agg.count++;
      agg.sum += metric.value;
      agg.min = Math.min(agg.min, metric.value);
      agg.max = Math.max(agg.max, metric.value);
      agg.avg = agg.sum / agg.count;
    });

    return {
      registrationId,
      period: {
        start: startDate,
        end: endDate,
      },
      metrics: Object.values(aggregated),
      raw: filteredMetrics.slice(0, 100),
    };
  }

  /**
   * Get directory statistics
   */
  async getDirectoryStats() {
    try {
      return await this.getDirectoryStatsFromTnf();
    } catch (error: any) {
      this.logger.warn(
        `TNF V2 directory stats failed, using legacy fallback: ${error?.message || 'unknown error'}`
      );
      return this.getDirectoryStatsLegacy();
    }
  }

  private async getDirectoryStatsFromTnf() {
    const [totalRes, publicRes, activeSessionsRes, categoriesRes] = await Promise.all([
      db.execute(sql`SELECT count(*)::int AS count FROM tnf_agent_definitions`),
      db.execute(
        sql`SELECT count(*)::int AS count FROM tnf_agent_definitions WHERE access_level IN ('guest','user','dev')`
      ),
      db.execute(
        sql`SELECT count(*)::int AS count FROM tnf_agent_sessions WHERE status IN ('active','busy','idle')`
      ),
      db.execute(sql`
        SELECT lower(agent_type) AS category, count(*)::int AS count
        FROM tnf_agent_definitions
        GROUP BY lower(agent_type)
        ORDER BY count(*) DESC
      `),
    ]);

    const totalAgents = Number(this.rows(totalRes)[0]?.count || 0);
    const publicAgents = Number(this.rows(publicRes)[0]?.count || 0);
    const onlineAgents = Number(this.rows(activeSessionsRes)[0]?.count || 0);
    const categories = this.rows(categoriesRes);

    return {
      totalAgents,
      verifiedAgents: totalAgents,
      publicAgents,
      onlineAgents,
      categoriesDistribution: categories.map((c) => ({
        category: c.category,
        count: Number(c.count),
      })),
    };
  }

  private async getDirectoryStatsLegacy() {
    const [totalResult, verifiedResult, publicResult, onlineResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(agentDirectoryEntries),
      db
        .select({ count: sql<number>`count(*)` })
        .from(agentDirectoryEntries)
        .where(eq(agentDirectoryEntries.isVerified, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(agentDirectoryEntries)
        .where(eq(agentDirectoryEntries.isPublic, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(agentRegistrations)
        .where(eq(agentRegistrations.isOnline, true)),
    ]);

    // Get category distribution
    const categories = await db
      .select({
        category: agentDirectoryEntries.category,
        count: sql<number>`count(*)`,
      })
      .from(agentDirectoryEntries)
      .groupBy(agentDirectoryEntries.category);

    return {
      totalAgents: Number(totalResult[0]?.count || 0),
      verifiedAgents: Number(verifiedResult[0]?.count || 0),
      publicAgents: Number(publicResult[0]?.count || 0),
      onlineAgents: Number(onlineResult[0]?.count || 0),
      categoriesDistribution: categories.map((c) => ({
        category: c.category,
        count: Number(c.count),
      })),
    };
  }
}
