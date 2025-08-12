import { AgentConfig } from '@the-new-fuse/types';

export interface AgentMetadata {
  version: string;
  created_at: string;
  updated_at?: string;
  platform: string;
  description?: string;
  tags?: string[];
}

export interface ExtendedAgentConfig extends AgentConfig {
  model?: string;
  provider?: string;
  capabilities?: string[];
  metadata?: AgentMetadata;
  status?: 'active' | 'inactive' | 'maintenance';
  priority?: number;
  maxConcurrentTasks?: number;
}

export interface AgentRegistrationOptions {
  overwrite?: boolean;
  validateCapabilities?: boolean;
}

export interface AgentSearchCriteria {
  type?: string;
  provider?: string;
  capabilities?: string[];
  status?: 'active' | 'inactive' | 'maintenance';
  tags?: string[];
}

export const createAugmentAgentConfig = (): ExtendedAgentConfig => ({
  id: 'augment',
  name: 'Augment Assistant',
  type: 'code_assistant',
  model: 'claude',
  provider: 'anthropic',
  status: 'active',
  priority: 1,
  maxConcurrentTasks: 5,
  capabilities: [
    'code_analysis',
    'architecture_design',
    'type_safety',
    'documentation',
    'task_coordination',
    'system_integration',
    'workflow_management',
    'code_review'
  ],
  metadata: {
    version: '1.0.0',
    created_at: new Date().toISOString(),
    platform: 'The New Fuse',
    description: 'Advanced code assistant with architectural design capabilities',
    tags: ['code', 'assistant', 'typescript', 'architecture']
  }
});

export const createGeminiAgentConfig = (): ExtendedAgentConfig => ({
  id: 'gemini',
  name: 'Gemini Assistant',
  type: 'code_assistant',
  model: 'gemini-pro',
  provider: 'google',
  status: 'active',
  priority: 2,
  maxConcurrentTasks: 3,
  capabilities: [
    'code_generation',
    'debugging',
    'testing',
    'refactoring',
    'documentation'
  ],
  metadata: {
    version: '1.0.0',
    created_at: new Date().toISOString(),
    platform: 'The New Fuse',
    description: 'Google Gemini-powered code generation assistant',
    tags: ['code', 'generation', 'google', 'gemini']
  }
});

export class AgentRegistrationService {
  private static registeredAgents = new Map<string, ExtendedAgentConfig>();
  private static registrationHistory = new Map<string, Date[]>();

  static registerAgent(
    config: ExtendedAgentConfig, 
    options: AgentRegistrationOptions = {}
  ): boolean {
    try {
      // Validate required fields
      if (!config.id || !config.name || !config.type) {
        console.error('Agent registration failed: Missing required fields (id, name, type)');
        return false;
      }

      // Check if agent already exists
      if (this.registeredAgents.has(config.id) && !options.overwrite) {
        console.warn(`Agent ${config.id} is already registered`);
        return false;
      }

      // Validate capabilities if requested
      if (options.validateCapabilities && config.capabilities) {
        const validCapabilities = this.getValidCapabilities();
        const invalidCapabilities = config.capabilities.filter(cap => 
          !validCapabilities.includes(cap)
        );
        
        if (invalidCapabilities.length > 0) {
          console.warn(`Agent ${config.id} has invalid capabilities: ${invalidCapabilities.join(', ')}`);
        }
      }

      // Set default values
      const agentConfig: ExtendedAgentConfig = {
        ...config,
        status: config.status || 'active',
        priority: config.priority || 1,
        maxConcurrentTasks: config.maxConcurrentTasks || 1,
        metadata: {
          ...config.metadata,
          updated_at: new Date().toISOString()
        }
      };

      this.registeredAgents.set(config.id, agentConfig);
      
      // Track registration history
      if (!this.registrationHistory.has(config.id)) {
        this.registrationHistory.set(config.id, []);
      }
      this.registrationHistory.get(config.id)!.push(new Date());

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

  static getActiveAgents(): ExtendedAgentConfig[] {
    return Array.from(this.registeredAgents.values())
      .filter(agent => agent.status === 'active');
  }

  static isRegistered(agentId: string): boolean {
    return this.registeredAgents.has(agentId);
  }

  static updateAgentStatus(agentId: string, status: 'active' | 'inactive' | 'maintenance'): boolean {
    const agent = this.registeredAgents.get(agentId);
    
    if (!agent) {
      console.warn(`Agent ${agentId} not found`);
      return false;
    }

    agent.status = status;
    if (agent.metadata) {
      agent.metadata.updated_at = new Date().toISOString();
    }

    console.log(`Agent ${agentId} status updated to ${status}`);
    return true;
  }

  static updateAgentCapabilities(agentId: string, capabilities: string[]): boolean {
    const agent = this.registeredAgents.get(agentId);
    
    if (!agent) {
      console.warn(`Agent ${agentId} not found`);
      return false;
    }

    agent.capabilities = capabilities;
    if (agent.metadata) {
      agent.metadata.updated_at = new Date().toISOString();
    }

    console.log(`Agent ${agentId} capabilities updated:`, capabilities);
    return true;
  }

  static searchAgents(criteria: AgentSearchCriteria): ExtendedAgentConfig[] {
    return Array.from(this.registeredAgents.values()).filter(agent => {
      if (criteria.type && agent.type !== criteria.type) return false;
      if (criteria.provider && agent.provider !== criteria.provider) return false;
      if (criteria.status && agent.status !== criteria.status) return false;
      
      if (criteria.capabilities && criteria.capabilities.length > 0) {
        const hasAllCapabilities = criteria.capabilities.every(cap => 
          agent.capabilities?.includes(cap)
        );
        if (!hasAllCapabilities) return false;
      }

      if (criteria.tags && criteria.tags.length > 0) {
        const agentTags = agent.metadata?.tags || [];
        const hasAllTags = criteria.tags.every(tag => agentTags.includes(tag));
        if (!hasAllTags) return false;
      }

      return true;
    });
  }

  static getAgentsByCapability(capability: string): ExtendedAgentConfig[] {
    return Array.from(this.registeredAgents.values())
      .filter(agent => agent.capabilities?.includes(capability));
  }

  static getAgentsByProvider(provider: string): ExtendedAgentConfig[] {
    return Array.from(this.registeredAgents.values())
      .filter(agent => agent.provider === provider);
  }

  static getRegistrationStats(): {
    totalAgents: number;
    activeAgents: number;
    inactiveAgents: number;
    maintenanceAgents: number;
    providerDistribution: Record<string, number>;
    capabilityDistribution: Record<string, number>;
  } {
    const agents = Array.from(this.registeredAgents.values());
    const stats = {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      inactiveAgents: agents.filter(a => a.status === 'inactive').length,
      maintenanceAgents: agents.filter(a => a.status === 'maintenance').length,
      providerDistribution: {} as Record<string, number>,
      capabilityDistribution: {} as Record<string, number>
    };

    // Calculate provider distribution
    for (const agent of agents) {
      if (agent.provider) {
        stats.providerDistribution[agent.provider] = 
          (stats.providerDistribution[agent.provider] || 0) + 1;
      }
    }

    // Calculate capability distribution
    for (const agent of agents) {
      if (agent.capabilities) {
        for (const capability of agent.capabilities) {
          stats.capabilityDistribution[capability] = 
            (stats.capabilityDistribution[capability] || 0) + 1;
        }
      }
    }

    return stats;
  }

  static getRegistrationHistory(agentId: string): Date[] {
    return this.registrationHistory.get(agentId) || [];
  }

  static validateAgentConfig(config: ExtendedAgentConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.id) errors.push('Agent ID is required');
    if (!config.name) errors.push('Agent name is required');
    if (!config.type) errors.push('Agent type is required');

    if (config.capabilities) {
      const validCapabilities = this.getValidCapabilities();
      const invalidCapabilities = config.capabilities.filter(cap => 
        !validCapabilities.includes(cap)
      );
      
      if (invalidCapabilities.length > 0) {
        errors.push(`Invalid capabilities: ${invalidCapabilities.join(', ')}`);
      }
    }

    if (config.priority !== undefined && (config.priority < 1 || config.priority > 10)) {
      errors.push('Priority must be between 1 and 10');
    }

    if (config.maxConcurrentTasks !== undefined && config.maxConcurrentTasks < 1) {
      errors.push('maxConcurrentTasks must be at least 1');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private static getValidCapabilities(): string[] {
    return [
      'code_analysis',
      'code_generation',
      'code_review',
      'debugging',
      'testing',
      'refactoring',
      'documentation',
      'architecture_design',
      'type_safety',
      'task_coordination',
      'system_integration',
      'workflow_management',
      'performance_optimization',
      'security_analysis'
    ];
  }

  static clearAll(): number {
    const count = this.registeredAgents.size;
    this.registeredAgents.clear();
    this.registrationHistory.clear();
    console.log(`Cleared ${count} registered agents`);
    return count;
  }
}