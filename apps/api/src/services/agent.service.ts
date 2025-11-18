import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AgentRepository } from '@the-new-fuse/database';
import { CreateAgentDto, UpdateAgentDto, AgentResponseDto, AgentStatus, AgentType, AgentCapability } from '@the-new-fuse/types';
import { Prisma } from '@the-new-fuse/database/generated/prisma';

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
        capabilities: createAgentDto.capabilities as unknown as Prisma.AgentCreateInput['capabilities'],
        config: createAgentDto.configuration as Prisma.InputJsonValue,
        provider: createAgentDto.provider,
        status: AgentStatus.INACTIVE as any,
        user: {
          connect: { id: userId }
        }
      };

      const agent = await this.agentRepository.create(agentData);
      return new AgentResponseDto({
        ...agent,
        type: agent.type as AgentType,
        status: agent.status as AgentStatus,
        capabilities: agent.capabilities ? agent.capabilities.map(cap => cap as AgentCapability) : [],
        lastActive: new Date(),
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create agent: ${error.message}`);
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
        deletedAt: null
      };

      const [agents, total] = await Promise.all([
        this.agentRepository.findMany({
          ...whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        this.agentRepository.count(whereClause)
      ]);

      return {
        data: agents.map(agent => new AgentResponseDto({
          ...agent,
          type: agent.type as AgentType,
          status: agent.status as AgentStatus,
          capabilities: agent.capabilities ? agent.capabilities.map(cap => cap as AgentCapability) : [],
          lastActive: new Date(),
        })),
        total,
        page,
        limit
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch agents: ${error.message}`);
    }
  }

  async findAgentById(id: string): Promise<AgentResponseDto> {
    try {
      const agent = await this.agentRepository.findById(id);
      if (!agent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      return new AgentResponseDto({
        ...agent,
        type: agent.type as AgentType,
        status: agent.status as AgentStatus,
        capabilities: agent.capabilities ? agent.capabilities.map(cap => cap as AgentCapability) : [],
        lastActive: new Date(),
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch agent: ${error.message}`);
    }
  }

  async updateAgent(id: string, updateAgentDto: UpdateAgentDto): Promise<AgentResponseDto> {
    try {
      const existingAgent = await this.agentRepository.findById(id);
      if (!existingAgent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      const updateData: Prisma.AgentUpdateInput = {
        ...updateAgentDto,
        type: updateAgentDto.type as any, // This cast is necessary due to type mismatch
        status: updateAgentDto.status as any, // This cast is necessary due to type mismatch
        capabilities: updateAgentDto.capabilities ? { set: updateAgentDto.capabilities as any } : undefined,
      };

      const agent = await this.agentRepository.update(id, updateData);
      return new AgentResponseDto({
        ...agent,
        type: agent.type as AgentType,
        status: agent.status as AgentStatus,
        capabilities: agent.capabilities ? agent.capabilities.map(cap => cap as AgentCapability) : [],
        lastActive: new Date(),
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update agent: ${error.message}`);
    }
  }

  async deleteAgent(id: string): Promise<void> {
    try {
      const existingAgent = await this.agentRepository.findById(id);
      if (!existingAgent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      await this.agentRepository.delete(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete agent: ${error.message}`);
    }
  }

  async findAgentsByType(
    type: AgentType,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: AgentResponseDto[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const agents = await this.agentRepository.findByType(type, { skip, take: limit });
      const total = await this.agentRepository.countByType(type);

      return {
        data: agents.map(agent => new AgentResponseDto({
          ...agent,
          type: agent.type as AgentType,
          status: agent.status as AgentStatus,
          capabilities: agent.capabilities ? agent.capabilities.map(cap => cap as AgentCapability) : [],
          lastActive: new Date(),
        })),
        total
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch agents by type: ${error.message}`);
    }
  }

  async findAgentsByStatus(status: AgentStatus): Promise<AgentResponseDto[]> {
    try {
      const agents = await this.agentRepository.findByStatus(status as any);
      return agents.map(agent => new AgentResponseDto({
        ...agent,
        type: agent.type as AgentType,
        status: agent.status as AgentStatus,
        capabilities: agent.capabilities ? agent.capabilities.map(cap => cap as AgentCapability) : [],
        lastActive: new Date(),
      }));
    } catch (error) {
      throw new BadRequestException(`Failed to fetch agents by status: ${error.message}`);
    }
  }

  async findAgentsByUserId(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: AgentResponseDto[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const [agents, total] = await Promise.all([
        this.agentRepository.findByUserId(userId, { skip, take: limit }),
        this.agentRepository.countByUserId(userId)
      ]);

      return {
        data: agents.map(agent => new AgentResponseDto({
          ...agent,
          type: agent.type as AgentType,
          status: agent.status as AgentStatus,
          capabilities: agent.capabilities ? agent.capabilities.map(cap => cap as AgentCapability) : [],
          lastActive: new Date(),
        })),
        total
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch user agents: ${error.message}`);
    }
  }

  async updateAgentStatus(id: string, status: AgentStatus): Promise<AgentResponseDto> {
    try {
      const existingAgent = await this.agentRepository.findById(id);
      if (!existingAgent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      const agent = await this.agentRepository.updateStatus(id, status as any); // This cast is necessary due to type mismatch
      return new AgentResponseDto({
        ...agent,
        type: agent.type as AgentType,
        status: agent.status as AgentStatus,
        capabilities: agent.capabilities ? agent.capabilities.map(cap => cap as AgentCapability) : [],
        lastActive: new Date(),
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update agent status: ${error.message}`);
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch agent stats: ${error.message}`);
    }
  }

  async getAgentTypeCounts(): Promise<Record<string, number>> {
    try {
      return await this.agentRepository.countByType();
    } catch (error) {
      throw new BadRequestException(`Failed to fetch agent type counts: ${error.message}`);
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
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      };

      const [agents, total] = await Promise.all([
        this.agentRepository.findMany({
          ...whereClause,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' }
        }),
        this.agentRepository.count(whereClause)
      ]);

      return {
        data: agents.map(agent => new AgentResponseDto({
          ...agent,
          type: agent.type as AgentType,
          status: agent.status as AgentStatus,
          capabilities: agent.capabilities ? agent.capabilities.map(cap => cap as AgentCapability) : [],
          lastActive: new Date(),
        })),
        total
      };
    } catch (error) {
      throw new BadRequestException(`Failed to search agents: ${error.message}`);
    }
  }
}
