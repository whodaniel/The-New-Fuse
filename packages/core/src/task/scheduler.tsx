import { Injectable } from '@nestjs/common';
import { TaskStatus, TaskStatusType, TaskMetadata, Task, TaskDependency } from './types.js';
import { EventEmitter } from 'events';
import { PriorityQueue } from './queue.js';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service.js';

const statusTransitions: Record<TaskStatusType, TaskStatusType[]> = {
  [TaskStatus.PENDING]: [TaskStatus.RUNNING, TaskStatus.CANCELLED],
  [TaskStatus.RUNNING]: [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED],
  [TaskStatus.COMPLETED]: [],
  [TaskStatus.FAILED]: [],
  [TaskStatus.CANCELLED]: [],
  [TaskStatus.PAUSED]: [TaskStatus.RUNNING, TaskStatus.CANCELLED]
};

function isTaskMetadata(metadata: unknown): metadata is TaskMetadata {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    typeof (metadata as TaskMetadata).createdBy === 'string' &&
    (typeof (metadata as TaskMetadata).startTime === 'undefined' || (metadata as TaskMetadata).startTime instanceof Date) &&
    (typeof (metadata as TaskMetadata).endTime === 'undefined' || (metadata as TaskMetadata).endTime instanceof Date)
  );
}

class TaskSchedulerError extends Error {
  originalError?: unknown;

  constructor(message: string, originalError?: unknown) {
    super(message);
    this.originalError = originalError;
  }
}

class TaskValidationError extends TaskSchedulerError {
  constructor(message: string) {
    super(`Validation Error: ${message}`);
    this.name = 'TaskValidationError';
  }
}

class TaskDependencyError extends TaskSchedulerError {
  constructor(message: string) {
    super(`Dependency Error: ${message}`);
    this.name = 'TaskDependencyError';
  }
}

class TaskStateError extends TaskSchedulerError {
  constructor(message: string) {
    super(`State Error: ${message}`);
    this.name = 'TaskStateError';
  }
}

@Injectable()
export class TaskScheduler extends EventEmitter {
  private readonly maxConcurrent: number;
  private readonly taskTimeouts: Map<string, NodeJS.Timeout>;

  constructor(
    private readonly queue: PriorityQueue,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    super();
    this.maxConcurrent = this.configService.get<number>('MAX_CONCURRENT_TASKS', 10);
    this.taskTimeouts = new Map<string, NodeJS.Timeout>();
  }

  private async updateTaskStatus(task: Task, newStatus: TaskStatusType, queue: PriorityQueue): Promise<void> {
    if (!statusTransitions[task.status as TaskStatusType]?.includes(newStatus)) {
      throw new TaskSchedulerError(`Invalid status transition: ${task.status} -> ${newStatus}`);
    }
    try {
      task.status = newStatus;
      await queue.update(task);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Error updating task status:`, errorMessage);
      throw error;
    }
  }

  async schedule(task: Task): Promise<void> {
    try {
      if (!task) {
        throw new TaskValidationError('Task object is required');
      }

      if (!task.id || !task.type) {
        throw new TaskValidationError('Task must have an id and type');
      }

      if (!task.metadata || !isTaskMetadata(task.metadata)) {
        throw new TaskValidationError('Invalid task metadata');
      }

      task.status = TaskStatus.PENDING;

      await this.updateTaskStatus(task, TaskStatus.PENDING, this.queue);

      const canSchedule = await this.canSchedule(task);
      if (canSchedule) {
        if (!task.metadata) task.metadata = {};
        task.metadata.startTime = new Date();
        
        // Set deadline timeout if applicable
        if (task.metadata && task.metadata.endTime instanceof Date) {
          this.setDeadlineTimeout(task, task.metadata.endTime);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`[TaskScheduler] Schedule error for task ${task?.id}: ${errorMessage}`);
      if (error instanceof TaskSchedulerError) {
        throw error;
      }
      throw new TaskSchedulerError(`Failed to schedule task: ${errorMessage}`, error);
    }
  }

  private async canSchedule(task: Task): Promise<boolean> {
    try {
      // Check if all dependencies are met
      if (Array.isArray(task.dependencies) && task.dependencies.length > 0) {
        for (const dep of task.dependencies) {
          const depTask = await this.queue.getTask(dep.taskId);
          if (!depTask) {
            throw new TaskDependencyError(`Dependency task ${dep.taskId} not found`);
          }

          if (dep.type === 'hard' && depTask.status !== TaskStatus.COMPLETED) {
            return false;
          }
        }
      }

      // Check if we have available slots
      const runningTasks = await this.getRunningTasks();
      const availableSlots = this.maxConcurrent - runningTasks.length;
      return availableSlots > 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Error checking canSchedule for task ${task.id}: ${errorMessage}`);
      throw new TaskSchedulerError(`Failed to check canSchedule: ${errorMessage}`);
    }
  }

  private async getRunningTasks(): Promise<Task[]> {
    try {
      const tasks: Task[] = await this.queue.getTasksByStatus(TaskStatus.RUNNING);
      return tasks;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error getting running tasks:', errorMessage);
      throw new TaskSchedulerError(`Failed to get running tasks: ${errorMessage}`);
    }
  }

  private async getPendingTasks(): Promise<Task[]> {
    try {
      const tasks: Task[] = await this.queue.getTasksByStatus(TaskStatus.PENDING);
      return tasks;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error getting pending tasks:', errorMessage);
      throw new TaskSchedulerError(`Failed to get pending tasks: ${errorMessage}`);
    }
  }

  private async sortTasksByPriority(tasks: Task[]): Promise<Task[]> {
    try {
      return [...tasks].sort((a, b) => {
        // Sort by priority first
        if ((b.priority || 0) !== (a.priority || 0)) {
          return (b.priority || 0) - (a.priority || 0);
        }

        // Then by deadline if exists
        const aDeadline = a.metadata?.endTime instanceof Date ? a.metadata.endTime.getTime() : Infinity;
        const bDeadline = b.metadata?.endTime instanceof Date ? b.metadata.endTime.getTime() : Infinity;
        if (aDeadline !== bDeadline) {
          return aDeadline - bDeadline;
        }

        // Then by creation time
        return (a.createdAt || 0).valueOf() - (b.createdAt || 0).valueOf();
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error sorting tasks by priority:', errorMessage);
      throw new TaskSchedulerError(`Failed to sort tasks by priority: ${errorMessage}`);
    }
  }

  private setDeadlineTimeout(task: Task, deadline: Date): void {
    try {
      if (!deadline) {
        return;
      }

      const timeout = setTimeout(async () => {
        const currentTask = await this.queue.getTask(task.id);
        if (currentTask && currentTask.status === TaskStatus.PENDING) {
          await this.cancel(task.id);
        }
      }, deadline.getTime() - Date.now());

      this.taskTimeouts.set(task.id, timeout);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Error setting deadline timeout for task ${task.id}:`, errorMessage);
      throw new TaskSchedulerError(`Failed to set deadline timeout: ${errorMessage}`);
    }
  }

  async cancel(taskId: string): Promise<void> {
    if (!taskId) {
      throw new TaskValidationError('Task ID is required');
    }

    try {
      const task = await this.queue.getTask(taskId);
      if (!task) {
        throw new TaskStateError(`Task ${taskId} not found`);
      }

      await this.updateTaskStatus(task, TaskStatus.CANCELLED, this.queue);
      
      // Clear timeout if exists
      const timeout = this.taskTimeouts.get(taskId);
      if (timeout) {
        clearTimeout(timeout);
        this.taskTimeouts.delete(taskId);
      }
      
      this.emit('task:cancelled', task);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`[TaskScheduler] Cancel error for task ${taskId}: ${errorMessage}`);
      if (error instanceof TaskSchedulerError) {
        throw error;
      }
      throw new TaskSchedulerError(`Failed to cancel task: ${errorMessage}`, error);
    }
  }

  private async optimizeExecution(task: Task): Promise<void> {
    try {
      const runningTasks = await this.getRunningTasks();
      const remainingSlots = this.maxConcurrent - runningTasks.length;

      if (remainingSlots <= 0) {
        return;
      }

      const pendingTasks = await this.getPendingTasks();
      if (pendingTasks.length === 0) {
        return;
      }

      const sortedTasks = await this.sortTasksByPriority(pendingTasks);
      for (const task of sortedTasks.slice(0, remainingSlots)) {
        try {
          if (await this.canSchedule(task)) {
            await this.updateTaskStatus(task, TaskStatus.RUNNING, this.queue);
            if (!task.metadata) task.metadata = {};
            task.metadata.startTime = new Date();
          }
        } catch (taskError) {
          console.error(`[TaskScheduler] Failed to schedule task ${task.id} during optimization: ${
            taskError instanceof Error ? taskError.message : 'Unknown error'
          }`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`[TaskScheduler] Optimization error: ${errorMessage}`);
    }
  }

  private async increasePriority(taskId: string): Promise<void> {
    try {
      const task = await this.queue.getTask(taskId);
      if (!task) {
        throw new TaskStateError(`Task ${taskId} not found`);
      }

      task.priority = (task.priority || 0) + 1;
      await this.queue.update(task);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Error increasing priority of task ${taskId}: ${errorMessage}`);
      throw new TaskSchedulerError(`Failed to increase priority: ${errorMessage}`);
    }
  }

  private async validateTaskDependencies(task: Task): Promise<void> {
    if (!task.dependencies) {
      task.dependencies = [];
      return;
    }

    if (!Array.isArray(task.dependencies)) {
      throw new TaskValidationError('Task dependencies must be an array');
    }

    for (const dep of task.dependencies) {
      if (dep.type === 'hard' && dep.taskId) {
        const depTask = await this.queue.getTask(dep.taskId);
        if (!depTask) {
          throw new TaskDependencyError(`Required dependency ${dep.taskId} not found`);
        }
      }
    }
  }

  private async updateDependentTasks(taskId: string): Promise<void> {
    try {
      const task = await this.queue.getTask(taskId);
      if (!task) {
        return;
      }

      const dependentTasks = await this.queue.getTasksByDependency(taskId);
      for (const depTask of dependentTasks) {
        try {
          await this.validateTaskDependencies(depTask);
          const canSchedule = await this.canSchedule(depTask);
          if (canSchedule) {
            await this.updateTaskStatus(depTask, TaskStatus.RUNNING, this.queue);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error(`Error updating dependent tasks for ${taskId}:`, errorMessage);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Error updating dependent tasks for ${taskId}:`, errorMessage);
    }
  }
}
