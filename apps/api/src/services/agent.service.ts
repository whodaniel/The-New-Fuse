import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AgentRepository } from '@the-new-fuse/database';
import { CreateAgentDto, UpdateAgentDto, AgentResponseDto, AgentStatus, AgentType } from '@the-new-fuse/types';

@Injectable()
export class AgentService {
  constructor(private agentRepository: AgentRepository) {}

  async createAgent(createAgentDto: CreateAgentDto): Promise<AgentResponseDto> {
    try {
      const agentData = {
        ...createAgentDto,
        status: AgentStatus.INACTIVE,
        // Ensure userId is provided
        userId: createAgentDto.userId || '', // This should come from authenticated user context
      };

      const agent = await this.agentRepository.create(agentData);
      return new AgentResponseDto(agent);
    } catch (error) {
      throw new BadRequestException(`Failed to create agent: ${error.message}`);
    }
  }

  async findAllAgents(userId?: string, filters?: any): Promise<AgentResponseDto[]> {
    try {
      const whereClause = {
        ...filters,
        ...(userId && { userId })
      };

      const agents = await this.agentRepository.findMany(whereClause);
      return agents.map(agent => new AgentResponseDto({
        ...agent,
        lastActive: agent.metadata?.lastActive
      }));
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
        lastActive: agent.metadata?.lastActive
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

      const agent = await this.agentRepository.update(id, updateAgentDto);
      return new AgentResponseDto({
        ...agent,
        lastActive: agent.metadata?.lastActive
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

  async findAgentsByType(type: AgentType): Promise<AgentResponseDto[]> {
    try {
      const agents = await this.agentRepository.findByType(type);
      return agents.map(agent => new AgentResponseDto({
        ...agent,
        lastActive: agent.metadata?.lastActive
      }));
    } catch (error) {
      throw new BadRequestException(`Failed to fetch agents by type: ${error.message}`);
    }
  }

  async findAgentsByStatus(status: AgentStatus): Promise<AgentResponseDto[]> {
    try {
      const agents = await this.agentRepository.findByStatus(status);
      return agents.map(agent => new AgentResponseDto({
        ...agent,
        lastActive: agent.metadata?.lastActive
      }));
    } catch (error) {
      throw new BadRequestException(`Failed to fetch agents by status: ${error.message}`);
    }
  }

  async findAgentsByUserId(userId: string): Promise<AgentResponseDto[]> {
    try {
      const agents = await this.agentRepository.findByUserId(userId);
      return agents.map(agent => new AgentResponseDto({
        ...agent,
        lastActive: agent.metadata?.lastActive
      }));
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

      const agent = await this.agentRepository.updateStatus(id, status);
      return new AgentResponseDto({
        ...agent,
        lastActive: agent.metadata?.lastActive
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

  async searchAgents(userId: string, query: string): Promise<AgentResponseDto[]> {
    try {
      const agents = await this.agentRepository.findMany({
        userId,
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
      });

      return agents.map(agent => new AgentResponseDto({
        ...agent,
        lastActive: agent.metadata?.lastActive
      }));
    } catch (error) {
      throw new BadRequestException(`Failed to search agents: ${error.message}`);
    }
  }
}
