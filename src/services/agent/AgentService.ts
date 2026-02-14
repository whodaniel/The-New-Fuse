import { Injectable } from '@nestjs/common';
import { DrizzleAgentRepository } from '@the-new-fuse/database/drizzle/repositories';
import { Agent, AgentStatus, CreateAgentDto, UpdateAgentDto } from '@the-new-fuse/types';
import { BaseService } from '../core/BaseService.js';
import { RedisService } from '../redis.service.js';
import { AgentFactory } from './AgentFactory.js';

@Injectable()
export class AgentService extends BaseService {
  constructor(
    private readonly agentRepository: DrizzleAgentRepository,
    private readonly agentFactory: AgentFactory,
    private readonly redis: RedisService
  ) {
    super('AgentService');
  }

  async doInitialize(): Promise<void> {
    await this.redis.connect();
    const subscriber = this.redis.getClient().duplicate();
    await subscriber.connect();
    await subscriber.subscribe('agent:events', (message) => {
      const event = JSON.parse(message);
      this.handleAgentEvent(event);
    });
  } // Renamed initialize to doInitialize

  async createAgent(data: CreateAgentDto, userId: string): Promise<Agent> {
    try {
      // Check for existing agent with same name
      const existingAgent = await this.agentRepository.findByIdSystem(data.name);
      if (existingAgent) {
        throw new Error(`Agent with name "${data.name}" already exists`);
      }

      const newAgent = await this.agentRepository.create({
        ...data,
        userId,
        status: AgentStatus.INITIALIZING as string,
      });

      const instance = await this.agentFactory.createAgent(
        data.type,
        newAgent.id,
        data.configuration
      );

      const agent = await this.agentRepository.update(newAgent.id, {
        instanceId: instance.id,
        status: AgentStatus.ACTIVE as string,
      });

      this.emit('agent:created', { agent });
      return agent;
    } catch (error) {
      this.logger.error('Failed to create agent:', error);
      throw error;
    }
  }

  async updateAgent(id: string, updates: UpdateAgentDto, userId: string): Promise<Agent> {
    const agent = await this.agentRepository.findById(id, userId);

    if (!agent) {
      throw new Error('Agent not found');
    }

    if (updates.configuration) {
      await this.agentFactory.updateAgent(agent.instanceId, updates.configuration);
    }

    const updatedAgent = await this.agentRepository.update(id, updates as any);

    this.emit('agent:updated', { agent: updatedAgent });
    return updatedAgent;
  }

  async deleteAgent(id: string, userId: string): Promise<void> {
    const agent = await this.agentRepository.findById(id, userId);

    if (!agent) {
      throw new Error('Agent not found');
    }

    await this.agentFactory.destroyAgent(agent.instanceId);
    await this.agentRepository.update(id, {
      deletedAt: new Date(),
      status: AgentStatus.DELETED as string,
    });

    this.emit('agent:deleted', { agentId: id });
  }

  async registerCapability(capability: any): Promise<any> {
    // Mock implementation for capabilities - adjust based on actual schema requirements
    this.logger.info(`Registering capability: ${capability.name}`);
    // This would typically involve saving to a capabilities table or updating agent metadata
    return { ...capability, id: capability.id || 'mock-cap-id' };
  }

  private async handleAgentEvent(event: any): Promise<void> {
    if (!event || typeof event !== 'object') return;

    // safe type checking
    const evt = event as { type: string; agentId: string; status?: AgentStatus; error?: unknown };

    switch (evt.type) {
      case 'status_change':
        if (evt.status) await this.handleStatusChange(evt.agentId, evt.status);
        break;
      case 'error':
        await this.handleAgentError(evt.agentId, evt.error);
        break;
      default:
        this.logger.warn(`Unknown agent event type: ${evt.type}`);
    }
  }

  private async handleStatusChange(agentId: string, status: AgentStatus): Promise<void> {
    await this.agentRepository.update(agentId, { status: status as string });
    this.emit('agent:status_changed', { agentId, status });
  }

  private async handleAgentError(agentId: string, error: unknown): Promise<void> {
    this.logger.error(`Agent ${agentId} error:`, error);
    this.emit('agent:error', { agentId, error });
  }
}
