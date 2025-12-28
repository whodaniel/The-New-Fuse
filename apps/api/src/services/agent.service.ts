import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AgentRepository } from '@the-new-fuse/database';
import { Prisma } from '@the-new-fuse/database/generated/prisma';
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
  constructor(private agentRepository: AgentRepository) {}

  async createAgent(createAgentDto: CreateAgentDto, userId: string): Promise<AgentResponseDto> {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required to create an agent');
      }

      const agentData: Prisma.AgentCreateInput = {
        name: createAgentDto.name,
        type: createAgentDto.type as any,
        description: createAgentDto.description,
        systemPrompt: createAgentDto.systemPrompt,
        capabilities:
          createAgentDto.capabilities as unknown as Prisma.AgentCreateInput['capabilities'],
        config: createAgentDto.configuration as Prisma.InputJsonValue,
        provider: createAgentDto.provider,
        status: AgentStatus.INACTIVE as any,
        user: {
          connect: { id: userId },
        },
      };

      const agent = await this.agentRepository.create(agentData);
      return {
        ...agent,
        type: agent.type as AgentType,
        status: agent.status as AgentStatus,
        capabilities: agent.capabilities
          ? agent.capabilities.map((cap) => cap as AgentCapability)
          : [],
        lastActive: new Date(),
      } as AgentResponseDto;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to create agent: ${errorMessage}`);
    }
  }

  async findAllAgents(
    userId?: string,
    filters?: any,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: AgentResponseDto[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;
      const whereClause: Prisma.AgentWhereInput = {
        ...filters,
        ...(userId && { userId }),
        deletedAt: null,
      };

      const agents = await this.agentRepository.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      const total = agents.length; // Approximate total

      return {
        data: agents.map(
          (agent) =>
            ({
              ...agent,
              type: agent.type as AgentType,
              status: agent.status as AgentStatus,
              capabilities: agent.capabilities
                ? agent.capabilities.map((cap) => cap as AgentCapability)
                : [],
              lastActive: new Date(),
            }) as AgentResponseDto
        ),
        total,
        page,
        limit,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch agents: ${errorMessage}`);
    }
  }

  async findAgentById(id: string): Promise<AgentResponseDto> {
    try {
      const agent = await this.agentRepository.findById(id);
      if (!agent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      return {
        ...agent,
        type: agent.type as AgentType,
        status: agent.status as AgentStatus,
        capabilities: agent.capabilities
          ? agent.capabilities.map((cap) => cap as AgentCapability)
          : [],
        lastActive: new Date(),
      } as AgentResponseDto;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch agent: ${errorMessage}`);
    }
  }

  async updateAgent(id: string, updateAgentDto: UpdateAgentDto): Promise<AgentResponseDto> {
    try {
      const existingAgent = await this.agentRepository.findById(id);
      if (!existingAgent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      const updateData: Prisma.AgentUpdateInput = {
        name: updateAgentDto.name,
        description: updateAgentDto.description,
        systemPrompt: updateAgentDto.systemPrompt,
        config: updateAgentDto.configuration as Prisma.InputJsonValue,
        // If metadata needs to be stored, it should go in config or a specific JSON field
        // role: updateAgentDto.role, // Field does not exist in Prisma schema
        type: updateAgentDto.type as any,
        status: updateAgentDto.status as any,
        capabilities: updateAgentDto.capabilities as any,
      };

      const agent = await this.agentRepository.update(id, updateData);
      return {
        ...agent,
        type: agent.type as AgentType,
        status: agent.status as AgentStatus,
        capabilities: agent.capabilities
          ? agent.capabilities.map((cap) => cap as AgentCapability)
          : [],
        lastActive: new Date(),
      } as AgentResponseDto;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to update agent: ${errorMessage}`);
    }
  }

  async deleteAgent(id: string): Promise<void> {
    try {
      const existingAgent = await this.agentRepository.findById(id);
      if (!existingAgent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      await this.agentRepository.delete(id);
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
      const agents = await this.agentRepository.findByType(type as any);
      const total = agents.length;

      return {
        data: agents.map(
          (agent) =>
            ({
              ...agent,
              type: agent.type as AgentType,
              status: agent.status as AgentStatus,
              capabilities: agent.capabilities
                ? agent.capabilities.map((cap) => cap as AgentCapability)
                : [],
              lastActive: new Date(),
            }) as AgentResponseDto
        ),
        total: total as number,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch agents by type: ${errorMessage}`);
    }
  }

  async findAgentsByStatus(status: AgentStatus): Promise<AgentResponseDto[]> {
    try {
      const agents = await this.agentRepository.findByStatus(status as any);
      return agents.map(
        (agent) =>
          ({
            ...agent,
            type: agent.type as AgentType,
            status: agent.status as AgentStatus,
            capabilities: agent.capabilities
              ? agent.capabilities.map((cap) => cap as AgentCapability)
              : [],
            lastActive: new Date(),
          }) as AgentResponseDto
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch agents by status: ${errorMessage}`);
    }
  }

  async findAgentsByUserId(
    userId: string,
    _page: number = 1,
    _limit: number = 50
  ): Promise<{ data: AgentResponseDto[]; total: number }> {
    try {
      const agents = await this.agentRepository.findByUserId(userId);
      const total = agents.length;

      return {
        data: agents.map(
          (agent) =>
            ({
              ...agent,
              type: agent.type as AgentType,
              status: agent.status as AgentStatus,
              capabilities: agent.capabilities
                ? agent.capabilities.map((cap) => cap as AgentCapability)
                : [],
              lastActive: new Date(),
            }) as AgentResponseDto
        ),
        total,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch user agents: ${errorMessage}`);
    }
  }

  async updateAgentStatus(id: string, status: AgentStatus): Promise<AgentResponseDto> {
    try {
      const existingAgent = await this.agentRepository.findById(id);
      if (!existingAgent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      const agent = await this.agentRepository.updateStatus(id, status as any); // This cast is necessary due to type mismatch
      return {
        ...agent,
        type: agent.type as AgentType,
        status: agent.status as AgentStatus,
        capabilities: agent.capabilities
          ? agent.capabilities.map((cap) => cap as AgentCapability)
          : [],
        lastActive: new Date(),
      } as AgentResponseDto;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to update agent status: ${errorMessage}`);
    }
  }

  async getActiveAgents(): Promise<AgentResponseDto[]> {
    return this.findAgentsByStatus(AgentStatus.ACTIVE);
  }

  async getAgentStats(id: string): Promise<any> {
    try {
      const stats = await this.agentRepository.getAgentStats(id);
      if (!stats) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }
      return stats;
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
      return await this.agentRepository.countByType();
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
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: AgentResponseDto[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const whereClause: Prisma.AgentWhereInput = {
        userId,
        deletedAt: null,
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      };

      const agents = await this.agentRepository.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      });
      const total = agents.length;

      return {
        data: agents.map(
          (agent) =>
            ({
              ...agent,
              type: agent.type as AgentType,
              status: agent.status as AgentStatus,
              capabilities: agent.capabilities
                ? agent.capabilities.map((cap) => cap as AgentCapability)
                : [],
              lastActive: new Date(),
            }) as AgentResponseDto
        ),
        total,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to search agents: ${errorMessage}`);
    }
  }
}
