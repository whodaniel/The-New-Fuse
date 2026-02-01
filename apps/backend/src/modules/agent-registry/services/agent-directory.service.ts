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

  /**
   * Search agents in the directory
   */
  async searchAgents(query: SearchAgentsDto): Promise<AgentDirectoryResponseDto> {
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
    const offset = (page - 1) * limit;

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
        limit,
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
        page,
        limit,
        total: capability ? filteredEntries.length : total,
        totalPages: Math.ceil((capability ? filteredEntries.length : total) / limit),
      },
    };
  }

  /**
   * Get agent details from directory
   */
  async getAgentDetails(agentId: string) {
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
