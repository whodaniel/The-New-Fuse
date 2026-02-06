/**
 * Agent Registry Adapter
 *
 * Bridges the MasterAgentRegistry to the interface expected by WorkflowEngineFactory
 */

import { MasterAgentRegistry } from '@the-new-fuse/relay-core';

export interface AgentRegistry {
  agents: Map<string, any>;
  getAgent(agentId: string): any | undefined;
  getAgentCount(): number;
  registerAgent(agent: any): void;
  unregisterAgent(agentId: string): boolean;
  getAllAgents(): any[];
  addAgentTodo(agentId: string, taskData: any): Promise<string>;
}

export class AgentRegistryAdapter implements AgentRegistry {
  private masterRegistry: MasterAgentRegistry;
  private legacyAgents: Map<string, any> = new Map();

  constructor(masterRegistry: MasterAgentRegistry) {
    this.masterRegistry = masterRegistry;
  }

  get agents(): Map<string, any> {
    return this.legacyAgents;
  }

  getAgent(agentId: string): any | undefined {
    const profile = this.masterRegistry.getAgentProfile(agentId);
    if (!profile) return undefined;

    return this.convertToLegacyAgent(profile);
  }

  getAgentCount(): number {
    return this.masterRegistry.getAllAgents().length;
  }

  registerAgent(agent: any): void {
    // This is handled by MasterAgentRegistry.registerAgent()
    // For compatibility, we'll store in legacy map
    this.legacyAgents.set(agent.id, agent);
  }

  unregisterAgent(agentId: string): boolean {
    this.legacyAgents.delete(agentId);
    // MasterAgentRegistry doesn't have unregister, so we'll just return true
    return true;
  }

  getAllAgents(): any[] {
    return this.masterRegistry.getAllAgents().map((profile) => this.convertToLegacyAgent(profile));
  }

  async addAgentTodo(agentId: string, taskData: any): Promise<string> {
    return this.masterRegistry.addAgentTodo(agentId, taskData);
  }

  private convertToLegacyAgent(profile: any): any {
    return {
      id: profile.id,
      name: profile.name,
      type: profile.type,
      status: profile.status,
      capabilities: Object.entries(profile.capabilities || {})
        .filter(([_, enabled]) => enabled)
        .map(([cap, _]) => cap),
      registeredAt: profile.registeredAt,
      lastSeen: profile.lastSeen,
      metadata: profile.metadata,
    };
  }
}
