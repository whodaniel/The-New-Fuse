import { Injectable, NotFoundException } from '@nestjs/common';
import { drizzleAgentRepository } from '@the-new-fuse/database';
import { Agent, AgentCapability, AgentStatus, AgentType } from '@the-new-fuse/types';

@Injectable()
export class AgentService {
  constructor() {}

  private transformAgent(agent: any): Agent {
    if (!agent) return null as any;
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

  async createAgent(data: any, userId: string): Promise<Agent> {
    const agentData = {
      ...data,
      userId,
      roles: data.roles || ['USER'],
      capabilities: data.capabilities || [],
    };

    const agent = await drizzleAgentRepository.create(agentData);
    return this.transformAgent(agent);
  }

  async getAgents(userId: string): Promise<Agent[]> {
    const agents = await drizzleAgentRepository.findByUserId(userId);
    return agents.map((a) => this.transformAgent(a));
  }

  async getAgentById(id: string, userId: string): Promise<Agent | null> {
    const agent = await drizzleAgentRepository.findById(id);
    if (agent && agent.userId === userId) {
      return this.transformAgent(agent);
    }
    return null;
  }

  async createAgentsInTransaction(agents: any[]): Promise<Agent[]> {
    const createdAgents: Agent[] = [];
    for (const agent of agents) {
      const createdAgent = await drizzleAgentRepository.create(agent);
      createdAgents.push(this.transformAgent(createdAgent));
    }
    return createdAgents;
  }

  async updateAgentStatus(id: string, status: string, userId: string): Promise<Agent | null> {
    const agent = await this.getAgentById(id, userId);
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    const updated = await drizzleAgentRepository.updateStatus(id, status);
    return this.transformAgent(updated);
  }

  async getActiveAgents(userId: string): Promise<Agent[]> {
    const agents = await drizzleAgentRepository.findByStatusAndUserId('ACTIVE', userId);
    return agents.map((a) => this.transformAgent(a));
  }

  async getAgentsByCapability(capability: string, userId: string): Promise<Agent[]> {
    const agents = await drizzleAgentRepository.findByCapability(capability, userId);
    return agents.map((a) => this.transformAgent(a));
  }

  async updateAgent(id: string, data: any, userId: string): Promise<Agent | null> {
    const agent = await this.getAgentById(id, userId);
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    const updated = await drizzleAgentRepository.update(id, data);
    return this.transformAgent(updated);
  }

  async deleteAgent(id: string, userId: string): Promise<boolean> {
    try {
      const agent = await this.getAgentById(id, userId);
      if (!agent) {
        throw new NotFoundException('Agent not found');
      }
      return await drizzleAgentRepository.hardDelete(id);
    } catch (error) {
      console.error(`Error deleting agent: ${error}`);
      return false;
    }
  }
}
