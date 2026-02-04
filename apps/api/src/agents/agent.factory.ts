import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AgentInstance {
  id: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, any>;
}

@Injectable()
export class AgentFactory {
  private activeAgents: Map<string, AgentInstance> = new Map();

  constructor(private configService: ConfigService) {}

  async createAgent(
    type: string,
    agentId: string,
    config: Record<string, any>
  ): Promise<AgentInstance> {
    const instance: AgentInstance = {
      id: `${agentId}-instance`,
      type,
      status: 'active',
      config: { ...this.getDefaultConfig(type), ...config },
    };

    this.activeAgents.set(agentId, instance);
    return instance;
  }

  async updateAgent(instanceId: string, config: Record<string, any>): Promise<void> {
    const agentId = instanceId.replace('-instance', '');
    const instance = this.activeAgents.get(agentId);

    if (instance) {
      instance.config = { ...instance.config, ...config };
      this.activeAgents.set(agentId, instance);
    }
  }

  async destroyAgent(instanceId: string): Promise<void> {
    const agentId = instanceId.replace('-instance', '');
    this.activeAgents.delete(agentId);
  }

  getDefaultConfig(type: string): Record<string, any> {
    switch (type) {
      case 'CONVERSATIONAL':
        return {
          maxTokens: 4000,
          temperature: 0.7,
          model: 'gpt-4',
        };
      case 'IDE_EXTENSION':
        return {
          maxTokens: 2000,
          temperature: 0.3,
          model: 'gpt-3.5-turbo',
        };
      case 'API':
        return {
          maxTokens: 1000,
          temperature: 0.1,
          model: 'gpt-3.5-turbo',
        };
      default:
        return {
          maxTokens: 2000,
          temperature: 0.5,
          model: 'gpt-3.5-turbo',
        };
    }
  }

  getActiveAgents(): AgentInstance[] {
    return Array.from(this.activeAgents.values());
  }

  getAgent(agentId: string): AgentInstance | undefined {
    return this.activeAgents.get(agentId);
  }
}
