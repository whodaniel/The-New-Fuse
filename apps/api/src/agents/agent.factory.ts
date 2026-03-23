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

  async createAgent(type: string, agentId: string, config: Record<string, any>): Promise<AgentInstance> {
    const instance: AgentInstance = {
      id: `${agentId}-instance`,
      type,
      status: 'active',
      config: { ...this.getDefaultConfig(type), ...config }
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
          model: 'gpt-4'
        };
      case 'IDE_EXTENSION':
        return {
          maxTokens: 2000,
          temperature: 0.3,
          model: 'gpt-3.5-turbo'
        };
      case 'API':
        return {
          maxTokens: 1000,
          temperature: 0.1,
          model: 'gpt-3.5-turbo'
        };
      // TNF-specific agent types
      case 'CTO':
        return {
          maxTokens: 8000,
          temperature: 0.4,
          model: 'MiniMax-Text-01',
          provider: 'minimax',
          role: 'Chief Technology Officer',
          expertise: ['architecture', 'feature-parity', 'assimilation', 'moe', 'llm-integration'],
          sparseAttention: true,
        };
      case 'ORCHESTRATOR':
        return {
          maxTokens: 4000,
          temperature: 0.5,
          model: 'MiniMax-Text-01',
          provider: 'minimax',
          role: 'Multi-agent coordinator',
          heartbeatInterval: 3000,
        };
      case 'SCOUT':
        return {
          maxTokens: 6000,
          temperature: 0.6,
          model: 'MiniMax-Text-01',
          provider: 'minimax',
          role: 'AI landscape researcher',
          expertise: ['market-surveillance', 'trend-detection', 'competitor-analysis'],
        };
      case 'IMPROVER':
        return {
          maxTokens: 4000,
          temperature: 0.3,
          model: 'MiniMax-Text-01',
          provider: 'minimax',
          role: 'Continuous improvement engineer',
          expertise: ['diagnostics', 'self-repair', 'security', 'code-quality'],
        };
      case 'SUB_DIRECTOR':
        return {
          maxTokens: 8000,
          temperature: 0.5,
          model: 'MiniMax-Text-01',
          provider: 'minimax',
          role: 'Local hub Sub-Director',
          platform: 'zo',
          relayHost: 'localhost',
          relayPort: 3000,
          infrastructure: true,
        };
      // Anthropic-powered agents
      case 'CLAUDE_CODE':
        return {
          maxTokens: 8000,
          temperature: 0.4,
          model: 'claude-sonnet-4-5',
          provider: 'anthropic',
        };
      case 'CLAUDE_OPUS':
        return {
          maxTokens: 8000,
          temperature: 0.4,
          model: 'claude-opus-4-6',
          provider: 'anthropic',
        };
      // OpenAI-powered agents
      case 'GPT_4':
        return {
          maxTokens: 4000,
          temperature: 0.7,
          model: 'gpt-4',
          provider: 'openai',
        };
      case 'GPT_4O':
        return {
          maxTokens: 8000,
          temperature: 0.7,
          model: 'gpt-4o',
          provider: 'openai',
        };
      default:
        return {
          maxTokens: 2000,
          temperature: 0.5,
          model: 'MiniMax-Text-01',
          provider: 'minimax',
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
