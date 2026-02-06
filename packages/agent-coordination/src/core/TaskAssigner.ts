import { EventEmitter } from 'events';
import { AgentInfo, AgentStatus, CoordinationConfig, Task, TaskAssignment } from './types';

/**
 * Task assignment and load balancing
 */
export class TaskAssigner extends EventEmitter {
  private assignments: Map<string, TaskAssignment> = new Map();
  private config: CoordinationConfig;

  constructor(config: CoordinationConfig = {}) {
    super();
    this.config = {
      maxConcurrentTasks: 10,
      taskTimeout: 60000,
      loadBalancing: {
        strategy: 'least-loaded',
        considerCapabilities: true,
      },
      ...config,
    };
  }

  /**
   * Assign a task to the most suitable agent
   */
  assignTask(task: Task, availableAgents: AgentInfo[]): TaskAssignment | null {
    // Filter agents based on status and capabilities
    const eligibleAgents = this.filterEligibleAgents(task, availableAgents);

    if (eligibleAgents.length === 0) {
      this.emit('assignment:failed', task, 'No eligible agents');
      return null;
    }

    // Select agent based on load balancing strategy
    const selectedAgent = this.selectAgent(eligibleAgents);

    if (!selectedAgent) {
      this.emit('assignment:failed', task, 'Agent selection failed');
      return null;
    }

    const assignment: TaskAssignment = {
      taskId: task.id,
      agentId: selectedAgent.id,
      assignedAt: new Date(),
      expiresAt: this.config.taskTimeout
        ? new Date(Date.now() + this.config.taskTimeout)
        : undefined,
    };

    this.assignments.set(task.id, assignment);
    this.emit('assignment:created', assignment);

    return assignment;
  }

  /**
   * Filter agents that can handle the task
   */
  private filterEligibleAgents(task: Task, agents: AgentInfo[]): AgentInfo[] {
    return agents.filter((agent) => {
      // Check agent status
      if (agent.status !== AgentStatus.IDLE && agent.status !== AgentStatus.BUSY) {
        return false;
      }

      // Check if agent is at capacity
      if (agent.currentLoad >= agent.maxConcurrentTasks) {
        return false;
      }

      // Check capabilities if required
      if (this.config.loadBalancing?.considerCapabilities && task.requiredCapabilities) {
        const agentCapabilityNames = agent.capabilities.map((c) => c.name);
        const hasAllCapabilities = task.requiredCapabilities.every((required) =>
          agentCapabilityNames.includes(required)
        );
        if (!hasAllCapabilities) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Select the best agent based on load balancing strategy
   */
  private selectAgent(agents: AgentInfo[]): AgentInfo | null {
    if (agents.length === 0) return null;

    const strategy = this.config.loadBalancing?.strategy || 'least-loaded';

    switch (strategy) {
      case 'least-loaded':
        return this.selectLeastLoadedAgent(agents);

      case 'round-robin':
        return this.selectRoundRobinAgent(agents);

      case 'capability-based':
        return this.selectCapabilityBasedAgent(agents);

      case 'random':
        return agents[Math.floor(Math.random() * agents.length)];

      default:
        return this.selectLeastLoadedAgent(agents);
    }
  }

  /**
   * Select agent with least current load
   */
  private selectLeastLoadedAgent(agents: AgentInfo[]): AgentInfo {
    return agents.reduce((least, current) =>
      current.currentLoad < least.currentLoad ? current : least
    );
  }

  /**
   * Round-robin agent selection
   */
  private selectRoundRobinAgent(agents: AgentInfo[]): AgentInfo {
    // Simple round-robin based on total assignments
    const index = this.assignments.size % agents.length;
    return agents[index];
  }

  /**
   * Select agent based on capability match score
   */
  private selectCapabilityBasedAgent(agents: AgentInfo[]): AgentInfo {
    // Score agents based on number of capabilities they have
    const scored = agents.map((agent) => ({
      agent,
      score: agent.capabilities.length,
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored[0].agent;
  }

  /**
   * Get assignment for a task
   */
  getAssignment(taskId: string): TaskAssignment | undefined {
    return this.assignments.get(taskId);
  }

  /**
   * Remove an assignment
   */
  removeAssignment(taskId: string): boolean {
    const removed = this.assignments.delete(taskId);
    if (removed) {
      this.emit('assignment:removed', taskId);
    }
    return removed;
  }

  /**
   * Get all assignments for an agent
   */
  getAgentAssignments(agentId: string): TaskAssignment[] {
    return Array.from(this.assignments.values()).filter(
      (assignment) => assignment.agentId === agentId
    );
  }

  /**
   * Check for expired assignments
   */
  cleanExpiredAssignments(): TaskAssignment[] {
    const now = new Date();
    const expired: TaskAssignment[] = [];

    for (const [taskId, assignment] of this.assignments.entries()) {
      if (assignment.expiresAt && assignment.expiresAt < now) {
        expired.push(assignment);
        this.assignments.delete(taskId);
        this.emit('assignment:expired', assignment);
      }
    }

    return expired;
  }

  /**
   * Get assignment statistics
   */
  getStatistics(): {
    totalAssignments: number;
    activeAssignments: number;
    assignmentsByAgent: Map<string, number>;
  } {
    const assignmentsByAgent = new Map<string, number>();

    for (const assignment of this.assignments.values()) {
      const count = assignmentsByAgent.get(assignment.agentId) || 0;
      assignmentsByAgent.set(assignment.agentId, count + 1);
    }

    return {
      totalAssignments: this.assignments.size,
      activeAssignments: this.assignments.size,
      assignmentsByAgent,
    };
  }

  /**
   * Clear all assignments
   */
  clear(): void {
    this.assignments.clear();
    this.emit('assignments:cleared');
  }
}
