import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { AgentInfo, AgentPoolConfig, AgentStatus } from './types';

/**
 * Agent pool management
 */
export class AgentPool extends EventEmitter {
  private agents: Map<string, AgentInfo> = new Map();
  private config: AgentPoolConfig;
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: AgentPoolConfig) {
    super();
    const defaults = {
      minAgents: 1,
      maxAgents: 10,
      scaleUpThreshold: 0.8,
      scaleDownThreshold: 0.2,
      heartbeatInterval: 5000,
      heartbeatTimeout: 15000,
    };
    this.config = { ...defaults, ...config };
  }

  /**
   * Register a new agent
   */
  registerAgent(agent: Partial<AgentInfo>): AgentInfo {
    const agentInfo: AgentInfo = {
      id: agent.id || uuidv4(),
      name: agent.name || `Agent-${Date.now()}`,
      type: agent.type || 'worker',
      capabilities: agent.capabilities || [],
      status: AgentStatus.IDLE,
      currentLoad: 0,
      maxConcurrentTasks: agent.maxConcurrentTasks || 5,
      tags: agent.tags || [],
      metadata: agent.metadata || {},
      createdAt: new Date(),
      lastHeartbeat: new Date(),
    };

    this.agents.set(agentInfo.id, agentInfo);
    this.setupHeartbeatMonitoring(agentInfo.id);
    this.emit('agent:registered', agentInfo);

    return agentInfo;
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    this.clearHeartbeatMonitoring(agentId);
    this.agents.delete(agentId);
    this.emit('agent:unregistered', agent);

    return true;
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentInfo | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): AgentInfo[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by status
   */
  getAgentsByStatus(status: AgentStatus): AgentInfo[] {
    return this.getAllAgents().filter((agent) => agent.status === status);
  }

  /**
   * Get available agents (idle or not at capacity)
   */
  getAvailableAgents(): AgentInfo[] {
    return this.getAllAgents().filter(
      (agent) =>
        (agent.status === AgentStatus.IDLE || agent.status === AgentStatus.BUSY) &&
        agent.currentLoad < agent.maxConcurrentTasks
    );
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId: string, status: AgentStatus): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    agent.status = status;
    agent.lastHeartbeat = new Date();
    this.emit('agent:status:changed', agent);

    return true;
  }

  /**
   * Update agent load
   */
  updateAgentLoad(agentId: string, load: number): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    agent.currentLoad = load;
    agent.lastHeartbeat = new Date();

    // Auto-update status based on load
    if (load === 0) {
      agent.status = AgentStatus.IDLE;
    } else if (load < agent.maxConcurrentTasks) {
      agent.status = AgentStatus.BUSY;
    }

    this.emit('agent:load:changed', agent);

    return true;
  }

  /**
   * Increment agent load
   */
  incrementAgentLoad(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    return this.updateAgentLoad(agentId, agent.currentLoad + 1);
  }

  /**
   * Decrement agent load
   */
  decrementAgentLoad(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    return this.updateAgentLoad(agentId, Math.max(0, agent.currentLoad - 1));
  }

  /**
   * Update agent heartbeat
   */
  heartbeat(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    agent.lastHeartbeat = new Date();
    return true;
  }

  /**
   * Setup heartbeat monitoring for an agent
   */
  private setupHeartbeatMonitoring(agentId: string): void {
    const interval = setInterval(() => {
      this.checkAgentHeartbeat(agentId);
    }, this.config.heartbeatInterval);

    this.heartbeatIntervals.set(agentId, interval);
  }

  /**
   * Clear heartbeat monitoring for an agent
   */
  private clearHeartbeatMonitoring(agentId: string): void {
    const interval = this.heartbeatIntervals.get(agentId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(agentId);
    }
  }

  /**
   * Check if agent heartbeat is healthy
   */
  private checkAgentHeartbeat(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const timeSinceLastHeartbeat = Date.now() - agent.lastHeartbeat.getTime();

    if (timeSinceLastHeartbeat > this.config.heartbeatTimeout) {
      this.updateAgentStatus(agentId, AgentStatus.OFFLINE);
      this.emit('agent:heartbeat:timeout', agent);
    }
  }

  /**
   * Get pool statistics
   */
  getStatistics(): {
    totalAgents: number;
    idleAgents: number;
    busyAgents: number;
    offlineAgents: number;
    totalCapacity: number;
    usedCapacity: number;
    utilizationRate: number;
  } {
    const agents = this.getAllAgents();
    const totalCapacity = agents.reduce((sum, agent) => sum + agent.maxConcurrentTasks, 0);
    const usedCapacity = agents.reduce((sum, agent) => sum + agent.currentLoad, 0);

    return {
      totalAgents: agents.length,
      idleAgents: this.getAgentsByStatus(AgentStatus.IDLE).length,
      busyAgents: this.getAgentsByStatus(AgentStatus.BUSY).length,
      offlineAgents: this.getAgentsByStatus(AgentStatus.OFFLINE).length,
      totalCapacity,
      usedCapacity,
      utilizationRate: totalCapacity > 0 ? usedCapacity / totalCapacity : 0,
    };
  }

  /**
   * Auto-scale the agent pool based on load
   */
  autoScale(): {
    action: 'scale-up' | 'scale-down' | 'none';
    reason: string;
  } {
    const stats = this.getStatistics();

    // Scale up if utilization is high
    if (
      stats.utilizationRate >= this.config.scaleUpThreshold &&
      stats.totalAgents < this.config.maxAgents
    ) {
      return {
        action: 'scale-up',
        reason: `Utilization ${(stats.utilizationRate * 100).toFixed(1)}% exceeds threshold ${(this.config.scaleUpThreshold * 100).toFixed(1)}%`,
      };
    }

    // Scale down if utilization is low
    if (
      stats.utilizationRate <= this.config.scaleDownThreshold &&
      stats.totalAgents > this.config.minAgents
    ) {
      return {
        action: 'scale-down',
        reason: `Utilization ${(stats.utilizationRate * 100).toFixed(1)}% below threshold ${(this.config.scaleDownThreshold * 100).toFixed(1)}%`,
      };
    }

    return {
      action: 'none',
      reason: 'Pool size is optimal',
    };
  }

  /**
   * Close the agent pool
   */
  close(): void {
    // Clear all heartbeat intervals
    for (const interval of this.heartbeatIntervals.values()) {
      clearInterval(interval);
    }
    this.heartbeatIntervals.clear();
    this.agents.clear();
    this.removeAllListeners();
  }
}
