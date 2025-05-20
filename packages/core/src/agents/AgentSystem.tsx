import { Agent, AgentStatus } from '@the-new-fuse/types';
import { Redis } from 'redis';
import { Logger } from 'winston';
import crypto from 'crypto';

export class AgentSystem {
  private agents: Map<string, Agent> = new Map();

  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger
  ) {}

  async initialize(): Promise<void> {
    try {
      await this.redis.connect();
    } catch (error) {
      this.logger.error('Failed to initialize agent system', error);
      throw error;
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'status'>): Promise<Agent> {
    const id = crypto.randomUUID();
    const newAgent: Agent = {
      ...agent,
      id,
      status: AgentStatus.AVAILABLE
    };

    await this.redis.hSet(`agent:${id}`, newAgent as any);
    this.logger.info(`Created new agent with ID ${id}`);
    return newAgent;
  }

  async getAgent(id: string): Promise<Agent | null> {
    const agent = await this.redis.hGetAll(`agent:${id}`);
    return agent ? (agent as unknown as Agent) : null;
  }

  async updateAgentStatus(id: string, status: AgentStatus): Promise<void> {
    await this.redis.hSet(`agent:${id}`, 'status', status);

    // Update local cache if agent exists
    const agent = this.agents.get(id);
    if (agent) {
      agent.status = status;
      this.agents.set(id, agent);
    }
  }
}