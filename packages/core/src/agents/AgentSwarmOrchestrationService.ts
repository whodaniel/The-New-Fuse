/**
 * @fileoverview Agent swarm orchestration service for coordinating multiple agents
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { SwarmExecution, SwarmCoordinationStrategy, Agent, AgentStatus } from '../types/agent';
import { Task, TaskStatus } from '../types/core';
import { ServiceState } from '../constants/types';
import { BaseError } from '../utils/errors';

export interface SwarmTask {
  id: string;
  name: string;
  description?: string;
  requiredCapabilities: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration?: number;
  dependencies: string[];
  payload: any;
  assignedAgentId?: string;
  status: TaskStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface SwarmConfiguration {
  strategy: SwarmCoordinationStrategy;
  maxConcurrentTasks: number;
  taskTimeout: number;
  retryAttempts: number;
  failureThreshold: number;
  loadBalancing: 'round_robin' | 'capability_based' | 'load_based';
}

@Injectable()
export class AgentSwarmOrchestrationService extends EventEmitter {
  private readonly logger = new Logger(AgentSwarmOrchestrationService.name);
  private state: ServiceState = ServiceState.UNINITIALIZED;
  private executions: Map<string, SwarmExecution> = new Map();
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, SwarmTask> = new Map();
  private taskQueue: string[] = [];
  private isProcessing = false;

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  async initializeSwarm(): Promise<void> {
    return this.start();
  }

  async getSwarmStatus(): Promise<{
    activeExecutions: number;
    totalAgents: number;
    onlineAgents: number;
    busyAgents: number;
  }> {
    const agents = this.getAllAgents();
    const activeExecutions = Array.from(this.executions.values()).filter(
      (e) => e.status === 'running',
    ).length;

    return {
      activeExecutions,
      totalAgents: agents.length,
      onlineAgents: agents.filter(
        (a) => a.status === AgentStatus.IDLE || a.status === AgentStatus.BUSY,
      ).length,
      busyAgents: agents.filter((a) => a.status === AgentStatus.BUSY).length,
    };
  }

  async start(): Promise<void> {
    if (this.state === ServiceState.RUNNING) {
      this.logger.warn('AgentSwarmOrchestrationService is already running');
      return;
    }

    try {
      this.state = ServiceState.INITIALIZING;
      this.logger.log('Starting AgentSwarmOrchestrationService');

      this.startTaskProcessor();

      this.state = ServiceState.RUNNING;
      this.logger.log('AgentSwarmOrchestrationService started successfully');
    } catch (error) {
      this.state = ServiceState.ERROR;
      this.logger.error('Failed to start AgentSwarmOrchestrationService', error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.state === ServiceState.STOPPED) {
      this.logger.warn('AgentSwarmOrchestrationService is already stopped');
      return;
    }

    try {
      this.state = ServiceState.STOPPING;
      this.logger.log('Stopping AgentSwarmOrchestrationService');

      this.isProcessing = false;

      this.state = ServiceState.STOPPED;
      this.logger.log('AgentSwarmOrchestrationService stopped successfully');
    } catch (error) {
      this.state = ServiceState.ERROR;
      this.logger.error('Failed to stop AgentSwarmOrchestrationService', error as Error);
      throw error;
    }
  }

  getState(): ServiceState {
    return this.state;
  }

  // Agent management
  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
    this.logger.log(`Registered agent in swarm: ${agent.name} (${agent.id})`);
    this.emit('agentRegistered', agent);
  }

  unregisterAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    this.agents.delete(agentId);
    this.logger.log(`Unregistered agent from swarm: ${agent.name} (${agentId})`);
    this.emit('agentUnregistered', agent);
    return true;
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAvailableAgents(): Agent[] {
    return Array.from(this.agents.values()).filter((agent) => agent.status === AgentStatus.IDLE);
  }

  // Swarm execution management
  async createExecution(
    name: string,
    tasks: Omit<SwarmTask, 'id' | 'status' | 'createdAt'>[],
    config: SwarmConfiguration,
  ): Promise<string> {
    const executionId = `swarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create tasks
    const swarmTasks = tasks.map((task) => ({
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: TaskStatus.PENDING,
      createdAt: new Date(),
    }));

    // Store tasks
    swarmTasks.forEach((task) => {
      this.tasks.set(task.id, task);
      this.taskQueue.push(task.id);
    });

    const execution: SwarmExecution = {
      id: executionId,
      name,
      description: `Swarm execution with ${swarmTasks.length} tasks`,
      agents: Array.from(this.agents.keys()),
      tasks: swarmTasks.map((t) => t.id),
      status: 'pending',
      startTime: new Date(),
      results: {},
      metadata: { config },
    };

    this.executions.set(executionId, execution);

    this.logger.log(
      `Created swarm execution: ${name} (${executionId}) with ${swarmTasks.length} tasks`,
    );
    this.emit('executionCreated', execution);

    return executionId;
  }

  async startExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new BaseError(`Execution ${executionId} not found`, 'EXECUTION_NOT_FOUND');
    }

    if (execution.status !== 'pending') {
      throw new BaseError(
        `Execution ${executionId} is not in pending state`,
        'INVALID_EXECUTION_STATE',
      );
    }

    execution.status = 'running';
    execution.startTime = new Date();

    this.logger.log(`Started swarm execution: ${execution.name} (${executionId})`);
    this.emit('executionStarted', execution);
  }

  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return false;
    }

    if (execution.status === 'running') {
      execution.status = 'cancelled';
      execution.endTime = new Date();

      // Cancel all pending tasks for this execution
      execution.tasks.forEach((taskId) => {
        const task = this.tasks.get(taskId);
        if (task && task.status === TaskStatus.PENDING) {
          task.status = TaskStatus.CANCELLED;
        }
      });

      this.logger.log(`Cancelled swarm execution: ${execution.name} (${executionId})`);
      this.emit('executionCancelled', execution);
      return true;
    }

    return false;
  }

  getExecution(executionId: string): SwarmExecution | undefined {
    return this.executions.get(executionId);
  }

  getExecutions(): SwarmExecution[] {
    return Array.from(this.executions.values());
  }

  getExecutionDetails(executionId: string): any {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return null;
    }

    const tasks = execution.tasks.map((taskId) => this.tasks.get(taskId)).filter(Boolean);
    const agents = execution.agents.map((agentId) => this.agents.get(agentId)).filter(Boolean);

    return {
      execution,
      tasks,
      agents,
      statistics: this.calculateExecutionStatistics(execution),
    };
  }

  // Task orchestration
  async orchestrate(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new BaseError(`Execution ${executionId} not found`, 'EXECUTION_NOT_FOUND');
    }

    const config = execution.metadata?.config as SwarmConfiguration;
    if (!config) {
      throw new BaseError('No configuration found for execution', 'MISSING_CONFIGURATION');
    }

    this.logger.log(`Orchestrating swarm execution: ${execution.name} (${executionId})`);

    try {
      await this.executeSwarmStrategy(execution, config);

      execution.status = 'completed';
      execution.endTime = new Date();

      this.logger.log(`Completed swarm execution: ${execution.name} (${executionId})`);
      this.emit('executionCompleted', execution);
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();

      this.logger.error(
        `Failed swarm execution: ${execution.name} (${executionId})`,
        error as Error,
      );
      this.emit('executionFailed', execution);
      throw error;
    }
  }

  private async executeSwarmStrategy(
    execution: SwarmExecution,
    config: SwarmConfiguration,
  ): Promise<void> {
    const tasks = execution.tasks
      .map((taskId) => this.tasks.get(taskId))
      .filter(Boolean) as SwarmTask[];

    switch (config.strategy.type) {
      case 'sequential':
        await this.executeSequential(tasks, config);
        break;
      case 'parallel':
        await this.executeParallel(tasks, config);
        break;
      case 'pipeline':
        await this.executePipeline(tasks, config);
        break;
      case 'hierarchical':
        await this.executeHierarchical(tasks, config);
        break;
      default:
        throw new BaseError(
          `Unsupported strategy type: ${config.strategy.type}`,
          'UNSUPPORTED_STRATEGY',
        );
    }
  }

  private async executeSequential(tasks: SwarmTask[], config: SwarmConfiguration): Promise<void> {
    this.logger.debug('Executing tasks sequentially');

    for (const task of tasks) {
      await this.executeTask(task, config);
    }
  }

  private async executeParallel(tasks: SwarmTask[], config: SwarmConfiguration): Promise<void> {
    this.logger.debug('Executing tasks in parallel');

    const promises = tasks.map((task) => this.executeTask(task, config));
    await Promise.allSettled(promises);
  }

  private async executePipeline(tasks: SwarmTask[], config: SwarmConfiguration): Promise<void> {
    this.logger.debug('Executing tasks in pipeline');

    // Sort tasks by dependencies
    const sortedTasks = this.topologicalSort(tasks);

    for (const task of sortedTasks) {
      await this.executeTask(task, config);
    }
  }

  private async executeHierarchical(tasks: SwarmTask[], config: SwarmConfiguration): Promise<void> {
    this.logger.debug('Executing tasks hierarchically');

    // Group tasks by priority and execute high priority first
    const tasksByPriority = this.groupTasksByPriority(tasks);

    for (const priority of ['urgent', 'high', 'medium', 'low']) {
      const priorityTasks = tasksByPriority[priority] || [];
      if (priorityTasks.length > 0) {
        await this.executeParallel(priorityTasks, config);
      }
    }
  }

  private async executeTask(task: SwarmTask, config: SwarmConfiguration): Promise<void> {
    // Find suitable agent
    const agent = this.findSuitableAgent(task, config);
    if (!agent) {
      throw new BaseError(`No suitable agent found for task: ${task.name}`, 'NO_SUITABLE_AGENT');
    }

    task.assignedAgentId = agent.id;
    task.status = TaskStatus.IN_PROGRESS;
    task.startedAt = new Date();

    this.logger.debug(`Assigned task ${task.name} to agent ${agent.name}`);
    this.emit('taskAssigned', { task, agent });

    try {
      // Execute task (this would integrate with actual agent execution)
      const result = await this.performTaskExecution(task, agent);

      task.status = TaskStatus.COMPLETED;
      task.completedAt = new Date();
      task.result = result;

      this.logger.debug(`Completed task: ${task.name}`);
      this.emit('taskCompleted', { task, agent, result });
    } catch (error) {
      task.status = TaskStatus.FAILED;
      task.completedAt = new Date();
      task.error = (error as Error).message;

      this.logger.error(`Failed task: ${task.name}`, error as Error);
      this.emit('taskFailed', { task, agent, error });
      throw error;
    }
  }

  private findSuitableAgent(task: SwarmTask, config: SwarmConfiguration): Agent | undefined {
    const availableAgents = this.getAvailableAgents();

    // Filter agents by required capabilities
    const capableAgents = availableAgents.filter((agent) =>
      task.requiredCapabilities.every((capability) => agent.capabilities.includes(capability)),
    );

    if (capableAgents.length === 0) {
      return undefined;
    }

    // Apply load balancing strategy
    switch (config.loadBalancing) {
      case 'round_robin':
        return capableAgents[0]; // Simplified round robin
      case 'capability_based':
        return this.selectBestCapabilityMatch(capableAgents, task);
      case 'load_based':
        return this.selectLeastLoadedAgent(capableAgents);
      default:
        return capableAgents[0];
    }
  }

  private selectBestCapabilityMatch(agents: Agent[], task: SwarmTask): Agent {
    // Select agent with most matching capabilities
    return agents.reduce((best, current) => {
      const bestMatches = best.capabilities.filter((cap) =>
        task.requiredCapabilities.includes(cap),
      ).length;
      const currentMatches = current.capabilities.filter((cap) =>
        task.requiredCapabilities.includes(cap),
      ).length;
      return currentMatches > bestMatches ? current : best;
    });
  }

  private selectLeastLoadedAgent(agents: Agent[]): Agent {
    // Select agent with least current tasks
    return agents.reduce((least, current) => {
      const leastLoad = least.currentTasks?.length || 0;
      const currentLoad = current.currentTasks?.length || 0;
      return currentLoad < leastLoad ? current : least;
    });
  }

  private async performTaskExecution(task: SwarmTask, agent: Agent): Promise<any> {
    // Simulate task execution - in production, this would delegate to the actual agent
    const executionTime = Math.random() * 2000 + 500; // 500-2500ms
    await new Promise((resolve) => setTimeout(resolve, executionTime));

    return {
      success: true,
      executionTime,
      agentId: agent.id,
      taskId: task.id,
      result: `Task ${task.name} completed by agent ${agent.name}`,
      timestamp: new Date(),
    };
  }

  private topologicalSort(tasks: SwarmTask[]): SwarmTask[] {
    const sorted: SwarmTask[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const taskMap = new Map(tasks.map((task) => [task.id, task]));

    const visit = (taskId: string) => {
      if (visiting.has(taskId)) {
        throw new BaseError('Circular dependency detected in tasks', 'CIRCULAR_DEPENDENCY');
      }
      if (visited.has(taskId)) {
        return;
      }

      const task = taskMap.get(taskId);
      if (!task) return;

      visiting.add(taskId);

      for (const depId of task.dependencies) {
        visit(depId);
      }

      visiting.delete(taskId);
      visited.add(taskId);
      sorted.push(task);
    };

    for (const task of tasks) {
      visit(task.id);
    }

    return sorted;
  }

  private groupTasksByPriority(tasks: SwarmTask[]): Record<string, SwarmTask[]> {
    return tasks.reduce(
      (groups, task) => {
        const priority = task.priority;
        if (!groups[priority]) {
          groups[priority] = [];
        }
        groups[priority].push(task);
        return groups;
      },
      {} as Record<string, SwarmTask[]>,
    );
  }

  private calculateExecutionStatistics(execution: SwarmExecution): any {
    const tasks = execution.tasks
      .map((taskId) => this.tasks.get(taskId))
      .filter(Boolean) as SwarmTask[];

    const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const failed = tasks.filter((t) => t.status === TaskStatus.FAILED).length;
    const pending = tasks.filter((t) => t.status === TaskStatus.PENDING).length;
    const inProgress = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;

    const totalDuration =
      execution.endTime && execution.startTime
        ? execution.endTime.getTime() - execution.startTime.getTime()
        : execution.startTime
          ? Date.now() - execution.startTime.getTime()
          : 0;

    return {
      totalTasks: tasks.length,
      completed,
      failed,
      pending,
      inProgress,
      successRate: tasks.length > 0 ? (completed / tasks.length) * 100 : 0,
      totalDuration,
      averageTaskDuration: this.calculateAverageTaskDuration(tasks),
      agentsUsed: new Set(tasks.map((t) => t.assignedAgentId).filter(Boolean)).size,
    };
  }

  private calculateAverageTaskDuration(tasks: SwarmTask[]): number {
    const completedTasks = tasks.filter((t) => t.completedAt && t.startedAt);
    if (completedTasks.length === 0) return 0;

    const totalDuration = completedTasks.reduce((sum, task) => {
      return sum + (task.completedAt!.getTime() - task.startedAt!.getTime());
    }, 0);

    return totalDuration / completedTasks.length;
  }

  private startTaskProcessor(): void {
    this.isProcessing = true;
    this.processTaskQueue();
  }

  private async processTaskQueue(): Promise<void> {
    while (this.isProcessing && this.state === ServiceState.RUNNING) {
      if (this.taskQueue.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      // Process tasks that are ready (dependencies met)
      const readyTasks = this.getReadyTasks();

      for (const taskId of readyTasks) {
        const task = this.tasks.get(taskId);
        if (task && task.status === TaskStatus.PENDING) {
          // Find execution for this task
          const execution = Array.from(this.executions.values()).find((exec) =>
            exec.tasks.includes(taskId),
          );

          if (execution && execution.status === 'running') {
            const config = execution.metadata?.config as SwarmConfiguration;
            if (config) {
              try {
                await this.executeTask(task, config);
              } catch (error) {
                this.logger.error(`Task execution failed: ${taskId}`, error as Error);
              }
            }
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private getReadyTasks(): string[] {
    return this.taskQueue.filter((taskId) => {
      const task = this.tasks.get(taskId);
      if (!task || task.status !== TaskStatus.PENDING) {
        return false;
      }

      // Check if all dependencies are completed
      return task.dependencies.every((depId) => {
        const depTask = this.tasks.get(depId);
        return depTask && depTask.status === TaskStatus.COMPLETED;
      });
    });
  }
}
