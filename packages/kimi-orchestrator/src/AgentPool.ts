/**
 * Agent Pool Management for KIMI Orchestrator
 *
 * Manages a pool of up to 100 KIMI k2.5 agents with lifecycle management,
 * load tracking, and capability-based organization.
 */

import { EventEmitter } from 'events';

import { LIMITS, ORCHESTRATOR_EVENTS } from './constants';

import type { AgentPoolStats, KimiAgent, KimiCapability, TaskAssignment } from './types';

/**
 * Agent Pool class for managing the fleet of KIMI agents
 */
export class AgentPool extends EventEmitter {
  private agents: Map<string, KimiAgent> = new Map();
  private agentQueue: string[] = []; // For round-robin distribution
  private capabilityIndex: Map<KimiCapability, Set<string>> = new Map();
  private taskAssignments: Map<string, TaskAssignment> = new Map();
  private stats: AgentPoolStats;
  private maxAgents: number;

  constructor(maxAgents: number = LIMITS.MAX_AGENTS) {
    super();
    this.maxAgents = Math.min(maxAgents, LIMITS.MAX_AGENTS);
    this.stats = this.initializeStats();
  }

  /**
   * Initialize pool statistics
   */
  private initializeStats(): AgentPoolStats {
    return {
      totalAgents: 0,
      activeAgents: 0,
      healthyAgents: 0,
      degradedAgents: 0,
      unhealthyAgents: 0,
      totalTasksProcessed: 0,
      runningTasks: 0,
      queuedTasks: 0,
      averageCompletionTimeMs: 0,
      utilizationPercent: 0,
    };
  }

  /**
   * Register a new agent in the pool
   */
  async registerAgent(agent: KimiAgent): Promise<boolean> {
    if (this.agents.size >= this.maxAgents) {
      this.emit(ORCHESTRATOR_EVENTS.ERROR, {
        error: new Error(`Agent pool at capacity (${this.maxAgents})`),
        context: { agentId: agent.id },
      });
      return false;
    }

    if (this.agents.has(agent.id)) {
      this.emit(ORCHESTRATOR_EVENTS.ERROR, {
        error: new Error(`Agent ${agent.id} already registered`),
        context: { agentId: agent.id },
      });
      return false;
    }

    // Store agent
    this.agents.set(agent.id, agent);
    this.agentQueue.push(agent.id);

    // Index by capabilities
    for (const capability of agent.capabilities) {
      if (!this.capabilityIndex.has(capability)) {
        this.capabilityIndex.set(capability, new Set());
      }
      this.capabilityIndex.get(capability)!.add(agent.id);
    }

    // Update stats
    this.updateStats();

    this.emit(ORCHESTRATOR_EVENTS.AGENT_REGISTERED, { agent });
    return true;
  }

  /**
   * Unregister an agent from the pool
   */
  async unregisterAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    // Remove from capability index
    for (const capability of agent.capabilities) {
      this.capabilityIndex.get(capability)?.delete(agentId);
    }

    // Remove from queue
    const queueIndex = this.agentQueue.indexOf(agentId);
    if (queueIndex > -1) {
      this.agentQueue.splice(queueIndex, 1);
    }

    // Remove from agents map
    this.agents.delete(agentId);

    // Update stats
    this.updateStats();

    this.emit(ORCHESTRATOR_EVENTS.AGENT_UNREGISTERED, { agentId });
    return true;
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): KimiAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): KimiAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by capability
   */
  getAgentsByCapability(capability: KimiCapability): KimiAgent[] {
    const agentIds = this.capabilityIndex.get(capability);
    if (!agentIds) {
      return [];
    }

    return Array.from(agentIds)
      .map((id) => this.agents.get(id))
      .filter((agent): agent is KimiAgent => agent !== undefined);
  }

  /**
   * Find agents with all specified capabilities
   */
  findAgentsWithCapabilities(capabilities: KimiCapability[]): KimiAgent[] {
    if (capabilities.length === 0) {
      return this.getAllAgents();
    }

    // Start with agents that have the first capability
    let candidateIds = new Set(this.capabilityIndex.get(capabilities[0]) || []);

    // Intersect with agents having each additional capability
    for (let i = 1; i < capabilities.length; i++) {
      const capabilityAgents = this.capabilityIndex.get(capabilities[i]);
      if (!capabilityAgents) {
        return []; // No agents have this capability
      }

      candidateIds = new Set(Array.from(candidateIds).filter((id) => capabilityAgents.has(id)));
    }

    return Array.from(candidateIds)
      .map((id) => this.agents.get(id))
      .filter((agent): agent is KimiAgent => agent !== undefined);
  }

  /**
   * Get next available agent using round-robin
   */
  getNextAvailableAgent(): KimiAgent | undefined {
    if (this.agentQueue.length === 0) {
      return undefined;
    }

    // Get the next agent from the queue
    const agentId = this.agentQueue.shift()!;
    const agent = this.agents.get(agentId);

    // Put the agent back at the end of the queue
    this.agentQueue.push(agentId);

    return agent;
  }

  /**
   * Get agents sorted by load (least loaded first)
   */
  getAgentsByLoad(): KimiAgent[] {
    return this.getAllAgents().sort((a, b) => {
      // Sort by load percentage, then by running tasks
      const loadDiff = a.load - b.load;
      if (loadDiff !== 0) {
        return loadDiff;
      }
      return a.runningTasks - b.runningTasks;
    });
  }

  /**
   * Get healthy agents only
   */
  getHealthyAgents(): KimiAgent[] {
    return this.getAllAgents().filter(
      (agent) => agent.health === 'healthy' && agent.status === 'connected'
    );
  }

  /**
   * Update agent load and task count
   */
  updateAgentLoad(agentId: string, load: number, runningTasks: number): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.load = Math.max(0, Math.min(100, load));
      agent.runningTasks = Math.max(0, runningTasks);
      this.updateStats();
    }
  }

  /**
   * Update agent health status
   */
  updateAgentHealth(agentId: string, health: KimiAgent['health']): void {
    const agent = this.agents.get(agentId);
    if (agent && agent.health !== health) {
      agent.health = health;
      agent.lastHealthCheck = new Date().toISOString();
      this.updateStats();

      this.emit(ORCHESTRATOR_EVENTS.AGENT_HEALTH_CHANGED, {
        agentId,
        health,
      });
    }
  }

  /**
   * Assign a task to an agent
   */
  assignTask(task: TaskAssignment): boolean {
    const agent = this.agents.get(task.agentId);
    if (!agent) {
      return false;
    }

    if (agent.runningTasks >= agent.maxConcurrentTasks) {
      return false;
    }

    this.taskAssignments.set(task.id, task);
    agent.currentTask = task;
    agent.runningTasks++;

    this.updateStats();
    return true;
  }

  /**
   * Complete a task
   */
  completeTask(taskId: string, _result: unknown): boolean {
    const task = this.taskAssignments.get(taskId);
    if (!task) {
      return false;
    }

    const agent = this.agents.get(task.agentId);
    if (agent) {
      agent.runningTasks = Math.max(0, agent.runningTasks - 1);
      agent.tasksCompleted++;

      // Update average response time
      const completionTime = Date.now() - new Date(task.startedAt || task.createdAt).getTime();
      const totalTasks = agent.tasksCompleted;
      agent.averageResponseTime =
        (agent.averageResponseTime * (totalTasks - 1) + completionTime) / totalTasks;

      if (agent.currentTask?.id === taskId) {
        agent.currentTask = undefined;
      }
    }

    this.taskAssignments.delete(taskId);
    this.stats.totalTasksProcessed++;
    this.updateStats();

    return true;
  }

  /**
   * Fail a task
   */
  failTask(taskId: string, _error: string): boolean {
    const task = this.taskAssignments.get(taskId);
    if (!task) {
      return false;
    }

    const agent = this.agents.get(task.agentId);
    if (agent) {
      agent.runningTasks = Math.max(0, agent.runningTasks - 1);
      if (agent.currentTask?.id === taskId) {
        agent.currentTask = undefined;
      }
    }

    this.taskAssignments.delete(taskId);
    this.updateStats();

    return true;
  }

  /**
   * Get current pool statistics
   */
  getStats(): AgentPoolStats {
    return { ...this.stats };
  }

  /**
   * Update pool statistics
   */
  private updateStats(): void {
    const agents = this.getAllAgents();
    const healthyAgents = agents.filter((a) => a.health === 'healthy');
    const degradedAgents = agents.filter((a) => a.health === 'degraded');
    const unhealthyAgents = agents.filter(
      (a) => a.health === 'unhealthy' || a.status === 'disconnected'
    );

    const runningTasks = agents.reduce((sum, a) => sum + a.runningTasks, 0);
    const maxCapacity = agents.reduce((sum, a) => sum + a.maxConcurrentTasks, 0);

    this.stats = {
      totalAgents: agents.length,
      activeAgents: agents.filter((a) => a.status === 'connected').length,
      healthyAgents: healthyAgents.length,
      degradedAgents: degradedAgents.length,
      unhealthyAgents: unhealthyAgents.length,
      totalTasksProcessed: this.stats.totalTasksProcessed,
      runningTasks,
      queuedTasks: this.taskAssignments.size - runningTasks,
      averageCompletionTimeMs: this.calculateAverageCompletionTime(agents),
      utilizationPercent: maxCapacity > 0 ? (runningTasks / maxCapacity) * 100 : 0,
    };

    this.emit(ORCHESTRATOR_EVENTS.POOL_STATS, { stats: this.stats });
  }

  /**
   * Calculate average task completion time across all agents
   */
  private calculateAverageCompletionTime(agents: KimiAgent[]): number {
    const agentsWithTasks = agents.filter((a) => a.tasksCompleted > 0);
    if (agentsWithTasks.length === 0) {
      return 0;
    }

    const totalTime = agentsWithTasks.reduce((sum, a) => sum + a.averageResponseTime, 0);
    return totalTime / agentsWithTasks.length;
  }

  /**
   * Get the number of registered agents
   */
  getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * Check if pool is at capacity
   */
  isAtCapacity(): boolean {
    return this.agents.size >= this.maxAgents;
  }

  /**
   * Get pool capacity
   */
  getCapacity(): number {
    return this.maxAgents;
  }

  /**
   * Clear all agents and reset pool
   */
  async clear(): Promise<void> {
    const agentIds = Array.from(this.agents.keys());
    for (const agentId of agentIds) {
      await this.unregisterAgent(agentId);
    }
    this.taskAssignments.clear();
    this.stats = this.initializeStats();
  }
}
