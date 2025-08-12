export interface InitializationPayload {
  action: string;
  capabilities: string[];
  workspace: string;
  status: string;
}

export interface InitializationMessage {
  type: 'initialization';
  source: string;
  target: string;
  timestamp: string;
  payload: InitializationPayload;
  priority: 'low' | 'medium' | 'high';
}

export interface AgentCapabilities {
  codeAnalysis: boolean;
  pairProgramming: boolean;
  codeReview: boolean;
  architectureDesign: boolean;
  typeSafety: boolean;
  documentation: boolean;
  workflowManagement: boolean;
  testing: boolean;
}

export interface InitializationOptions {
  workspace?: string;
  capabilities?: string[];
  priority?: 'low' | 'medium' | 'high';
  target?: string;
}

export const createInitializationMessage = (
  source: string, 
  options: InitializationOptions = {}
): InitializationMessage => ({
  type: 'initialization',
  source,
  target: options.target || 'broadcast',
  timestamp: new Date().toISOString(),
  payload: {
    action: 'agent_ready',
    capabilities: options.capabilities || [
      'code_analysis',
      'pair_programming',
      'code_review',
      'architecture_design',
      'type_safety',
      'documentation'
    ],
    workspace: options.workspace || 'vscode',
    status: 'active'
  },
  priority: options.priority || 'medium'
});

export const createShutdownMessage = (source: string): InitializationMessage => ({
  type: 'initialization',
  source,
  target: 'broadcast',
  timestamp: new Date().toISOString(),
  payload: {
    action: 'agent_shutdown',
    capabilities: [],
    workspace: '',
    status: 'inactive'
  },
  priority: 'medium'
});

export class AgentInitializationService {
  private static initialized = new Set<string>();
  private static agents = new Map<string, InitializationMessage>();

  static async initializeAgent(
    agentId: string, 
    options: InitializationOptions = {}
  ): Promise<boolean> {
    try {
      if (this.initialized.has(agentId)) {
        console.warn(`Agent ${agentId} is already initialized`);
        return false;
      }

      const initMessage = createInitializationMessage(agentId, options);
      console.log('Broadcasting initialization message:', initMessage);
      
      // Store agent information
      this.agents.set(agentId, initMessage);
      
      // Mock broadcast - in real implementation would use message bus
      await this.broadcastMessage(initMessage);
      
      this.initialized.add(agentId);
      console.log(`Agent ${agentId} initialized successfully`);
      
      return true;
    } catch (error) {
      console.error(`Failed to initialize agent ${agentId}:`, error);
      return false;
    }
  }

  static isInitialized(agentId: string): boolean {
    return this.initialized.has(agentId);
  }

  static getInitializedAgents(): string[] {
    return Array.from(this.initialized);
  }

  static getAgentInfo(agentId: string): InitializationMessage | undefined {
    return this.agents.get(agentId);
  }

  static getAllAgentsInfo(): Array<{ id: string; info: InitializationMessage }> {
    return Array.from(this.agents.entries()).map(([id, info]) => ({ id, info }));
  }

  static getAgentsByCapability(capability: string): string[] {
    const agents: string[] = [];
    
    for (const [agentId, message] of this.agents.entries()) {
      if (message.payload.capabilities.includes(capability)) {
        agents.push(agentId);
      }
    }
    
    return agents;
  }

  static updateAgentCapabilities(agentId: string, capabilities: string[]): boolean {
    const agentInfo = this.agents.get(agentId);
    
    if (!agentInfo || !this.initialized.has(agentId)) {
      return false;
    }

    agentInfo.payload.capabilities = capabilities;
    agentInfo.timestamp = new Date().toISOString();
    
    console.log(`Updated capabilities for agent ${agentId}:`, capabilities);
    return true;
  }

  static updateAgentStatus(agentId: string, status: string): boolean {
    const agentInfo = this.agents.get(agentId);
    
    if (!agentInfo || !this.initialized.has(agentId)) {
      return false;
    }

    agentInfo.payload.status = status;
    agentInfo.timestamp = new Date().toISOString();
    
    console.log(`Updated status for agent ${agentId}: ${status}`);
    return true;
  }

  private static async broadcastMessage(message: InitializationMessage): Promise<void> {
    // Mock implementation - would integrate with actual message bus
    console.log(`Broadcasting to ${message.target}:`, message);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  static async shutdown(agentId: string): Promise<boolean> {
    try {
      if (!this.initialized.has(agentId)) {
        console.warn(`Agent ${agentId} is not initialized`);
        return false;
      }

      // Create and broadcast shutdown message
      const shutdownMessage = createShutdownMessage(agentId);
      await this.broadcastMessage(shutdownMessage);

      // Remove from initialized set and agents map
      const removed = this.initialized.delete(agentId);
      this.agents.delete(agentId);

      if (removed) {
        console.log(`Agent ${agentId} shutdown successfully`);
      }

      return removed;
    } catch (error) {
      console.error(`Failed to shutdown agent ${agentId}:`, error);
      return false;
    }
  }

  static async shutdownAll(): Promise<number> {
    const agents = Array.from(this.initialized);
    let shutdownCount = 0;

    for (const agentId of agents) {
      if (await this.shutdown(agentId)) {
        shutdownCount++;
      }
    }

    console.log(`Shutdown ${shutdownCount} agents`);
    return shutdownCount;
  }

  static getStats(): {
    totalAgents: number;
    activeAgents: number;
    capabilitiesDistribution: Record<string, number>;
  } {
    const stats = {
      totalAgents: this.agents.size,
      activeAgents: Array.from(this.agents.values())
        .filter(agent => agent.payload.status === 'active').length,
      capabilitiesDistribution: {} as Record<string, number>
    };

    // Calculate capability distribution
    for (const agent of this.agents.values()) {
      for (const capability of agent.payload.capabilities) {
        stats.capabilitiesDistribution[capability] = 
          (stats.capabilitiesDistribution[capability] || 0) + 1;
      }
    }

    return stats;
  }

  static validateInitializationMessage(message: any): message is InitializationMessage {
    return !!(
      message &&
      typeof message === 'object' &&
      message.type === 'initialization' &&
      typeof message.source === 'string' &&
      typeof message.target === 'string' &&
      typeof message.timestamp === 'string' &&
      message.payload &&
      typeof message.payload.action === 'string' &&
      Array.isArray(message.payload.capabilities) &&
      typeof message.payload.workspace === 'string' &&
      typeof message.payload.status === 'string' &&
      ['low', 'medium', 'high'].includes(message.priority)
    );
  }
}