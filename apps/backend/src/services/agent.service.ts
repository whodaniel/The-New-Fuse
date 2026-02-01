import { Injectable } from '@nestjs/common';
import { drizzleAgentRepository } from '@the-new-fuse/database';
import { CreateAgentDto, UpdateAgentDto } from '@the-new-fuse/types';

@Injectable()
export class AgentService {
  constructor() {}

  async createAgent(data: CreateAgentDto, userId: string): Promise<any> {
    const agentData = {
      name: data.name,
      type: data.type,
      description: data.description,
      systemPrompt: data.systemPrompt,
      capabilities: (data.capabilities || []) as string[],
      config: data.configuration || {},
      provider: data.provider || 'default',
      userId,
      status: 'INACTIVE',
    };

    return drizzleAgentRepository.create(agentData);
  }

  async getAgents(userId: string): Promise<any[]> {
    return drizzleAgentRepository.findByUserId(userId);
  }

  async getAgentById(id: string, userId: string): Promise<any | null> {
    const agent = await drizzleAgentRepository.findById(id, userId);
    if (!agent) {
      return null;
    }
    return agent;
  }

  async updateAgentStatus(id: string, status: string, userId: string): Promise<any | null> {
    const agent = await this.getAgentById(id, userId);
    if (!agent) {
      throw new Error('Agent not found');
    }
    return drizzleAgentRepository.updateStatus(id, status);
  }

  async updateAgent(id: string, data: UpdateAgentDto, userId: string): Promise<any> {
    const agent = await this.getAgentById(id, userId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    const updateData: any = {
      ...data,
    };

    return drizzleAgentRepository.update(id, userId, updateData);
  }

  async deleteAgent(id: string, userId: string): Promise<any> {
    const agent = await this.getAgentById(id, userId);
    if (!agent) {
      throw new Error('Agent not found');
    }
    await drizzleAgentRepository.hardDelete(id, userId);
    return agent;
  }

  // transformToDto not strictly needed if we return the raw object which matches mostly,
  // or the controller handles it.
  // Keeping it simplistic for now.
}
