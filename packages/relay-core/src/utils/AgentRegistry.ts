
/**
 * Agent Registry for The New Fuse Relay System
 */

import { EventEmitter } from 'events';
import { Agent } from '../types/index';
import { Logger } from './Logger';

export class AgentRegistry extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  async registerAgent(agent: Agent): Promise<void> {
    this.agents.set(agent.id, agent);
    this.logger.info(`Agent registered: ${agent.id}`);
    this.emit('agentRegistered', agent);
  }

  async unregisterAgent(agentId: string): Promise<void> {
    if (this.agents.has(agentId)) {
      this.agents.delete(agentId);
      this.logger.info(`Agent unregistered: ${agentId}`);
      this.emit('agentUnregistered', agentId);
    }
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAgentCount(): number {
    return this.agents.size;
  }

  async updateAgentLastSeen(agentId: string): Promise<void> {
    const agent = this.getAgent(agentId);
    if (agent) {
      agent.lastSeen = new Date().toISOString();
    }
  }

  async startDiscovery(): Promise<void> {
    // This can be expanded to discover agents through various mechanisms
    this.logger.info('Agent discovery started.');
  }

  async stopDiscovery(): Promise<void> {
    this.logger.info('Agent discovery stopped.');
  }
}
