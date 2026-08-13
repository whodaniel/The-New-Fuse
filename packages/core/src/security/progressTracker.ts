import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Interface for task progress
export interface TaskProgress {
  taskId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number; // Percentage (0-100)
  message?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ProgressTrackerService {
  private readonly logger = new Logger(ProgressTrackerService.name);
  private tasks = new Map<string, TaskProgress>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Starts tracking a new task.
   */
  startTask(taskId: string, metadata?: Record<string, any>): TaskProgress {
    if (this.tasks.has(taskId)) {
      this.logger.warn(`Task with ID "${taskId}" is already being tracked.`);
      return this.tasks.get(taskId)!;
    }

    const task: TaskProgress = {
      taskId,
      status: 'pending',
      progress: 0,
      metadata,
    };

    this.tasks.set(taskId, task);
    this.eventEmitter.emit('task.started', task);
    this.logger.log(`Task started: ${taskId}`);
    return task;
  }

  /**
   * Updates the progress of an existing task.
   */
  updateProgress(taskId: string, progress: number, message?: string): TaskProgress | null {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.logger.warn(`Task with ID "${taskId}" not found for progress update.`);
      return null;
    }

    task.progress = Math.max(0, Math.min(100, progress));
    task.status = 'in-progress';
    if (message) {
      task.message = message;
    }

    this.eventEmitter.emit('task.progress', task);
    return task;
  }

  /**
   * Completes a task.
   */
  completeTask(taskId: string, message?: string): TaskProgress | null {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.logger.warn(`Task with ID "${taskId}" not found for completion.`);
      return null;
    }

    task.status = 'completed';
    task.progress = 100;
    if (message) {
      task.message = message;
    }

    this.eventEmitter.emit('task.completed', task);
    this.logger.log(`Task completed: ${taskId}`);
    return task;
  }

  /**
   * Marks a task as failed.
   */
  failTask(taskId: string, errorMessage: string): TaskProgress | null {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.logger.warn(`Task with ID "${taskId}" not found for failure.`);
      return null;
    }

    task.status = 'failed';
    task.message = errorMessage;

    this.eventEmitter.emit('task.failed', task);
    this.logger.error(`Task failed: ${taskId} - ${errorMessage}`);
    return task;
  }

  /**
   * Retrieves the status of a specific task.
   */
  getTaskStatus(taskId: string): TaskProgress | null {
    return this.tasks.get(taskId) || null;
  }
}
