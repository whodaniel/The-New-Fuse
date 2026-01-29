/**
 * Task Distributor for KIMI Orchestrator
 *
 * Provides intelligent task distribution with multiple load balancing strategies:
 * - Round-robin: Evenly distribute tasks across agents
 * - Least-connections: Assign to agents with fewest active tasks
 * - Weighted-response-time: Prefer faster agents
 * - Capability-matching: Match tasks to agents with required skills
 */

import { EventEmitter } from 'events';

import { DEFAULT_LOAD_BALANCE_CONFIG, ORCHESTRATOR_EVENTS, TASK_PRIORITIES } from './constants';
import { generateUUID } from './utils';

import type { AgentPool } from './AgentPool';
import type {
  KimiAgent,
  KimiCapability,
  LoadBalanceConfig,
  OperationResult,
  TaskAssignment,
  TaskDecomposition,
} from './types';

/**
 * Task Distributor class for intelligent task assignment
 */
export class TaskDistributor extends EventEmitter {
  private agentPool: AgentPool;
  private config: LoadBalanceConfig;
  private taskQueue: TaskAssignment[] = [];
  private taskHistory: Map<string, TaskAssignment> = new Map();
  private currentRoundRobinIndex = 0;

  constructor(agentPool: AgentPool, config?: Partial<LoadBalanceConfig>) {
    super();
    this.agentPool = agentPool;
    this.config = { ...DEFAULT_LOAD_BALANCE_CONFIG, ...config };
  }

  /**
   * Distribute a task to the best available agent
   */
  async distributeTask(
    taskType: string,
    payload: unknown,
    options: {
      requiredCapabilities?: KimiCapability[];
      priority?: number;
      timeoutMs?: number;
      stickySessionId?: string;
    } = {}
  ): Promise<OperationResult<TaskAssignment>> {
    const startTime = Date.now();

    // Create task assignment
    const task: TaskAssignment = {
      id: generateUUID(),
      type: taskType,
      payload,
      agentId: '', // Will be assigned
      priority: options.priority || TASK_PRIORITIES.MEDIUM,
      createdAt: new Date().toISOString(),
      requiredCapabilities: options.requiredCapabilities || [],
      timeoutMs: options.timeoutMs || 300000, // 5 minutes default
      retryCount: 0,
      status: 'pending',
    };

    // Find the best agent for this task
    const agent = this.selectAgent(task, options.stickySessionId);

    if (!agent) {
      // Queue the task if no agent is available
      this.taskQueue.push(task);
      this.emit(ORCHESTRATOR_EVENTS.TASK_ASSIGNED, { task, agentId: 'queued' });

      return {
        success: false,
        error: 'No available agents for task - queued for later processing',
        metadata: { executionTimeMs: Date.now() - startTime },
      };
    }

    // Assign task to agent
    task.agentId = agent.id;
    task.status = 'assigned';

    const assigned = this.agentPool.assignTask(task);

    if (!assigned) {
      return {
        success: false,
        error: `Failed to assign task to agent ${agent.id}`,
        metadata: { executionTimeMs: Date.now() - startTime },
      };
    }

    // Store in history
    this.taskHistory.set(task.id, task);

    this.emit(ORCHESTRATOR_EVENTS.TASK_ASSIGNED, { task, agentId: agent.id });

    return {
      success: true,
      data: task,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        agentId: agent.id,
      },
    };
  }

  /**
   * Select the best agent for a task based on load balancing strategy
   */
  private selectAgent(task: TaskAssignment, stickySessionId?: string): KimiAgent | undefined {
    // Handle sticky sessions
    if (this.config.enableStickySessions && stickySessionId) {
      const stickyAgent = this.findStickyAgent(stickySessionId, task.requiredCapabilities);
      if (stickyAgent) {
        return stickyAgent;
      }
    }

    // Filter agents by capabilities
    let candidates: KimiAgent[];
    if (task.requiredCapabilities.length > 0) {
      candidates = this.agentPool.findAgentsWithCapabilities(task.requiredCapabilities);
    } else {
      candidates = this.agentPool.getHealthyAgents();
    }

    // Filter out overloaded agents
    candidates = candidates.filter(
      (agent) => agent.runningTasks < this.config.maxTasksPerAgent && agent.load < 90
    );

    if (candidates.length === 0) {
      return undefined;
    }

    // Apply load balancing strategy
    switch (this.config.strategy) {
      case 'round-robin':
        return this.selectRoundRobin(candidates);
      case 'least-connections':
        return this.selectLeastConnections(candidates);
      case 'weighted-response-time':
        return this.selectWeightedResponseTime(candidates, task);
      case 'capability-matching':
        return this.selectCapabilityMatching(candidates, task);
      default:
        return this.selectWeightedResponseTime(candidates, task);
    }
  }

  /**
   * Round-robin selection
   */
  private selectRoundRobin(candidates: KimiAgent[]): KimiAgent | undefined {
    if (candidates.length === 0) {
      return undefined;
    }

    const agent = candidates[this.currentRoundRobinIndex % candidates.length];
    this.currentRoundRobinIndex++;
    return agent;
  }

  /**
   * Select agent with least connections (fewest running tasks)
   */
  private selectLeastConnections(candidates: KimiAgent[]): KimiAgent | undefined {
    if (candidates.length === 0) {
      return undefined;
    }

    return candidates.reduce((best, current) => {
      if (current.runningTasks < best.runningTasks) {
        return current;
      }
      if (current.runningTasks === best.runningTasks && current.load < best.load) {
        return current;
      }
      return best;
    });
  }

  /**
   * Select agent based on weighted score combining response time, load, and capabilities
   */
  private selectWeightedResponseTime(
    candidates: KimiAgent[],
    task: TaskAssignment
  ): KimiAgent | undefined {
    if (candidates.length === 0) {
      return undefined;
    }
    if (candidates.length === 1) {
      return candidates[0];
    }

    // Calculate score for each agent (lower is better)
    const scored = candidates.map((agent) => {
      const normalizedResponseTime = Math.min(agent.averageResponseTime / 5000, 1); // Normalize to 0-1
      const normalizedLoad = agent.load / 100;
      const capabilityMatch = this.calculateCapabilityMatchScore(agent, task.requiredCapabilities);

      const score =
        normalizedResponseTime * this.config.responseTimeWeight +
        normalizedLoad * this.config.loadWeight -
        capabilityMatch * this.config.capabilityWeight; // Capability match is positive

      return { agent, score };
    });

    // Sort by score (ascending) and return best
    scored.sort((a, b) => a.score - b.score);
    return scored[0].agent;
  }

  /**
   * Select agent with best capability match
   */
  private selectCapabilityMatching(
    candidates: KimiAgent[],
    task: TaskAssignment
  ): KimiAgent | undefined {
    if (candidates.length === 0) {
      return undefined;
    }
    if (task.requiredCapabilities.length === 0) {
      return this.selectLeastConnections(candidates);
    }

    // Score by capability match percentage
    const scored = candidates.map((agent) => {
      const matchScore = this.calculateCapabilityMatchScore(agent, task.requiredCapabilities);
      const loadPenalty = agent.load / 100;
      return { agent, score: matchScore - loadPenalty * 0.2 };
    });

    scored.sort((a, b) => b.score - a.score); // Higher score is better
    return scored[0].agent;
  }

  /**
   * Calculate capability match score (0-1)
   */
  private calculateCapabilityMatchScore(
    agent: KimiAgent,
    requiredCapabilities: KimiCapability[]
  ): number {
    if (requiredCapabilities.length === 0) {
      return 1;
    }

    const matched = requiredCapabilities.filter((cap) => agent.capabilities.includes(cap)).length;

    return matched / requiredCapabilities.length;
  }

  /**
   * Find agent for sticky session
   */
  private findStickyAgent(
    sessionId: string,
    requiredCapabilities: KimiCapability[]
  ): KimiAgent | undefined {
    // Look for existing tasks with this session ID and get their agent
    for (const task of this.taskHistory.values()) {
      if (task.payload && (task.payload as { sessionId?: string }).sessionId === sessionId) {
        const agent = this.agentPool.getAgent(task.agentId);
        if (agent && agent.health === 'healthy') {
          // Verify capabilities still match
          const hasCapabilities = requiredCapabilities.every((cap) =>
            agent.capabilities.includes(cap)
          );
          if (hasCapabilities) {
            return agent;
          }
        }
      }
    }
    return undefined;
  }

  /**
   * Decompose a complex task into subtasks
   */
  async decomposeTask(
    taskType: string,
    payload: unknown,
    decompositionStrategy: 'parallel' | 'sequential' | 'dag' = 'parallel'
  ): Promise<OperationResult<TaskDecomposition>> {
    const startTime = Date.now();

    // Create parent task
    const parentTask: TaskAssignment = {
      id: generateUUID(),
      type: taskType,
      payload,
      agentId: '',
      priority: TASK_PRIORITIES.HIGH,
      createdAt: new Date().toISOString(),
      requiredCapabilities: [],
      timeoutMs: 600000, // 10 minutes for complex tasks
      retryCount: 0,
      status: 'pending',
    };

    // Analyze payload to determine subtasks
    const subtasks = await this.analyzeAndCreateSubtasks(parentTask, decompositionStrategy);

    // Build dependency graph
    const dependencies = this.buildDependencyGraph(subtasks, decompositionStrategy);

    // Calculate estimated completion time
    const estimatedCompletionTimeMs = this.estimateCompletionTime(subtasks, dependencies);

    const decomposition: TaskDecomposition = {
      originalTask: parentTask,
      subtasks,
      dependencies,
      estimatedCompletionTimeMs,
    };

    return {
      success: true,
      data: decomposition,
      metadata: { executionTimeMs: Date.now() - startTime },
    };
  }

  /**
   * Analyze task and create subtasks
   */
  private async analyzeAndCreateSubtasks(
    parentTask: TaskAssignment,
    strategy: 'parallel' | 'sequential' | 'dag'
  ): Promise<TaskAssignment[]> {
    const subtasks: TaskAssignment[] = [];

    // Simple decomposition logic - can be enhanced with AI-based analysis
    const payload = parentTask.payload as { files?: string[]; components?: string[] };

    if (payload.files && payload.files.length > 1) {
      // Create subtasks for each file
      for (let i = 0; i < payload.files.length; i++) {
        subtasks.push({
          id: generateUUID(),
          type: `${parentTask.type}:file`,
          payload: { file: payload.files[i], index: i },
          agentId: '',
          priority: parentTask.priority,
          createdAt: new Date().toISOString(),
          requiredCapabilities: parentTask.requiredCapabilities,
          timeoutMs: parentTask.timeoutMs / payload.files.length,
          retryCount: 0,
          status: 'pending',
        });
      }
    } else if (payload.components && payload.components.length > 1) {
      // Create subtasks for each component
      for (let i = 0; i < payload.components.length; i++) {
        subtasks.push({
          id: generateUUID(),
          type: `${parentTask.type}:component`,
          payload: { component: payload.components[i], index: i },
          agentId: '',
          priority: parentTask.priority,
          createdAt: new Date().toISOString(),
          requiredCapabilities: parentTask.requiredCapabilities,
          timeoutMs: parentTask.timeoutMs / payload.components.length,
          retryCount: 0,
          status: 'pending',
        });
      }
    } else {
      // Default: split into analysis and implementation
      subtasks.push(
        {
          id: generateUUID(),
          type: `${parentTask.type}:analysis`,
          payload: { phase: 'analysis', parentPayload: payload },
          agentId: '',
          priority: parentTask.priority,
          createdAt: new Date().toISOString(),
          requiredCapabilities: [...parentTask.requiredCapabilities, 'analysis'],
          timeoutMs: parentTask.timeoutMs * 0.3,
          retryCount: 0,
          status: 'pending',
        },
        {
          id: generateUUID(),
          type: `${parentTask.type}:implementation`,
          payload: { phase: 'implementation', parentPayload: payload },
          agentId: '',
          priority: parentTask.priority,
          createdAt: new Date().toISOString(),
          requiredCapabilities: [...parentTask.requiredCapabilities, 'code-generation'],
          timeoutMs: parentTask.timeoutMs * 0.7,
          retryCount: 0,
          status: 'pending',
        }
      );
    }

    return subtasks;
  }

  /**
   * Build dependency graph for subtasks
   */
  private buildDependencyGraph(
    subtasks: TaskAssignment[],
    strategy: 'parallel' | 'sequential' | 'dag'
  ): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();

    switch (strategy) {
      case 'sequential':
        // Each task depends on the previous one
        for (let i = 1; i < subtasks.length; i++) {
          dependencies.set(subtasks[i].id, [subtasks[i - 1].id]);
        }
        break;
      case 'dag':
        // Complex dependencies - for now, implement depends-on-previous
        for (let i = 1; i < subtasks.length; i++) {
          dependencies.set(subtasks[i].id, [subtasks[i - 1].id]);
        }
        break;
      case 'parallel':
      default:
        // No dependencies - all tasks can run in parallel
        break;
    }

    return dependencies;
  }

  /**
   * Estimate total completion time for decomposed tasks
   */
  private estimateCompletionTime(
    subtasks: TaskAssignment[],
    dependencies: Map<string, string[]>
  ): number {
    // Simple estimation: longest dependency chain * average task time
    const avgTaskTime = 30000; // 30 seconds

    // Find longest chain
    const longestChain = this.findLongestDependencyChain(subtasks, dependencies);

    return longestChain * avgTaskTime;
  }

  /**
   * Find the longest dependency chain
   */
  private findLongestDependencyChain(
    subtasks: TaskAssignment[],
    dependencies: Map<string, string[]>
  ): number {
    const memo = new Map<string, number>();

    const getDepth = (taskId: string): number => {
      if (memo.has(taskId)) {
        return memo.get(taskId)!;
      }

      const deps = dependencies.get(taskId) || [];
      if (deps.length === 0) {
        memo.set(taskId, 1);
        return 1;
      }

      const maxDepDepth = Math.max(...deps.map(getDepth));
      const depth = maxDepDepth + 1;
      memo.set(taskId, depth);
      return depth;
    };

    return Math.max(...subtasks.map((t) => getDepth(t.id)));
  }

  /**
   * Process queued tasks when agents become available
   */
  async processQueue(): Promise<void> {
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue[0];
      const agent = this.selectAgent(task);

      if (!agent) {
        // No agents available, stop processing
        break;
      }

      // Remove from queue and assign
      this.taskQueue.shift();
      task.agentId = agent.id;
      task.status = 'assigned';

      const assigned = this.agentPool.assignTask(task);
      if (assigned) {
        this.taskHistory.set(task.id, task);
        this.emit(ORCHESTRATOR_EVENTS.TASK_ASSIGNED, { task, agentId: agent.id });
      }
    }
  }

  /**
   * Get queued tasks count
   */
  getQueueSize(): number {
    return this.taskQueue.length;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): TaskAssignment | undefined {
    return this.taskHistory.get(taskId);
  }

  /**
   * Cancel a pending task
   */
  cancelTask(taskId: string): boolean {
    const queueIndex = this.taskQueue.findIndex((t) => t.id === taskId);
    if (queueIndex > -1) {
      this.taskQueue.splice(queueIndex, 1);
      this.emit(ORCHESTRATOR_EVENTS.TASK_CANCELLED, { taskId });
      return true;
    }

    const task = this.taskHistory.get(taskId);
    if (task && task.status === 'pending') {
      task.status = 'cancelled';
      this.emit(ORCHESTRATOR_EVENTS.TASK_CANCELLED, { taskId });
      return true;
    }

    return false;
  }

  /**
   * Complete a task and update statistics
   */
  completeTask(taskId: string, result: unknown): void {
    const task = this.taskHistory.get(taskId);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      task.result = result;
      this.agentPool.completeTask(taskId, result);
      this.emit(ORCHESTRATOR_EVENTS.TASK_COMPLETED, { task, result });
    }
  }

  /**
   * Fail a task and handle retry logic
   */
  failTask(taskId: string, error: string): void {
    const task = this.taskHistory.get(taskId);
    if (task) {
      task.status = 'failed';
      task.error = error;
      this.agentPool.failTask(taskId, error);
      this.emit(ORCHESTRATOR_EVENTS.TASK_FAILED, { task, error: new Error(error) });
    }
  }

  /**
   * Update load balancing configuration
   */
  updateConfig(config: Partial<LoadBalanceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): LoadBalanceConfig {
    return { ...this.config };
  }
}
