import { Injectable, Logger } from '@nestjs/common';
import { Agent, CreateAgentDto, UpdateAgentDto } from '@the-new-fuse/types';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private agents: Map<string, Agent> = new Map();

  constructor() {}

  async findAll(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async findOne(id: string): Promise<Agent | null> {
    return this.agents.get(id) || null;
  }

  async findById(id: string): Promise<Agent | null> {
    return this.findOne(id);
  }

  async create(createAgentDto: CreateAgentDto): Promise<Agent> {
    const agent: Agent = {
      id: `agent-${Date.now()}`,
      name: createAgentDto.name,
      description: createAgentDto.description || null,
      type: createAgentDto.type,
      capabilities: createAgentDto.capabilities,
      status: 'ACTIVE',
      userId: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      config: createAgentDto.configuration,
    };

    this.agents.set(agent.id, agent);
    this.logger.log(`Created agent: ${agent.name} (${agent.id})`);
    return agent;
  }

  async update(id: string, updateAgentDto: UpdateAgentDto): Promise<Agent | null> {
    const agent = this.agents.get(id);
    if (!agent) {
      return null;
    }

    const updatedAgent: Agent = {
      ...agent,
      ...updateAgentDto,
      updatedAt: new Date(),
    };

    this.agents.set(id, updatedAgent);
    this.logger.log(`Updated agent: ${id}`);
    return updatedAgent;
  }

  async remove(id: string): Promise<boolean> {
    const deleted = this.agents.delete(id);
    if (deleted) {
      this.logger.log(`Removed agent: ${id}`);
    }
    return deleted;
  }

  // Additional methods that might be expected
  async createAgent(createAgentDto: CreateAgentDto): Promise<Agent> {
    return this.create(createAgentDto);
  }

  async getAgentById(id: string): Promise<Agent | null> {
    return this.findById(id);
  }

  async updateAgent(id: string, updateAgentDto: UpdateAgentDto): Promise<Agent | null> {
    return this.update(id, updateAgentDto);
  }

  async deleteAgent(id: string): Promise<boolean> {
    return this.remove(id);
  }

  async getAllAgents(): Promise<Agent[]> {
    return this.findAll();
  }

  async getAgentProfile(id: string): Promise<Agent | null> {
    return this.findById(id);
  }

  async updateAgentProfile(id: string, updateAgentDto: UpdateAgentDto): Promise<Agent | null> {
    return this.update(id, updateAgentDto);
  }
}
