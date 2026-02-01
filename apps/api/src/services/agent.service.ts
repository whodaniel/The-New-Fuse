/**
 * Agent Service - Updated for Drizzle ORM compatibility
 * Manages AI agent lifecycle and operations
 */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
      return this.mapAgentToResponse(agent);
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
        return {
          data: result.data.map((agent: any) => this.mapAgentToResponse(agent)),
          total: result.total,
          page,
          limit,
        };
      } else {
        // Use system-level access for admin operations
        const result = await this.agentRepository.findAllSystem(page, limit);
        agents = result.data;
      }

      return {
        data: agents.map((agent: any) => this.mapAgentToResponse(agent)),
        total: agents.length,
        page,
        limit,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch agents: ${errorMessage}`);
    }
  }

  async findAgentById(id: string, userId?: string): Promise<AgentResponseDto> {
    try {
      const agent = userId
        ? await this.agentRepository.findById(id, userId)
        : await this.agentRepository.findByIdSystem(id);
      if (!agent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      return this.mapAgentToResponse(agent);
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
    userId?: string
  ): Promise<AgentResponseDto> {
    try {
      const existingAgent = await this.agentRepository.findByIdSystem(id);
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

      // Use the existing agent's userId if not provided
      const effectiveUserId = userId || existingAgent.userId;
      const agent = await this.agentRepository.update(id, effectiveUserId, updateData);
      if (!agent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }
      return this.mapAgentToResponse(agent);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to update agent: ${errorMessage}`);
    }
  }

  async deleteAgent(id: string, userId?: string): Promise<void> {
    try {
      const existingAgent = await this.agentRepository.findByIdSystem(id);
      if (!existingAgent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      // Use the existing agent's userId if not provided
      const effectiveUserId = userId || existingAgent.userId;
      await this.agentRepository.softDelete(id, effectiveUserId);
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
    _page: number = 1,
    _limit: number = 50
  ): Promise<{ data: AgentResponseDto[]; total: number }> {
    try {
      // Use system-level access to filter by type since there's no direct findByType
      const result = await this.agentRepository.findAllSystem(1, 100);
      const filteredAgents = result.data.filter((a: any) => a.type === type);

      return {
        data: filteredAgents.map((agent: any) => this.mapAgentToResponse(agent)),
        total: filteredAgents.length,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch agents by type: ${errorMessage}`);
    }
  }

  async findAgentsByStatus(status: AgentStatus): Promise<AgentResponseDto[]> {
    try {
      // Use system-level access to filter by status
      const result = await this.agentRepository.findAllSystem(1, 100);
      const filteredAgents = result.data.filter((a: any) => a.status === status);

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

      return {
        data: result.data.map((agent: any) => this.mapAgentToResponse(agent)),
        total: result.total,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch user agents: ${errorMessage}`);
    }
  }

  async updateAgentStatus(id: string, status: AgentStatus): Promise<AgentResponseDto> {
    try {
      const existingAgent = await this.agentRepository.findByIdSystem(id);
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

  async getActiveAgents(userId?: string): Promise<AgentResponseDto[]> {
    // If userId is provided, use findActiveByUser, otherwise filter from system-level
    if (userId) {
      const agents = await this.agentRepository.findActive(userId);
      return agents.map((agent: any) => this.mapAgentToResponse(agent));
    }
    // For system-level, get all active from findAllSystem and filter
    const result = await this.agentRepository.findAllSystem(1, 100);
    const activeAgents = result.data.filter((a: any) => a.status === 'ACTIVE');
    return activeAgents.map((agent: any) => this.mapAgentToResponse(agent));
  }

  async getAgentRegistry(): Promise<AgentResponseDto[]> {
    try {
      // Fetch all agents to create a registry/catalog view using system-level access
      const result = await this.agentRepository.findAllSystem(1, 1000);
      return result.data.map((agent: any) => this.mapAgentToResponse(agent));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch agent registry: ${errorMessage}`);
    }
  }

  async getAgentStats(id: string): Promise<any> {
    try {
      const agent = await this.agentRepository.findByIdSystem(id);
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

  async getAgentTypeCounts(): Promise<Record<string, number>> {
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

  async activateAgent(id: string): Promise<AgentResponseDto> {
    return this.updateAgentStatus(id, AgentStatus.ACTIVE);
  }

  async deactivateAgent(id: string): Promise<AgentResponseDto> {
    return this.updateAgentStatus(id, AgentStatus.INACTIVE);
  }

  async pauseAgent(id: string): Promise<AgentResponseDto> {
    return this.updateAgentStatus(id, AgentStatus.IDLE);
  }

  async markAgentBusy(id: string): Promise<AgentResponseDto> {
    return this.updateAgentStatus(id, AgentStatus.BUSY);
  }

  async markAgentError(id: string): Promise<AgentResponseDto> {
    return this.updateAgentStatus(id, AgentStatus.ERROR);
  }

  async searchAgents(
    userId: string,
    query: string,
    _page: number = 1,
    _limit: number = 50
  ): Promise<{ data: AgentResponseDto[]; total: number }> {
    try {
      const agents = await this.agentRepository.search(query, userId);

      return {
        data: agents.map((agent: any) => this.mapAgentToResponse(agent)),
        total: agents.length,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to search agents: ${errorMessage}`);
    }
  }

  private mapAgentToResponse(agent: any): AgentResponseDto {
    return {
      ...agent,
      type: agent.type as AgentType,
      status: agent.status as AgentStatus,
      capabilities: agent.capabilities
        ? agent.capabilities.map((cap: any) => cap as AgentCapability)
        : [],
      lastActive: agent.lastActiveAt || new Date(),
    } as AgentResponseDto;
  }
}
