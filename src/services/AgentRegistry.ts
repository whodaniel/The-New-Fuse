import { EventEmitter } from 'events';
import { MCPTool } from './MCPService.js';

/**
 * Agent type enum
 */
export enum AgentType {
  LLM = 'llm',
  TOOL = 'tool',
  HYBRID = 'hybrid',
  ANALYSIS = 'analysis',
  ORCHESTRATOR = 'orchestrator'
}

/**
 * Agent status enum
 */
export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BUSY = 'busy',
  ERROR = 'error'
}

/**
 * Agent information interface
 */
export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: string[];
  tools?: MCPTool[];
  metadata: Record<string, any>;
}

/**
 * Agent registration event
 */
export interface AgentRegistrationEvent {
  agent: Agent;
  timestamp: string;
}

/**
 * Agent registry options
 */
export interface AgentRegistryOptions {
  debug?: boolean;
}

/**
 * Agent Registry Service
 * 
 * Provides a centralized registry for agents in the system,
 * enabling discovery and capability querying.
 */
export class AgentRegistry extends EventEmitter {
  private agents: Map<string, Agent>;
  private debug: boolean;
  
  constructor(options: AgentRegistryOptions = {}) {
    super();
    this.agents = new Map();
    this.debug = options.debug || false;
  }
  
  /**
   * Register an agent with the registry
   */
  registerAgent(agent: Agent): Agent {
    this.log(`Registering agent: ${agent.name} (${agent.id})`);
    
    // Validate agent data
    this.validateAgent(agent);
    
    // Store agent
    this.agents.set(agent.id, agent);
    
    // Emit registration event
    const event: AgentRegistrationEvent = {
      agent,
      timestamp: new Date().toISOString()
    };
    this.emit('agent:registered', event);
    
    return agent;
  }
  
  /**
   * Update an existing agent's information
   */
  updateAgent(agentId: string, updates: Partial<Agent>): Agent {
    this.log(`Updating agent: ${agentId}`);
    
    // Check if agent exists
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }
    
    // Get current agent data
    const currentAgent = this.agents.get(agentId)!;
    
    // Create updated agent
    const updatedAgent: Agent = {
      ...currentAgent,
      ...updates,
      // Ensure id doesn't change
      id: currentAgent.id
    };
    
    // Validate updated agent
    this.validateAgent(updatedAgent);
    
    // Store updated agent
    this.agents.set(agentId, updatedAgent);
    
    // Emit update event
    this.emit('agent:updated', {
      agent: updatedAgent,
      timestamp: new Date().toISOString()
    });
    
    return updatedAgent;
  }
  
  /**
   * Remove an agent from the registry
   */
  removeAgent(agentId: string): boolean {
    this.log(`Removing agent: ${agentId}`);
    
    // Check if agent exists
    if (!this.agents.has(agentId)) {
      return false;
    }
    
    // Get agent before removal for event
    const agent = this.agents.get(agentId)!;
    
    // Remove agent
    const result = this.agents.delete(agentId);
    
    // Emit removal event
    this.emit('agent:removed', {
      agent,
      timestamp: new Date().toISOString()
    });
    
    return result;
  }
  
  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Find agents by criteria
   */
  findAgents(criteria: Partial<Agent>): Agent[] {
    return Array.from(this.agents.values()).filter(agent => {
      for (const [key, value] of Object.entries(criteria)) {
        // Special handling for arrays (capabilities)
        if (key === 'capabilities' && Array.isArray(value)) {
          // Check if agent has all required capabilities
          if (!value.every(cap => agent.capabilities.includes(cap))) {
            return false;
          }
        } 
        // Special handling for metadata
        else if (key === 'metadata' && typeof value === 'object') {
          for (const [metaKey, metaValue] of Object.entries(value)) {
            if (agent.metadata[metaKey] !== metaValue) {
              return false;
            }
          }
        }
        // Regular property check
        else if ((agent as any)[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }
  
  /**
   * Find agents by capability
   */
  findAgentsByCapability(capability: string): Agent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.capabilities.includes(capability)
    );
  }
  
  /**
   * Update agent status
   */
  updateAgentStatus(agentId: string, status: AgentStatus): Agent {
    this.log(`Updating agent status: ${agentId} -> ${status}`);
    
    return this.updateAgent(agentId, { status });
  }
  
  /**
   * Register agent capabilities
   */
  registerAgentCapabilities(agentId: string, capabilities: string[]): Agent {
    this.log(`Registering capabilities for agent: ${agentId}`);
    
    // Get current agent
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }
    
    // Merge capabilities
    const mergedCapabilities = [...new Set([...agent.capabilities, ...capabilities])];
    
    // Update agent
    return this.updateAgent(agentId, { capabilities: mergedCapabilities });
  }
  
  /**
   * Register agent tools
   */
  registerAgentTools(agentId: string, tools: MCPTool[]): Agent {
    this.log(`Registering tools for agent: ${agentId}`);
    
    // Get current agent
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }
    
    // Merge tools
    const currentTools = agent.tools || [];
    const toolMap = new Map<string, MCPTool>();
    
    // Add current tools to map
    currentTools.forEach(tool => toolMap.set(tool.name, tool));
    
    // Add/update new tools
    tools.forEach(tool => toolMap.set(tool.name, tool));
    
    // Convert map back to array
    const mergedTools = Array.from(toolMap.values());
    
    // Update agent
    return this.updateAgent(agentId, { tools: mergedTools });
  }
  
  /**
   * Validate agent data
   */
  private validateAgent(agent: Agent): void {
    // Check required fields
    if (!agent.id) {
      throw new Error('Agent ID is required');
    }
    
    if (!agent.name) {
      throw new Error('Agent name is required');
    }
    
    if (!Object.values(AgentType).includes(agent.type as AgentType)) {
      throw new Error(`Invalid agent type: ${agent.type}`);
    }
    
    if (!Object.values(AgentStatus).includes(agent.status as AgentStatus)) {
      throw new Error(`Invalid agent status: ${agent.status}`);
    }
    
    if (!Array.isArray(agent.capabilities)) {
      throw new Error('Agent capabilities must be an array');
    }
  }
  
  /**
   * Utility method for logging
   */
  private log(message: string): void {
    if (this.debug) {
      console.log(`[AgentRegistry] ${message}`);
    }
  }
}

// Export singleton instance for easy use throughout the application
export const agentRegistry = new AgentRegistry({ debug: process.env.DEBUG === 'true' });