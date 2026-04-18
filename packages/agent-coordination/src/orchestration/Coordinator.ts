import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskResult,
  AgentInfo,
  ExecutionMode,
  CoordinationConfig,
} from '../core/types.js';
import { TaskQueue } from '../core/TaskQueue.js';
import { TaskAssigner } from '../core/TaskAssigner.js';
import { AgentPool } from '../core/AgentPool.js';

/**
 * Master coordinator for multi-agent task execution
 */
export class Coordinator extends EventEmitter {
  private taskQueue: TaskQueue;
  private taskAssigner: TaskAssigner;
  private agentPool: AgentPool;
  private activeTasks: Map<string, Task> = new Map();
  private taskResults: Map<string, TaskResult> = new Map();
  private isRunning: boolean = false;
  private processingInterval?: NodeJS.Timeout;

  constructor(
    redisUrl: string,
    agentPoolConfig: any,
    coordinationConfig?: CoordinationConfig
  ) {
    super();

    this.taskQueue = new TaskQueue(redisUrl);
    this.taskAssigner = new TaskAssigner(coordinationConfig);
    this.agentPool = new AgentPool(agentPoolConfig);

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Task queue events
    this.taskQueue.on('task:completed', (task: Task) => {
      this.handleTaskCompleted(task);
    });

    this.taskQueue.on('task:failed', (task: Task, error: Error) => {
      this.handleTaskFailed(task, error);
    });

    // Agent pool events
    this.agentPool.on('agent:registered', (agent: AgentInfo) => {
      this.emit('agent:registered', agent);
    });

    this.agentPool.on('agent:heartbeat:timeout', (agent: AgentInfo) => {
      this.handleAgentTimeout(agent);
    });

    // Task assigner events
    this.taskAssigner.on('assignment:created', (assignment) => {
      this.emit('assignment:created', assignment);
    });
  }

  /**
   * Start the coordinator
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Coordinator is already running');
    }

    this.isRunning = true;
    this.emit('coordinator:started');

    // Start processing loop
    this.processingInterval = setInterval(
      () => this.processNextTask(),
      1000
    );
  }

  /**
   * Stop the coordinator
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    await this.taskQueue.pauseAll();
    this.emit('coordinator:stopped');
  }

  /**
   * Submit a task for execution
   */
  async submitTask(
    type: string,
    payload: any,
    options: {
      priority?: TaskPriority;
      requiredCapabilities?: string[];
      dependencies?: Task['dependencies'];
      timeout?: number;
      maxRetries?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<Task> {
    const task: Task = {
      id: uuidv4(),
      type,
      priority: options.priority || TaskPriority.NORMAL,
      status: TaskStatus.PENDING,
      payload,
      requiredCapabilities: options.requiredCapabilities,
      dependencies: options.dependencies,
      timeout: options.timeout,
      maxRetries: options.maxRetries || 3,
      retryCount: 0,
      metadata: options.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      const dependenciesMet = await this.checkDependencies(task);
      if (!dependenciesMet) {
        task.status = TaskStatus.PENDING;
        this.emit('task:dependencies:pending', task);
        // Store task but don't queue yet
        this.activeTasks.set(task.id, task);
        return task;
      }
    }

    // Add to queue
    await this.taskQueue.addTask(task);
    task.status = TaskStatus.QUEUED;
    this.activeTasks.set(task.id, task);

    this.emit('task:submitted', task);
    return task;
  }

  /**
   * Submit multiple tasks (batch submission)
   */
  async submitTasks(
    tasks: Array<{
      type: string;
      payload: any;
      options?: any;
    }>
  ): Promise<Task[]> {
    const submittedTasks = await Promise.all(
      tasks.map((t) => this.submitTask(t.type, t.payload, t.options))
    );

    this.emit('tasks:batch:submitted', submittedTasks);
    return submittedTasks;
  }

  /**
   * Process next available task
   */
  private async processNextTask(): Promise<void> {
    if (!this.isRunning) return;

    const availableAgents = this.agentPool.getAvailableAgents();
    if (availableAgents.length === 0) {
      return; // No agents available
    }

    const task = await this.taskQueue.getNextTask();
    if (!task) {
      return; // No tasks in queue
    }

    // Assign task to agent
    const assignment = this.taskAssigner.assignTask(task, availableAgents);
    if (!assignment) {
      // Put task back in queue
      await this.taskQueue.addTask(task);
      return;
    }

    // Update task status
    task.status = TaskStatus.ASSIGNED;
    task.assignedAgentId = assignment.agentId;
    task.updatedAt = new Date();
    task.startedAt = new Date();

    // Update agent load
    this.agentPool.incrementAgentLoad(assignment.agentId);

    this.emit('task:assigned', task, assignment);

    // Execute task (this would typically send to the agent via message queue)
    this.executeTask(task, assignment.agentId);
  }

  /**
   * Execute a task on an agent
   */
  private async executeTask(task: Task, agentId: string): Promise<void> {
    task.status = TaskStatus.IN_PROGRESS;
    task.updatedAt = new Date();

    this.emit('task:started', task, agentId);

    // In a real implementation, this would send the task to the agent
    // For now, we'll simulate task execution
    // The actual execution would be handled by the agent
  }

  /**
   * Handle task completion
   */
  private handleTaskCompleted(task: Task): void {
    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();
    task.updatedAt = new Date();

    if (task.assignedAgentId) {
      this.agentPool.decrementAgentLoad(task.assignedAgentId);
      this.taskAssigner.removeAssignment(task.id);
    }

    this.emit('task:completed', task);

    // Check if any pending tasks were waiting for this task
    this.checkPendingDependencies(task.id);
  }

  /**
   * Handle task failure
   */
  private handleTaskFailed(task: Task, error: Error): void {
    task.retryCount = (task.retryCount || 0) + 1;

    if (task.retryCount < (task.maxRetries || 3)) {
      // Retry the task
      task.status = TaskStatus.QUEUED;
      task.updatedAt = new Date();
      this.taskQueue.addTask(task);
      this.emit('task:retrying', task, error);
    } else {
      // Max retries exceeded
      task.status = TaskStatus.FAILED;
      task.completedAt = new Date();
      task.updatedAt = new Date();

      if (task.assignedAgentId) {
        this.agentPool.decrementAgentLoad(task.assignedAgentId);
        this.taskAssigner.removeAssignment(task.id);
      }

      this.emit('task:failed', task, error);
    }
  }

  /**
   * Handle agent timeout
   */
  private handleAgentTimeout(agent: AgentInfo): void {
    // Reassign tasks from timed-out agent
    const assignments = this.taskAssigner.getAgentAssignments(agent.id);

    for (const assignment of assignments) {
      const task = this.activeTasks.get(assignment.taskId);
      if (task) {
        // Reset task and requeue
        task.status = TaskStatus.QUEUED;
        task.assignedAgentId = undefined;
        task.updatedAt = new Date();
        this.taskQueue.addTask(task);
        this.taskAssigner.removeAssignment(task.id);
        this.emit('task:reassigned', task);
      }
    }

    this.emit('agent:timeout', agent);
  }

  /**
   * Check if task dependencies are met
   */
  private async checkDependencies(task: Task): Promise<boolean> {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }

    for (const dep of task.dependencies) {
      const depTask = this.activeTasks.get(dep.taskId);
      if (!depTask || depTask.status !== TaskStatus.COMPLETED) {
        return false;
      }

      // Check conditional dependencies
      if (dep.type === 'conditional' && dep.condition) {
        const depResult = this.taskResults.get(dep.taskId);
        if (!depResult || !dep.condition(depResult.result)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check pending tasks that may now have dependencies met
   */
  private async checkPendingDependencies(completedTaskId: string): Promise<void> {
    const pendingTasks = Array.from(this.activeTasks.values()).filter(
      (t) => t.status === TaskStatus.PENDING
    );

    for (const task of pendingTasks) {
      const dependenciesMet = await this.checkDependencies(task);
      if (dependenciesMet) {
        await this.taskQueue.addTask(task);
        task.status = TaskStatus.QUEUED;
        this.emit('task:dependencies:met', task);
      }
    }
  }

  /**
   * Report task result (called by agents)
   */
  async reportTaskResult(result: TaskResult): Promise<void> {
    const task = this.activeTasks.get(result.taskId);
    if (!task) {
      throw new Error(`Task ${result.taskId} not found`);
    }

    this.taskResults.set(result.taskId, result);

    if (result.success) {
      this.handleTaskCompleted(task);
    } else {
      this.handleTaskFailed(task, result.error || new Error('Task failed'));
    }
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.activeTasks.get(taskId);
  }

  /**
   * Get all active tasks
   */
  getActiveTasks(): Task[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * Get coordinator statistics
   */
  async getStatistics() {
    const queueStats = await this.taskQueue.getStatistics();
    const poolStats = this.agentPool.getStatistics();
    const assignmentStats = this.taskAssigner.getStatistics();

    return {
      queue: queueStats,
      pool: poolStats,
      assignments: assignmentStats,
      activeTasks: this.activeTasks.size,
      completedTasks: Array.from(this.activeTasks.values()).filter(
        (t) => t.status === TaskStatus.COMPLETED
      ).length,
    };
  }

  /**
   * Emergency stop all tasks
   */
  async emergencyStop(): Promise<void> {
    await this.stop();
    await this.taskQueue.pauseAll();
    this.emit('coordinator:emergency:stop');
  }

  /**
   * Cleanup
   */
  async close(): Promise<void> {
    await this.stop();
    await this.taskQueue.close();
    this.agentPool.close();
    this.activeTasks.clear();
    this.taskResults.clear();
    this.removeAllListeners();
  }
}
