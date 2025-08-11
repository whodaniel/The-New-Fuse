import { EventEmitter } from 'events';
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface Task {
  id: string;
  type: string;
  payload: any;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  agentId?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  retries: number;
  maxRetries: number;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'busy' | 'offline';
  capabilities: string[];
  currentTaskId?: string;
  lastActivity: Date;
}

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable()
export class AgentOrchestrator extends EventEmitter {
  private readonly logger = new Logger(AgentOrchestrator.name);
  private readonly tasks = new Map<string, Task>();
  private readonly agents = new Map<string, Agent>();
  private readonly taskQueue: string[] = [];

  constructor() {
    super();
    this.logger.log('AgentOrchestrator initialized');
  }

  addTask(task: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'retries'>): string {
    const taskId = uuidv4();
    const newTask: Task = {
      ...task,
      id: taskId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      retries: 0
    };

    this.tasks.set(taskId, newTask);
    this.taskQueue.push(taskId);
    this.emit('taskAdded', newTask);
    this.logger.log(`Task added: ${taskId}`);

    // Try to assign immediately
    this.tryAssignTask();
    return taskId;
  }

  async executeTask(taskId: string): Promise<TaskResult> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status !== 'pending') {
      throw new Error(`Task ${taskId} is not in pending state`);
    }

    try {
      // Wait for an available agent if none are free
      const agent = await this.getAvailableAgent();
      if (!agent) {
        await new Promise((resolve) => this.once('agentAvailable', resolve));
      }

      this.logger.log(`Executing task ${taskId}`);
      task.status = 'in_progress';
      task.updatedAt = new Date();
      this.emit('taskStarted', task);

      // Simulate task execution - replace with actual agent communication
      const result = await this.performTask(task);
      task.status = result.success ? 'completed' : 'failed';
      task.updatedAt = new Date();
      this.emit('taskCompleted', task);

      return result;
    } catch (error) {
      task.status = 'failed';
      task.updatedAt = new Date();
      this.emit('taskFailed', { task, error });
      throw error;
    }
  }

  getTaskStatus(taskId: string): string | undefined {
    const task = this.tasks.get(taskId);
    return task?.status;
  }

  getPendingTasks(): Task[] {
    return Array.from(this.tasks.values()).filter(task => task.status === 'pending');
  }

  getRunningTasks(): Task[] {
    return Array.from(this.tasks.values()).filter(task => task.status === 'in_progress');
  }

  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'pending') {
      return false;
    }

    task.status = 'failed';
    task.updatedAt = new Date();
    this.emit('taskCancelled', task);

    // Remove from queue
    const index = this.taskQueue.indexOf(taskId);
    if (index > -1) {
      this.taskQueue.splice(index, 1);
    }

    return true;
  }

  retryTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'failed' || task.retries >= task.maxRetries) {
      return false;
    }

    task.status = 'pending';
    task.retries += 1;
    task.updatedAt = new Date();
    this.taskQueue.push(taskId);
    this.emit('taskRetried', task);
    this.tryAssignTask();

    return true;
  }

  registerAgent(agent: Omit<Agent, 'lastActivity'>): void {
    const newAgent: Agent = {
      ...agent,
      lastActivity: new Date()
    };

    this.agents.set(agent.id, newAgent);
    this.emit('agentRegistered', newAgent);
    this.logger.log(`Agent registered: ${agent.id}`);

    if (newAgent.status === 'idle') {
      this.emit('agentAvailable', newAgent);
    }
  }

  private async getAvailableAgent(): Promise<Agent | null> {
    for (const agent of this.agents.values()) {
      if (agent.status === 'idle') {
        return agent;
      }
    }
    return null;
  }

  private async tryAssignTask(): Promise<void> {
    if (this.taskQueue.length === 0) {
      return;
    }

    const agent = await this.getAvailableAgent();
    if (agent) {
      const taskId = this.taskQueue.shift();
      if (taskId) {
        await this.executeTask(taskId);
      }
    }
  }

  private async performTask(task: Task): Promise<TaskResult> {
    // Placeholder for actual task execution logic
    // This would interface with specific agents based on task type
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
      return { success: true, data: `Task ${task.id} completed` };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getAgentById(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getActiveAgents(): Agent[] {
    return Array.from(this.agents.values()).filter(agent => agent.status !== 'offline');
  }
}