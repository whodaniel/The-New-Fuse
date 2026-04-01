/**
 * Agent Service - Updated for Drizzle ORM compatibility
 * Manages AI agent lifecycle and operations.
 * 
 * Note: This service integrates with the 'Agent Swarm' modules in apps/casin8-games/swarm
 * to provide agent crafting (strategy profiles) and nurturing (performance tracking)
 * scoped to the user's Workspace context.
 */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database';
import {
  AgentCapability,
  AgentResponseDto,
  AgentStatus,
  AgentType,
  CreateAgentDto,
  UpdateAgentDto,
} from '@the-new-fuse/types';

@Injectable()
export class AgentService {
  constructor(private db: DatabaseService) {}

  private get agentRepository() {
    return this.db.agents;
  }

  async createAgent(createAgentDto: CreateAgentDto, userId: string): Promise<AgentResponseDto> {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required to create an agent');
      }

      const metadataInput = this.normalizeMetadataInput(createAgentDto.metadata);

      const agentData: any = {
        name: createAgentDto.name,
        type: createAgentDto.type as any,
        description: createAgentDto.description,
        systemPrompt: createAgentDto.systemPrompt,
        capabilities: createAgentDto.capabilities as any,
        config: createAgentDto.configuration as any,
        provider: createAgentDto.provider,
        status: AgentStatus.INACTIVE as any,
        userId: userId,
      };

      const agent = await this.agentRepository.create(agentData);
      if (metadataInput) {
        await this.agentRepository.upsertMetadata(agent.id, { metadata: metadataInput });
      }
      return this.mapAgentToResponse({ ...agent, metadata: metadataInput });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to create agent: ${errorMessage}`);
    }
  }

  async findAllAgents(
    userId?: string,
    _filters?: any,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: AgentResponseDto[]; total: number; page: number; limit: number }> {
    try {
      let agents: any[];

      if (userId) {
        const result = await this.agentRepository.findWithPagination(userId, page, limit);
        const enriched = await this.attachMetadata(result.data);
        return {
          data: enriched.map((agent: any) => this.mapAgentToResponse(agent)),
          total: result.total,
          page,
          limit,
        };
      } else {
        // Fallback for system-level or if userId is not provided (should ideally be avoided)
        throw new BadRequestException('userId is required to fetch agents');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch agents: ${errorMessage}`);
    }
  }

  async findAgentById(id: string, userId: string): Promise<AgentResponseDto> {
    try {
      const agent = await this.agentRepository.findByIdWithMetadata(id, userId);
      if (!agent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      return this.mapAgentToResponse({
        ...agent,
        metadata: this.extractMetadataValue(agent.metadata),
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch agent: ${errorMessage}`);
    }
  }

  async updateAgent(
    id: string,
    updateAgentDto: UpdateAgentDto,
    userId: string
  ): Promise<AgentResponseDto> {
    try {
      const existingAgent = await this.agentRepository.findByIdWithMetadata(id, userId);
      if (!existingAgent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      const updateData: any = {};
      if (updateAgentDto.name !== undefined) updateData.name = updateAgentDto.name;
      if (updateAgentDto.description !== undefined)
        updateData.description = updateAgentDto.description;
      if (updateAgentDto.systemPrompt !== undefined)
        updateData.systemPrompt = updateAgentDto.systemPrompt;
      if (updateAgentDto.configuration !== undefined)
        updateData.config = updateAgentDto.configuration;
      if (updateAgentDto.type !== undefined) updateData.type = updateAgentDto.type;
      if (updateAgentDto.status !== undefined) updateData.status = updateAgentDto.status;
      if (updateAgentDto.capabilities !== undefined)
        updateData.capabilities = updateAgentDto.capabilities;

      const agent = await this.agentRepository.update(id, userId, updateData);
      if (!agent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }
      const metadataInput = this.normalizeMetadataInput(updateAgentDto.metadata);
      const existingMetadata = this.extractMetadataValue(existingAgent.metadata);
      const mergedMetadata = metadataInput
        ? { ...(existingMetadata || {}), ...metadataInput }
        : existingMetadata;
      if (metadataInput) {
        await this.agentRepository.upsertMetadata(id, {
          metadata: mergedMetadata,
        });
      }
      return this.mapAgentToResponse({ ...agent, metadata: mergedMetadata });
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to update agent: ${errorMessage}`);
    }
  }

  async deleteAgent(id: string, userId: string): Promise<void> {
    try {
      const existingAgent = await this.agentRepository.findById(id, userId);
      if (!existingAgent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      await this.agentRepository.softDelete(id, userId);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to delete agent: ${errorMessage}`);
    }
  }

  async findAgentsByType(
    type: AgentType,
    userId: string,
    _page: number = 1,
    _limit: number = 50
  ): Promise<{ data: AgentResponseDto[]; total: number }> {
    try {
      // Use search to filter by type since there's no direct findByType
      const agents = await this.agentRepository.findAll(userId, 100);
      const enriched = await this.attachMetadata(agents);
      const filteredAgents = enriched.filter((a: any) => a.type === type);

      return {
        data: filteredAgents.map((agent: any) => this.mapAgentToResponse(agent)),
        total: filteredAgents.length,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch agents by type: ${errorMessage}`);
    }
  }

  async findAgentsByStatus(status: AgentStatus, userId: string): Promise<AgentResponseDto[]> {
    try {
      // Filter by status from all agents
      const agents = await this.agentRepository.findAll(userId, 100);
      const enriched = await this.attachMetadata(agents);
      const filteredAgents = enriched.filter((a: any) => a.status === status);

      return filteredAgents.map((agent: any) => this.mapAgentToResponse(agent));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch agents by status: ${errorMessage}`);
    }
  }

  async findAgentsByUserId(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: AgentResponseDto[]; total: number }> {
    try {
      const result = await this.agentRepository.findWithPagination(userId, page, limit);
      const enriched = await this.attachMetadata(result.data);

      return {
        data: enriched.map((agent: any) => this.mapAgentToResponse(agent)),
        total: result.total,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch user agents: ${errorMessage}`);
    }
  }

  async updateAgentStatus(
    id: string,
    status: AgentStatus,
    userId: string
  ): Promise<AgentResponseDto> {
    try {
      const existingAgent = await this.agentRepository.findById(id, userId);
      if (!existingAgent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      const agent = await this.agentRepository.updateStatus(id, status as any);
      if (!agent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }
      return this.mapAgentToResponse(agent);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to update agent status: ${errorMessage}`);
    }
  }

  async getActiveAgents(userId: string): Promise<AgentResponseDto[]> {
    const agents = await this.agentRepository.findActive(userId);
    const enriched = await this.attachMetadata(agents);
    return enriched.map((agent: any) => this.mapAgentToResponse(agent));
  }

  async getAgentStats(id: string, userId: string): Promise<any> {
    try {
      const agent = await this.agentRepository.findById(id, userId);
      if (!agent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      // Return basic stats derived from the agent
      return {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        capabilities: agent.capabilities || [],
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch agent stats: ${errorMessage}`);
    }
  }

  async getAgentTypeCounts(_userId: string): Promise<Record<string, number>> {
    try {
      const statusCounts = await this.agentRepository.countByStatus();
      return statusCounts.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item.count;
        return acc;
      }, {});
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch agent type counts: ${errorMessage}`);
    }
  }

  async activateAgent(id: string, userId: string): Promise<AgentResponseDto> {
    return this.updateAgentStatus(id, AgentStatus.ACTIVE, userId);
  }

  async deactivateAgent(id: string, userId: string): Promise<AgentResponseDto> {
    return this.updateAgentStatus(id, AgentStatus.INACTIVE, userId);
  }

  async pauseAgent(id: string, userId: string): Promise<AgentResponseDto> {
    return this.updateAgentStatus(id, AgentStatus.IDLE, userId);
  }

  async markAgentBusy(id: string, userId: string): Promise<AgentResponseDto> {
    return this.updateAgentStatus(id, AgentStatus.BUSY, userId);
  }

  async markAgentError(id: string, userId: string): Promise<AgentResponseDto> {
    return this.updateAgentStatus(id, AgentStatus.ERROR, userId);
  }

  async deployAgent(
    id: string,
    userId: string,
    target: 'cloud' | 'local' | 'hybrid' = 'cloud'
  ): Promise<{
    agent: AgentResponseDto;
    deployment: {
      status: 'deployed';
      target: 'cloud' | 'local' | 'hybrid';
      orchestrator: 'kubernetes' | 'docker' | 'hybrid';
      deployedAt: string;
    };
  }> {
    const agent = await this.activateAgent(id, userId);
    const orchestrator =
      target === 'local' ? 'docker' : target === 'hybrid' ? 'hybrid' : 'kubernetes';

    return {
      agent,
      deployment: {
        status: 'deployed',
        target,
        orchestrator,
        deployedAt: new Date().toISOString(),
      },
    };
  }

  async searchAgents(
    userId: string,
    query: string,
    _page: number = 1,
    _limit: number = 50
  ): Promise<{ data: AgentResponseDto[]; total: number }> {
    try {
      const agents = await this.agentRepository.search(query, userId);
      const enriched = await this.attachMetadata(agents);

      return {
        data: enriched.map((agent: any) => this.mapAgentToResponse(agent)),
        total: enriched.length,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to search agents: ${errorMessage}`);
    }
  }

  /**
   * Update agent profile (self-identification)
   * Allows agents to update their own profile information
   */
  async updateAgentProfile(id: string, profileDto: any, userId: string): Promise<AgentResponseDto> {
    try {
      const existingAgent = await this.agentRepository.findById(id, userId);
      if (!existingAgent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      // Merge existing profile with new profile data
      const currentProfile = (existingAgent as any).profile || {};
      const newProfile = {
        ...currentProfile,
        ...profileDto,
        lastUpdated: new Date().toISOString(),
      };

      const agent = await this.agentRepository.update(id, userId, {
        profile: newProfile,
      });

      if (!agent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }
      return this.mapAgentToResponse(agent);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to update agent profile: ${errorMessage}`);
    }
  }

  private mapAgentToResponse(agent: any): AgentResponseDto {
    const metadata = this.extractMetadataValue(agent?.metadata);
    return {
      ...agent,
      type: agent.type as AgentType,
      status: agent.status as AgentStatus,
      capabilities: agent.capabilities
        ? agent.capabilities.map((cap: any) => cap as AgentCapability)
        : [],
      lastActive: agent.lastActiveAt || new Date(),
      metadata,
    } as AgentResponseDto;
  }

  private normalizeMetadataInput(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private extractMetadataValue(value: any): Record<string, unknown> | undefined {
    if (!value) return undefined;
    if (typeof value === 'object' && 'metadata' in value) {
      const candidate = (value as { metadata?: unknown }).metadata;
      if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
        return candidate as Record<string, unknown>;
      }
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return undefined;
  }

  private async attachMetadata(agents: any[]): Promise<any[]> {
    if (!agents.length) return agents;
    const agentIds = agents.map((agent: any) => agent.id).filter(Boolean);
    if (!agentIds.length) return agents;
    const metadataRows = await this.agentRepository.findMetadataByAgentIds(agentIds);
    const metadataById = new Map(metadataRows.map((row: any) => [row.agentId, row.metadata]));

    return agents.map((agent: any) => {
      const existing = this.extractMetadataValue(agent?.metadata);
      const metadata = existing ?? metadataById.get(agent.id);
      return {
        ...agent,
        metadata,
      };
    });
  }
}
