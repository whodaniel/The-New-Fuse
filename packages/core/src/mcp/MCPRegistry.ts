import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';
import { MCPCapability } from './types';
export interface MCPAgent {
  // Implementation needed
}
  id: string;
  name: string;
  capabilities: MCPCapability[];
  endpoint?: string;
  lastSeen?: Date;
  status: 'active' | 'inactive' | 'error';
}

@Injectable()
export class MCPRegistry {
  // Implementation needed
}
  private static instance: MCPRegistry;
  private logger = new Logger('MCPRegistry');
  private agents: Map<string, MCPAgent> = new Map();
  private capabilities: Map<string, Set<string>> = new Map();
  constructor() {
  // Implementation needed
}
    if (MCPRegistry.instance) {
  // Implementation needed
}
      return MCPRegistry.instance;
    }
    MCPRegistry.instance = this;
  }

  public static getInstance(): MCPRegistry {
  // Implementation needed
}
    if (!MCPRegistry.instance) {
  // Implementation needed
}
      MCPRegistry.instance = new MCPRegistry();
    }
    return MCPRegistry.instance;
  }

  public registerAgent(agent: MCPAgent): void {
  // Implementation needed
}
    this.agents.set(agent.id, agent);
    // Register agent's capabilities
    agent.capabilities.forEach(capability => {
  // Implementation needed
}
      this.registerCapabilityProvider(agent.id, capability);
    });
    this.logger.info(`Registered agent: ${agent.id} with ${agent.capabilities.length} capabilities`);
  }

  public unregisterAgent(agentId: string): void {
  // Implementation needed
}
    const agent = this.agents.get(agentId);
    if (agent) {
  // Implementation needed
}
      // Remove agent from capability mappings
      agent.capabilities.forEach(capability => {
  // Implementation needed
}
        this.removeCapabilityProvider(agentId, capability);
      });
      this.agents.delete(agentId);
      this.logger.info(`Unregistered agent: ${agentId}`);
    }
  }

  public registerCapabilityProvider(agentId: string, capability: string): void {
  // Implementation needed
}
    if (!this.capabilities.has(capability)) {
  // Implementation needed
}
      this.capabilities.set(capability, new Set());
    }
    this.capabilities.get(capability)?.add(agentId);
    this.logger.debug(`Registered capability provider: ${agentId} for ${capability}`);
  }

  public removeCapabilityProvider(agentId: string, capability: string): void {
  // Implementation needed
}
    const providers = this.capabilities.get(capability);
    if (providers) {
  // Implementation needed
}
      providers.delete(agentId);
      if (providers.size === 0) {
  // Implementation needed
}
        this.capabilities.delete(capability);
      }
    }
  }

  public findCapabilityProviders(capability: string): string[] {
  // Implementation needed
}
    const providers = this.capabilities.get(capability);
    return Array.from(providers || []);
  }

  public getAgent(agentId: string): MCPAgent | undefined {
  // Implementation needed
}
    return this.agents.get(agentId);
  }

  public getAllAgents(): MCPAgent[] {
  // Implementation needed
}
    return Array.from(this.agents.values());
  }

  public getActiveAgents(): MCPAgent[] {
  // Implementation needed
}
    return this.getAllAgents().filter(agent => agent.status === 'active');
  }

  public updateAgentStatus(agentId: string, status: MCPAgent['status']): void {
  // Implementation needed
}
    const agent = this.agents.get(agentId);
    if (agent) {
  // Implementation needed
}
      agent.status = status;
      agent.lastSeen = new Date();
      this.logger.debug(`Updated agent status: ${agentId} -> ${status}`);
    }
  }

  public getCapabilityProviders(): Map<string, string[]> {
  // Implementation needed
}
    const result = new Map<string, string[]>();
    this.capabilities.forEach((providers, capability) => {
  // Implementation needed
}
      result.set(capability, Array.from(providers));
    });
    return result;
  }

  public hasCapability(capability: string): boolean {
  // Implementation needed
}
    return this.capabilities.has(capability) && 
           this.capabilities.get(capability)!.size > 0;
  }

  public getAgentsByCapability(capability: string): MCPAgent[] {
  // Implementation needed
}
    const providerIds = this.findCapabilityProviders(capability);
    return providerIds
      .map(id => this.getAgent(id))
      .filter((agent): agent is MCPAgent => agent !== undefined);
  }

  public clear(): void {
  // Implementation needed
}
    this.agents.clear();
    this.capabilities.clear();
    this.logger.info('Registry cleared');
  }

  public getStats(): {
  // Implementation needed
}
    totalAgents: number;
    activeAgents: number;
    totalCapabilities: number;
  } {
  // Implementation needed
}
    const activeAgents = this.getActiveAgents().length;
    return {
  // Implementation needed
}
      totalAgents: this.agents.size,
      activeAgents,
      totalCapabilities: this.capabilities.size
    };
  }
}