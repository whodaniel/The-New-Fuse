export interface InitializationMessage {
  type: 'initialization';
  source: string;
  target: string;
  timestamp: string;
  payload: {
    action: string;
    capabilities: string[];
    workspace: string;
    status: string;
  };
  priority: 'low' | 'medium' | 'high';
}

export const createInitializationMessage = (source: string): InitializationMessage => ({
  type: 'initialization',
  source,
  target: 'broadcast',
  timestamp: new Date().toISOString(),
  payload: {
    action: 'agent_ready',
    capabilities: [
      'code_analysis',
      'pair_programming',
      'code_review',
      'architecture_design',
      'type_safety',
      'documentation'
    ],
    workspace: 'vscode',
    status: 'active'
  },
  priority: 'medium'
});

export class AgentInitializationService {
  private static initialized = new Set<string>();

  static async initializeAgent(agentId: string): Promise<boolean> {
    try {
      if (this.initialized.has(agentId)) {
        console.warn(`Agent ${agentId} is already initialized`);
        return false;
      }

      const initMessage = createInitializationMessage(agentId);
      console.log('Broadcasting initialization message:', initMessage);
      
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

  private static async broadcastMessage(message: InitializationMessage): Promise<void> {
    // Mock implementation - would integrate with actual message bus
    console.log(`Broadcasting to ${message.target}:`, message);
  }

  static shutdown(agentId: string): boolean {
    const removed = this.initialized.delete(agentId);
    if (removed) {
      console.log(`Agent ${agentId} shutdown successfully`);
    }
    return removed;
  }
}