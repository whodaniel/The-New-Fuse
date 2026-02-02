/**
 * Task Manager for TNF CLI
 *
 * Implements A2A protocol Task lifecycle management with
 * state tracking, artifact management, and dependency resolution.
 */

import { v4 as uuidv4 } from 'uuid';
import { Logger } from './logger.js';
import { AgentMessage, Artifact, Task, TaskCreateRequest, TaskError, TaskState } from './types.js';

export class TaskManager {
  private tasks: Map<string, Task> = new Map();
  private listeners: Map<string, Set<(task: Task) => void>> = new Map();
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger =
      logger ||
      new Logger({
        level: 'info',
        format: 'pretty',
        output: 'console',
        includeTraceId: true,
      });
  }

  /**
   * Create a new task
   */
  createTask(request: TaskCreateRequest, createdBy: string): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: `task_${uuidv4()}`,
      contextId: `ctx_${uuidv4()}`,
      title: request.title,
      description: request.description,
      status: {
        state: TaskState.Submitted,
        timestamp: now,
      },
      assignedTo: request.assignedTo,
      createdBy,
      history: [],
      artifacts: [],
      metadata: {
        priority: request.priority || 'normal',
        tags: request.tags || [],
        deadline: request.deadline,
        dependencies: request.dependencies || [],
        ...request.metadata,
      },
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(task.id, task);
    this.notifyListeners(task);

    this.logger.info(`Task created: ${task.id}`, {
      taskId: task.id,
      title: task.title,
      createdBy,
      priority: task.metadata?.priority,
    });

    return task;
  }

  /**
   * Get a task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks by state
   */
  getTasksByState(state: TaskState): Task[] {
    return this.getAllTasks().filter((task) => task.status.state === state);
  }

  /**
   * Get tasks assigned to a specific agent
   */
  getTasksByAssignee(agentId: string): Task[] {
    return this.getAllTasks().filter((task) => task.assignedTo === agentId);
  }

  /**
   * Update task status
   */
  updateTaskStatus(
    taskId: string,
    state: TaskState,
    message?: string,
    progress?: number,
    error?: TaskError
  ): Task {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new TaskManagerError(`Task ${taskId} not found`, 'TASK_NOT_FOUND');
    }

    const oldState = task.status.state;
    const now = new Date().toISOString();

    task.status = {
      state,
      message,
      timestamp: now,
      progress,
      error,
    };
    task.updatedAt = now;

    if (
      state === TaskState.Completed ||
      state === TaskState.Failed ||
      state === TaskState.Canceled
    ) {
      task.completedAt = now;
    }

    this.tasks.set(taskId, task);
    this.notifyListeners(task);

    this.logger.info(`Task ${taskId} status changed: ${oldState} -> ${state}`, {
      taskId,
      oldState,
      newState: state,
      progress,
    });

    return task;
  }

  /**
   * Assign task to an agent
   */
  assignTask(taskId: string, agentId: string): Task {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new TaskManagerError(`Task ${taskId} not found`, 'TASK_NOT_FOUND');
    }

    task.assignedTo = agentId;
    task.updatedAt = new Date().toISOString();

    this.tasks.set(taskId, task);
    this.notifyListeners(task);

    this.logger.info(`Task ${taskId} assigned to ${agentId}`, {
      taskId,
      assignedTo: agentId,
    });

    return task;
  }

  /**
   * Add message to task history
   */
  addMessage(taskId: string, message: AgentMessage): Task {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new TaskManagerError(`Task ${taskId} not found`, 'TASK_NOT_FOUND');
    }

    task.history.push(message);
    task.updatedAt = new Date().toISOString();

    this.tasks.set(taskId, task);
    this.notifyListeners(task);

    return task;
  }

  /**
   * Add artifact to task
   */
  addArtifact(taskId: string, artifact: Omit<Artifact, 'artifactId' | 'createdAt'>): Task {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new TaskManagerError(`Task ${taskId} not found`, 'TASK_NOT_FOUND');
    }

    const fullArtifact: Artifact = {
      ...artifact,
      artifactId: `art_${uuidv4()}`,
      createdAt: new Date().toISOString(),
    };

    task.artifacts.push(fullArtifact);
    task.updatedAt = new Date().toISOString();

    this.tasks.set(taskId, task);
    this.notifyListeners(task);

    this.logger.info(`Artifact added to task ${taskId}: ${fullArtifact.artifactId}`, {
      taskId,
      artifactId: fullArtifact.artifactId,
      artifactName: fullArtifact.name,
    });

    return task;
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string, reason?: string): Task {
    return this.updateTaskStatus(taskId, TaskState.Canceled, reason || 'Task canceled');
  }

  /**
   * Check if all dependencies are completed
   */
  areDependenciesMet(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    const dependencies = task.metadata?.dependencies || [];
    if (dependencies.length === 0) return true;

    return dependencies.every((depId) => {
      const dep = this.tasks.get(depId);
      return dep?.status.state === TaskState.Completed;
    });
  }

  /**
   * Get tasks ready to execute (dependencies met)
   */
  getReadyTasks(): Task[] {
    return this.getTasksByState(TaskState.Submitted).filter((task) =>
      this.areDependenciesMet(task.id)
    );
  }

  /**
   * Subscribe to task updates
   */
  subscribe(taskId: string, callback: (task: Task) => void): () => void {
    if (!this.listeners.has(taskId)) {
      this.listeners.set(taskId, new Set());
    }

    this.listeners.get(taskId)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(taskId)?.delete(callback);
    };
  }

  /**
   * Subscribe to all task updates
   */
  subscribeAll(callback: (task: Task) => void): () => void {
    return this.subscribe('*', callback);
  }

  private notifyListeners(task: Task): void {
    // Notify task-specific listeners
    this.listeners.get(task.id)?.forEach((callback) => {
      try {
        callback(task);
      } catch (error) {
        this.logger.error('Error in task listener', { taskId: task.id }, error as Error);
      }
    });

    // Notify global listeners
    this.listeners.get('*')?.forEach((callback) => {
      try {
        callback(task);
      } catch (error) {
        this.logger.error('Error in global task listener', { taskId: task.id }, error as Error);
      }
    });
  }

  /**
   * Get task statistics
   */
  getStats(): {
    total: number;
    byState: Record<TaskState, number>;
    completionRate: number;
    averageCompletionTime: number;
  } {
    const allTasks = this.getAllTasks();
    const byState = {} as Record<TaskState, number>;

    Object.values(TaskState).forEach((state) => {
      byState[state] = allTasks.filter((t) => t.status.state === state).length;
    });

    const completed = allTasks.filter((t) => t.status.state === TaskState.Completed);
    const completionRate = allTasks.length > 0 ? completed.length / allTasks.length : 0;

    const completionTimes = completed
      .filter((t) => t.completedAt)
      .map((t) => new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime());

    const averageCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;

    return {
      total: allTasks.length,
      byState,
      completionRate,
      averageCompletionTime,
    };
  }

  /**
   * Clean up completed/canceled tasks older than specified age
   */
  cleanup(maxAgeMs: number): number {
    const now = Date.now();
    let removed = 0;

    for (const [taskId, task] of this.tasks) {
      if (
        task.status.state === TaskState.Completed ||
        task.status.state === TaskState.Canceled ||
        task.status.state === TaskState.Failed
      ) {
        const taskTime = new Date(task.updatedAt).getTime();
        if (now - taskTime > maxAgeMs) {
          this.tasks.delete(taskId);
          this.listeners.delete(taskId);
          removed++;
        }
      }
    }

    this.logger.info(`Cleaned up ${removed} old tasks`, { removed });
    return removed;
  }

  /**
   * Export tasks to JSON
   */
  exportTasks(): string {
    return JSON.stringify(
      this.getAllTasks(),
      (key, value) => {
        if (value instanceof Map) {
          return Object.fromEntries(value);
        }
        if (value instanceof Set) {
          return Array.from(value);
        }
        return value;
      },
      2
    );
  }

  /**
   * Import tasks from JSON
   */
  importTasks(jsonString: string): void {
    try {
      const tasks: Task[] = JSON.parse(jsonString);
      tasks.forEach((task) => {
        this.tasks.set(task.id, task);
      });
      this.logger.info(`Imported ${tasks.length} tasks`);
    } catch (error) {
      throw new TaskManagerError('Failed to import tasks', 'IMPORT_ERROR', error);
    }
  }
}

export class TaskManagerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: any
  ) {
    super(message);
    this.name = 'TaskManagerError';
  }
}

// Task state transition validation
export const VALID_STATE_TRANSITIONS: Record<TaskState, TaskState[]> = {
  [TaskState.Submitted]: [TaskState.Working, TaskState.Rejected, TaskState.Canceled],
  [TaskState.Working]: [
    TaskState.InputRequired,
    TaskState.Completed,
    TaskState.Failed,
    TaskState.Canceled,
  ],
  [TaskState.InputRequired]: [TaskState.Working, TaskState.Canceled],
  [TaskState.Completed]: [], // Terminal state
  [TaskState.Canceled]: [], // Terminal state
  [TaskState.Failed]: [TaskState.Working], // Can retry
  [TaskState.Rejected]: [], // Terminal state
  [TaskState.AuthRequired]: [TaskState.Working, TaskState.Failed],
  [TaskState.Unknown]: Object.values(TaskState),
};

/**
 * Check if a state transition is valid
 */
export function isValidStateTransition(from: TaskState, to: TaskState): boolean {
  const validTransitions = VALID_STATE_TRANSITIONS[from] || [];
  return validTransitions.includes(to);
}
