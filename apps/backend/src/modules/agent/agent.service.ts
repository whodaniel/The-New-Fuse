import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { drizzleAgentRepository } from '@the-new-fuse/database';
import {
  Agent,
  AgentCapability,
  AgentStatus,
  AgentType,
  CreateAgentDto,
  UpdateAgentDto,
} from '@the-new-fuse/types';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  private transformAgent(agent: any): Agent {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description || undefined,
      systemPrompt: agent.systemPrompt || undefined,
      capabilities: ((agent.capabilities as string[]) || []).map((cap) => cap as AgentCapability),
      status: agent.status as AgentStatus,
      configuration: agent.config as any,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      type: agent.type as AgentType,
    };
  }

  async createAgent(data: CreateAgentDto, userId: string): Promise<Agent> {
    try {
      // Check for existing agent with same name
      const existingAgent = await drizzleAgentRepository.findByNameAndUserId(data.name, userId);

      if (existingAgent) {
        throw new ConflictException(`Agent with name "${data.name}" already exists`);
      }

      // Create the agent
      const agent = await drizzleAgentRepository.create({
        name: data.name,
        type: data.type || 'ASSISTANT',
        description: data.description,
        systemPrompt: data.systemPrompt,
        capabilities: data.capabilities || [],
        status: AgentStatus.INACTIVE,
        config: data.configuration as any,
        provider: data.provider || 'default',
        userId,
      });

      this.logger.log(`Created agent: ${agent.id} (${agent.name})`);
      return this.transformAgent(agent);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create agent: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to create agent');
    }
  }

  async getAgents(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: Agent[]; pagination: any }> {
    try {
      const { data, total } = await drizzleAgentRepository.findWithPagination(userId, page, limit);

      return {
        data: data.map((a) => this.transformAgent(a)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get agents: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to retrieve agents');
    }
  }

  async getAgentById(id: string, userId: string): Promise<Agent> {
    const agent = await drizzleAgentRepository.findById(id);

    if (!agent || agent.userId !== userId) {
      throw new NotFoundException(`Agent with id "${id}" not found`);
    }

    return this.transformAgent(agent);
  }

  async updateAgent(id: string, updates: UpdateAgentDto, userId: string): Promise<Agent> {
    try {
      // Verify agent exists and belongs to user
      const existingAgent = await drizzleAgentRepository.findById(id);

      if (!existingAgent || existingAgent.userId !== userId) {
        throw new NotFoundException(`Agent with id "${id}" not found`);
      }

      // Check name uniqueness if updating name
      if (updates.name && updates.name !== existingAgent.name) {
        const nameExists = await drizzleAgentRepository.findByNameAndUserId(updates.name, userId);

        if (nameExists && nameExists.id !== id) {
          throw new ConflictException(`Agent with name "${updates.name}" already exists`);
        }
      }

      // Update the agent
      const agent = await drizzleAgentRepository.update(id, {
        ...updates,
        updatedAt: new Date(),
      });

      if (!agent) {
        throw new InternalServerErrorException(`Failed to update agent ${id}`);
      }

      this.logger.log(`Updated agent: ${id}`);
      return this.transformAgent(agent);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update agent ${id}: ${errorMessage}`);
      throw new InternalServerErrorException(`Failed to update agent ${id}`);
    }
  }

  async deleteAgent(id: string, userId: string): Promise<void> {
    try {
      const agent = await this.getAgentById(id, userId);
      await drizzleAgentRepository.softDelete(agent.id);
      this.logger.log(`Deleted agent: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete agent: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to delete agent');
    }
  }

  async getAgentsByCapability(capability: string, userId: string): Promise<Agent[]> {
    try {
      const agents = await drizzleAgentRepository.findByCapability(capability, userId);
      return agents.map((a) => this.transformAgent(a));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get agents by capability: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to retrieve agents by capability');
    }
  }

  async getActiveAgents(userId: string): Promise<Agent[]> {
    try {
      const agents = await drizzleAgentRepository.findByStatusAndUserId(AgentStatus.ACTIVE, userId);
      return agents.map((a) => this.transformAgent(a));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get active agents: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to retrieve active agents');
    }
  }

  async updateAgentStatus(id: string, status: AgentStatus, userId: string): Promise<Agent> {
    await this.getAgentById(id, userId); // Verifies ownership and existence
    try {
      const agent = await drizzleAgentRepository.updateStatus(id, status);
      if (!agent) {
        throw new InternalServerErrorException('Failed to update agent status');
      }
      this.logger.log(`Updated agent status: ${id} -> ${status}`);
      return this.transformAgent(agent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update agent status: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to update agent status');
    }
  }

  async startAgent(id: string, userId: string): Promise<Agent> {
    return this.updateAgentStatus(id, AgentStatus.ACTIVE, userId);
  }

  async stopAgent(id: string, userId: string): Promise<Agent> {
    return this.updateAgentStatus(id, AgentStatus.INACTIVE, userId);
  }

  async getAgentStatus(id: string, userId: string): Promise<{ status: AgentStatus }> {
    const agent = await this.getAgentById(id, userId);
    return { status: agent.status };
  }

  async searchAgents(
    query: { name?: string; type?: AgentType; capability?: AgentCapability },
    userId: string
  ): Promise<Agent[]> {
    try {
      const agents = await drizzleAgentRepository.searchAgents(userId, {
        name: query.name,
        type: query.type,
        capability: query.capability,
      });
      return agents.map((a) => this.transformAgent(a));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to search agents: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to search for agents');
    }
  }
}
