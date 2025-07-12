import { AgentConfig } from '@the-new-fuse/types';

export interface ExtendedAgentConfig extends AgentConfig {
  model?: string;
  provider?: string;
  capabilities?: string[];
  metadata?: Record<string, any>;
}

export const createAugmentAgentConfig = (): ExtendedAgentConfig => ({
  id: 'augment',
  name: 'Augment Assistant',
  type: 'code_assistant',
  model: 'claude',
  provider: 'anthropic',
  capabilities: [
    'code_analysis',
    'architecture_design',
    'type_safety',
    'documentation',
    'task_coordination',
    'system_integration'
  ],
  metadata: {
    version: '1.0.0',
    created_at: new Date().toISOString(),
    platform: 'The New Fuse'
  }
});

export class AgentRegistrationService {
  private static registeredAgents = new Map<string, ExtendedAgentConfig>();

  static registerAgent(config: ExtendedAgentConfig): boolean {
    try {
      if (this.registeredAgents.has(config.id)) {
        console.warn(`Agent ${config.id} is already registered`);
        return false;
      }
      
      this.registeredAgents.set(config.id, config);
      console.log(`Agent ${config.id} registered successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to register agent ${config.id}:`, error);
      return false;
    }
  }

  static unregisterAgent(agentId: string): boolean {
    const deleted = this.registeredAgents.delete(agentId);
    if (deleted) {
      console.log(`Agent ${agentId} unregistered successfully`);
    } else {
      console.warn(`Agent ${agentId} was not found`);
    }
    return deleted;
  }

  static getAgent(agentId: string): ExtendedAgentConfig | undefined {
    return this.registeredAgents.get(agentId);
  }

  static getAllAgents(): ExtendedAgentConfig[] {
    return Array.from(this.registeredAgents.values());
  }

  static isRegistered(agentId: string): boolean {
    return this.registeredAgents.has(agentId);
  }
}