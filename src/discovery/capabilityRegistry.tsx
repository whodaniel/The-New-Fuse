import * as vscode from 'vscode';
import { Agent, AgentEvent, AgentEventData, AgentRegistrationRequest, ExtensionCapability } from './types.js';

/**
 * Manages the registry of agent capabilities
 */
export class CapabilityRegistry {
  private agents: Map<string, Agent> = new Map();
  private eventEmitter = new vscode.EventEmitter<AgentEventData>();
  
  /**
   * Event that fires when agent status changes
   */
  public readonly onAgentEvent = this.eventEmitter.event;
  
  /**
   * Register a new agent
   */
  public registerAgent(request: AgentRegistrationRequest, extensionId: string): Agent {
    const agent: Agent = {
      ...request,
      extensionId,
      isActive: true
    };
    
    const existing = this.agents.get(agent.id);
    this.agents.set(agent.id, agent);
    
    // Emit appropriate event
    if (!existing) {
      this.emitEvent(agent, AgentEvent.REGISTERED);
    } else if (JSON.stringify(existing.capabilities) !== JSON.stringify(agent.capabilities)) {
      this.emitEvent(agent, AgentEvent.CAPABILITY_CHANGED);
    }
    
    return agent;
  }
  
  /**
   * Unregister an agent
   */
  public unregisterAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }
    
    this.agents.delete(agentId);
    this.emitEvent(agent, AgentEvent.UNREGISTERED);
    return true;
  }
  
  /**
   * Update agent status
   */
  public updateAgentStatus(agentId: string, isActive: boolean): boolean {
    const agent = this.agents.get(agentId);
    if (!agent || agent.isActive === isActive) {
      return false;
    }
    
    agent.isActive = isActive;
    this.emitEvent(agent, AgentEvent.STATUS_CHANGED);
    return true;
  }
  
  /**
   * Update agent capabilities
   */
  public updateAgentCapabilities(agentId: string, capabilities: ExtensionCapability[]): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }
    
    if (JSON.stringify(agent.capabilities) !== JSON.stringify(capabilities)) {
      agent.capabilities = capabilities;
      this.emitEvent(agent, AgentEvent.CAPABILITY_CHANGED);
      return true;
    }
    
    return false;
  }
  
  /**
   * Get all registered agents
   */
  public getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Get agents by capability
   */
  public getAgentsByCapability(capability: ExtensionCapability): Agent[] {
    return this.getAllAgents().filter(agent => 
      agent.isActive && agent.capabilities.includes(capability)
    );
  }
  
  /**
   * Get an agent by ID
   */
  public getAgentById(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Find agents that can handle all specified capabilities
   */
  public findAgentsForCapabilities(capabilities: ExtensionCapability[]): Agent[] {
    return this.getAllAgents().filter(agent => 
      agent.isActive && capabilities.every(cap => agent.capabilities.includes(cap))
    );
  }
  
  private emitEvent(agent: Agent, type: AgentEvent): void {
    this.eventEmitter.fire({
      agent,
      type,
      timestamp: Date.now()
    });
  }
}
