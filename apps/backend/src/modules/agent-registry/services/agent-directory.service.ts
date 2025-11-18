import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SearchAgentsDto, AgentDirectoryEntryDto, AgentDirectoryResponseDto } from '../dto';
import { IAgentMetric } from '../interfaces/agent-registry.interfaces';

@Injectable()
export class AgentDirectoryService {
  private readonly logger = new Logger(AgentDirectoryService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    // Build where clause
    const where: any = {};

    if (searchQuery) {
      where.OR = [
        { displayName: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { searchableData: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (verifiedOnly) {
      where.isVerified = true;
    }

    if (publicOnly !== undefined) {
      where.isPublic = publicOnly;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [entries, total] = await Promise.all([
      this.prisma.agentDirectoryEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.agentDirectoryEntry.count({ where }),
    ]);

    // Get capabilities for each agent
    const entriesWithCapabilities = await Promise.all(
      entries.map(async (entry) => {
        const registration = await this.prisma.agentRegistration.findUnique({
          where: { agentId: entry.agentId },
          include: {
            capabilities: {
              where: { isActive: true },
            },
          },
        });

        return {
          id: entry.agentId,
          displayName: entry.displayName,
          description: entry.description || undefined,
          category: entry.category || undefined,
          tags: entry.tags,
          isPublic: entry.isPublic,
          isVerified: entry.isVerified,
          rating: entry.rating || 0,
          usageCount: entry.usageCount,
          lastActiveAt: entry.lastActiveAt,
          featured: entry.featured,
          capabilities: registration?.capabilities.map((c) => c.capabilityName) || [],
        };
      }),
    );

    // Filter by capability if specified
    let filteredEntries = entriesWithCapabilities;
    if (capability) {
      filteredEntries = entriesWithCapabilities.filter((e) =>
        e.capabilities.some((c) => c.toLowerCase().includes(capability.toLowerCase())),
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
    const entry = await this.prisma.agentDirectoryEntry.findUnique({
      where: { agentId },
    });

    if (!entry) {
      return null;
    }

    const [agent, registration] = await Promise.all([
      this.prisma.agent.findUnique({
        where: { id: agentId },
      }),
      this.prisma.agentRegistration.findUnique({
        where: { agentId },
        include: {
          capabilities: {
            where: { isActive: true },
          },
        },
      }),
    ]);

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
      capabilities: registration?.capabilities.map((c) => ({
        name: c.capabilityName,
        type: c.capabilityType,
        version: c.version,
        description: c.description,
        verified: c.verificationStatus === 'VERIFIED',
      })) || [],
      metadata: entry.metadata,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  /**
   * Get featured agents
   */
  async getFeaturedAgents(limit: number = 10): Promise<AgentDirectoryEntryDto[]> {
    const entries = await this.prisma.agentDirectoryEntry.findMany({
      where: {
        featured: true,
        isPublic: true,
        isVerified: true,
      },
      take: limit,
      orderBy: { rating: 'desc' },
    });

    return Promise.all(
      entries.map(async (entry) => {
        const registration = await this.prisma.agentRegistration.findUnique({
          where: { agentId: entry.agentId },
          include: { capabilities: { where: { isActive: true } } },
        });

        return {
          id: entry.agentId,
          displayName: entry.displayName,
          description: entry.description || undefined,
          category: entry.category || undefined,
          tags: entry.tags,
          isPublic: entry.isPublic,
          isVerified: entry.isVerified,
          rating: entry.rating || 0,
          usageCount: entry.usageCount,
          lastActiveAt: entry.lastActiveAt,
          featured: entry.featured,
          capabilities: registration?.capabilities.map((c) => c.capabilityName) || [],
        };
      }),
    );
  }

  /**
   * Update agent rating
   */
  async updateRating(agentId: string, rating: number): Promise<void> {
    await this.prisma.agentDirectoryEntry.update({
      where: { agentId },
      data: { rating },
    });
  }

  /**
   * Increment usage count
   */
  async incrementUsage(agentId: string): Promise<void> {
    await this.prisma.agentDirectoryEntry.update({
      where: { agentId },
      data: {
        usageCount: { increment: 1 },
        lastActiveAt: new Date(),
      },
    });
  }

  /**
   * Record agent metric
   */
  async recordMetric(registrationId: string, metric: IAgentMetric): Promise<void> {
    await this.prisma.agentMetrics.create({
      data: {
        registrationId,
        metricType: metric.type,
        value: metric.value,
        unit: metric.unit,
        tags: metric.tags || {},
      },
    });
  }

  /**
   * Get agent metrics
   */
  async getAgentMetrics(
    registrationId: string,
    metricType?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = { registrationId };

    if (metricType) {
      where.metricType = metricType;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const metrics = await this.prisma.agentMetrics.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    // Aggregate metrics by type
    const aggregated: Record<string, any> = {};

    metrics.forEach((metric) => {
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
      raw: metrics.slice(0, 100), // Return last 100 raw metrics
    };
  }

  /**
   * Get directory statistics
   */
  async getDirectoryStats() {
    const [total, verified, public_, categories] = await Promise.all([
      this.prisma.agentDirectoryEntry.count(),
      this.prisma.agentDirectoryEntry.count({ where: { isVerified: true } }),
      this.prisma.agentDirectoryEntry.count({ where: { isPublic: true } }),
      this.prisma.agentDirectoryEntry.groupBy({
        by: ['category'],
        _count: true,
      }),
    ]);

    const online = await this.prisma.agentRegistration.count({
      where: { isOnline: true },
    });

    return {
      totalAgents: total,
      verifiedAgents: verified,
      publicAgents: public_,
      onlineAgents: online,
      categoriesDistribution: categories.map((c) => ({
        category: c.category,
        count: c._count,
      })),
    };
  }
}
