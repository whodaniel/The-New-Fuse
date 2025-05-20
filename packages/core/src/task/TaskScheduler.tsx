import { Injectable } from '@nestjs/common';
import { Task, TaskStatus, TaskPriority } from './types.js';
import { Logger } from '@the-new-fuse/utils';
import { TaskRepository } from '@the-new-fuse/database';
import { TaskExecutor } from './TaskExecutor.js';
import { EventEmitter } from 'events';
import { FindOneOptions } from 'typeorm';
import { TaskQueue } from './TaskQueue.js';

interface ScheduledTask<T> extends Task<T> {
  cronTime: string;
  lastRun?: Date;
  nextRun?: Date;
}

interface TaskSchedulerOptions<T> {
  onTaskScheduled?: (task: ScheduledTask<T>) => void;
  onTaskCompleted?: (result: any, task: ScheduledTask<T>) => void;
  onTaskError?: (error: Error, task: ScheduledTask<T>) => void;
}

@Injectable()
export class TaskScheduler<T> extends EventEmitter {
  private logger: Logger;
  private isRunning: boolean = false;
  private schedulerInterval: NodeJS.Timeout;
  private taskQueue: TaskQueue<T>;
  private scheduledTasks: Map<string, ScheduledTask<T>> = new Map();
  private cronJobs: Map<string, any> = new Map(); // Using any for cron job instance type
  private options: TaskSchedulerOptions<T>;

  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly taskExecutor: TaskExecutor,
    options?: TaskSchedulerOptions<T>,
    taskQueueOptions?: any
  ) {
    super();
    this.taskQueue = new TaskQueue<T>(taskQueueOptions);
    this.options = options || {}; // Added semicolon and initialization
  }

  onModuleInit() {
    this.logger = new Logger(TaskScheduler.name);
  }

  async startScheduler(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.schedulerInterval = setInterval(async () => {
      if (!this.isRunning) {
        return;
      }

      try {
        // Get all pending tasks
        const pendingTasks = await this.taskRepository.find({ where: { status: TaskStatus.PENDING } });

        // Sort tasks by priority and creation time
        const sortedTasks = this.sortTasks(pendingTasks);

        // Schedule each task
        for (const task of sortedTasks) {
          await this.scheduleTask(task);
        }
      } catch (error) {
        this.logger.error('Error in task scheduler:', error);
      }
    }, 1000);
  }

  async stopScheduler(): Promise<void> {
    this.isRunning = false;
    clearInterval(this.schedulerInterval);
  }

  private sortTasks(tasks: Task[]): Task[] {
    return tasks.sort((a, b) => {
      // First sort by priority (higher priority first)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }

      // Then sort by creation time (older first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  private async scheduleTask(task: Task): Promise<void> {
    try {
      // Check if task can be executed
      if (!await this.canExecuteTask(task)) {
        return;
      }

      // Update task status
      task.status = TaskStatus.RUNNING;
      await this.taskRepository.save(task);

      // Execute the task
      await this.taskExecutor.execute(task);

      // On success, mark the task as completed
      task.status = TaskStatus.COMPLETED;
      await this.taskRepository.save(task);
    } catch (error) {
      this.logger.error(`Error scheduling task ${task.id}:`, error);

      // On error, mark the task as failed
      task.status = TaskStatus.FAILED;
      await this.taskRepository.save(task);
    }
  }

  private async canExecuteTask(task: Task): Promise<boolean> {
    // Check if task has dependencies
    if (!task.dependencies?.length) {
      return true;
    }

    // Check each dependency
    for (const dependency of task.dependencies) {
      const dependentTask = await this.taskRepository.findOne({ where: { id: dependency.taskId } });

      if (!dependentTask) {
        this.logger.warn(`Dependent task ${dependency.taskId} not found for task ${task.id}`);
        continue;
      }

      // For hard dependencies, the dependent task must be completed
      if (dependency.type === 'hard' && dependentTask.status !== TaskStatus.COMPLETED) {
        return false;
      }

      // For soft dependencies, we can proceed if the task is either completed or failed
      if (dependency.type === 'soft' && 
          ![TaskStatus.COMPLETED, TaskStatus.FAILED].includes(dependentTask.status)) {
        return false;
      }
    }

    return true;
  }

  async scheduleTaskWithPriority(taskId: string, priority: TaskPriority): Promise<void> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.priority = priority;
    await this.taskRepository.save(task);
  }

  async retryTask(taskId: string): Promise<void> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = TaskStatus.PENDING;
    task.scheduled = null;
    await this.taskRepository.save(task);
  }

  isSchedulerRunning(): boolean {
    return this.isRunning;
  }

  schedule(id: string, cronTime: string, payload: T, taskOptions?: Partial<Task<T>>): void {
    if (this.scheduledTasks.has(id)) {
      throw new Error(`Task with id ${id} is already scheduled.`);
    }

    const task: ScheduledTask<T> = {
      id,
      cronTime,
      payload,
      execute: async () => { /* execution logic */ }, // Placeholder
      status: 'pending',
      createdAt: new Date(), // Added comma
      ...taskOptions,
    };

    this.scheduledTasks.set(id, task);
    // Placeholder for cron job creation, assuming a library like node-cron
    // const job = new CronJob(cronTime, () => this.runScheduledTask(id), null, true, 'America/Los_Angeles');
    // this.cronJobs.set(id, job);
    // job.start();
    this.options.onTaskScheduled?.(task);
  }

  private async runScheduledTask(id: string): Promise<void> {
    const task = this.scheduledTasks.get(id);
    if (!task) return;

    try {
      // Add to the queue, let the queue handle execution
      const taskIdInQueue = this.taskQueue.add(task.payload, task.priority);
      // We might want to link taskIdInQueue back to the scheduled task if needed for tracking
      task.lastRun = new Date();
      // Calculate next run if possible (depends on cron library)
      // task.nextRun = calculateNextRun(task.cronTime);
      this.scheduledTasks.set(id, task); // Update task details
    } catch (error) {
      this.options.onTaskError?.(error as Error, task);
    }
  }

  unschedule(id: string): void {
    const job = this.cronJobs.get(id);
    if (job) {
      // job.stop(); // Stop cron job
      this.cronJobs.delete(id);
    }
    this.scheduledTasks.delete(id);
  }

  getScheduledTasks(): ScheduledTask<T>[] {
    return Array.from(this.scheduledTasks.values());
  }

  getTaskQueue(): TaskQueue<T> {
    return this.taskQueue;
  }
}
