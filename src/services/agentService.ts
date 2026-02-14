import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Agent, AgentStatus, CreateAgentDto, UpdateAgentDto } from '@the-new-fuse/types';
import { DrizzleAgentRepository } from '../../../packages/database/src/drizzle/repositories';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly agentRepository: DrizzleAgentRepository,
    private readonly config: ConfigService
  ) {}

  private transformDrizzleAgent(agent: any): Agent {
    // Explicit type conversion with schema validation
    const transformed: Agent = {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      config: agent.config as Record<string, unknown>,
      userId: agent.userId,
      createdAt: agent.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: agent.updatedAt?.toISOString() || new Date().toISOString(),
      status: agent.status as AgentStatus,
      capabilities: agent.capabilities || [],
      description: agent.description,
      systemPrompt: agent.systemPrompt,
    };

    return transformed;
  }

  async createAgent(data: CreateAgentDto, userId: string): Promise<Agent> {
    try {
      // Check for existing agent with same name
      const existingAgent = await this.agentRepository.findByIdSystem(data.name);
      if (existingAgent) {
        throw new Error(`Agent with name "${data.name}" already exists`);
      }

      const agent = await this.agentRepository.create({
        name: data.name,
        description: data.description,
        systemPrompt: data.systemPrompt,
        capabilities: data.capabilities || [],
        status: AgentStatus.INACTIVE as string,
        configuration: data.configuration,
        userId,
      });

      this.logger.log(`Created agent ${agent.id} (${agent.name})`);
      return this.transformDrizzleAgent(agent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create agent: ${errorMessage}`);
      throw error;
    }
  }

  async getAgents(userId: string): Promise<Agent[]> {
    try {
      const agents = await this.agentRepository.findByUserId(userId);
      return agents.map((agent) => this.transformDrizzleAgent(agent));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get agents: ${errorMessage}`);
      throw error;
    }
  }

  async getAgent(id: string, userId: string): Promise<Agent> {
    try {
      const agent = await this.agentRepository.findById(id, userId);

      if (!agent) {
        throw new Error(`Agent with id "${id}" not found`);
      }

      return this.transformDrizzleAgent(agent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get agent: ${errorMessage}`);
      throw error;
    }
  }

  async updateAgent(id: string, updates: UpdateAgentDto, userId: string): Promise<Agent> {
    try {
      // Check if agent exists
      const existingAgent = await this.agentRepository.findById(id, userId);

      if (!existingAgent) {
        throw new Error(`Agent with id "${id}" not found`);
      }

      // Check if new name conflicts with existing agent
      if (updates.name && updates.name !== existingAgent.name) {
        const nameExists = (await this.agentRepository.findAll(userId)).find(
          (a) => a.name === updates.name
        );

        if (nameExists) {
          throw new Error(`Agent with name "${updates.name}" already exists`);
        }
      }

      const agent = await this.agentRepository.update(id, updates as any);

      this.logger.log(`Updated agent ${id}`);
      return this.transformDrizzleAgent(agent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update agent: ${errorMessage}`);
      throw error;
    }
  }

  async deleteAgent(id: string, userId: string): Promise<void> {
    try {
      await this.agentRepository.update(id, { deletedAt: new Date() } as any);
      this.logger.log(`Deleted agent ${id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete agent: ${errorMessage}`);
      throw error;
    }
  }

  async getAgentsByCapability(capability: string, userId: string): Promise<Agent[]> {
    try {
      const agents = await this.agentRepository.findAll(userId);
      const filteredAgents = agents.filter((agent) => agent.capabilities?.includes(capability));
      return filteredAgents.map((agent) => this.transformDrizzleAgent(agent));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get agents by capability: ${errorMessage}`);
      throw error;
    }
  }

  async getActiveAgents(userId: string): Promise<Agent[]> {
    try {
      const agents = await this.agentRepository.findActive(userId);
      return agents.map((agent) => this.transformDrizzleAgent(agent));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get active agents: ${errorMessage}`);
      throw error;
    }
  }

  async updateAgentStatus(id: string, status: AgentStatus, userId: string): Promise<Agent> {
    try {
      const agent = await this.agentRepository.update(id, { status: status as any });
      this.logger.log(`Updated agent status ${id} -> ${status}`);
      return this.transformDrizzleAgent(agent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update agent status: ${errorMessage}`);
      throw error;
    }
  }
}
