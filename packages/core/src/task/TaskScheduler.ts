import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TaskManager } from './TaskManager';
import { TaskService } from './TaskService';
import { TaskCreationOptions } from './TaskService';

export interface ScheduledTask {
  id: string;
  name: string;
  cron: string;
  taskOptions: TaskCreationOptions;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

@Injectable()
export class TaskScheduler {
  private readonly logger = new Logger(TaskScheduler.name);
  private readonly scheduledTasks = new Map<string, ScheduledTask>();

  constructor(
    private readonly taskManager: TaskManager,
    private readonly taskService: TaskService
  ) {}

  async scheduleTask(task: ScheduledTask): Promise<void> {
    this.scheduledTasks.set(task.id, {
      ...task,
      nextRun: this.calculateNextRun(task.cron)
    });
    
    this.logger.log(`Scheduled task ${task.name} with cron ${task.cron}`);
  }

  async unscheduleTask(taskId: string): Promise<boolean> {
    const removed = this.scheduledTasks.delete(taskId);
    if (removed) {
      this.logger.log(`Unscheduled task ${taskId}`);
    }
    return removed;
  }

  async getScheduledTasks(): Promise<ScheduledTask[]> {
    return Array.from(this.scheduledTasks.values());
  }

  async getScheduledTask(taskId: string): Promise<ScheduledTask | undefined> {
    return this.scheduledTasks.get(taskId);
  }

  async enableTask(taskId: string): Promise<boolean> {
    const task = this.scheduledTasks.get(taskId);
    if (task) {
      task.enabled = true;
      task.nextRun = this.calculateNextRun(task.cron);
      return true;
    }
    return false;
  }

  async disableTask(taskId: string): Promise<boolean> {
    const task = this.scheduledTasks.get(taskId);
    if (task) {
      task.enabled = false;
      return true;
    }
    return false;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCronJobs(): Promise<void> {
    const now = new Date();
    
    for (const task of this.scheduledTasks.values()) {
      if (!task.enabled) continue;
      
      if (task.nextRun && task.nextRun <= now) {
        try {
          this.logger.log(`Executing scheduled task: ${task.name}`);
          
          await this.taskService.executeTaskWithQueue(task.taskOptions);
          
          task.lastRun = now;
          task.nextRun = this.calculateNextRun(task.cron);
          
          this.logger.log(`Completed scheduled task: ${task.name}`);
        } catch (error) {
          this.logger.error(`Failed to execute scheduled task ${task.name}:`, error);
        }
      }
    }
  }

  private calculateNextRun(cronExpression: string): Date {
    // Simple cron parser for basic expressions
    const now = new Date();
    const nextRun = new Date(now);
    
    // Handle basic cron patterns
    if (cronExpression === CronExpression.EVERY_MINUTE) {
      nextRun.setMinutes(nextRun.getMinutes() + 1);
    } else if (cronExpression === CronExpression.EVERY_5_MINUTES) {
      nextRun.setMinutes(Math.ceil(nextRun.getMinutes() / 5) * 5);
    } else if (cronExpression === CronExpression.EVERY_10_MINUTES) {
      nextRun.setMinutes(Math.ceil(nextRun.getMinutes() / 10) * 10);
    } else if (cronExpression === CronExpression.EVERY_30_MINUTES) {
      nextRun.setMinutes(Math.ceil(nextRun.getMinutes() / 30) * 30);
    } else if (cronExpression === CronExpression.EVERY_HOUR) {
      nextRun.setHours(nextRun.getHours() + 1);
      nextRun.setMinutes(0);
    } else if (cronExpression === CronExpression.EVERY_DAY_AT_MIDNIGHT) {
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(0, 0, 0, 0);
    } else {
      // Default to next minute for unknown patterns
      nextRun.setMinutes(nextRun.getMinutes() + 1);
    }
    
    return nextRun;
  }

  async createRecurringTask(
    name: string,
    cron: string,
    taskOptions: TaskCreationOptions,
    enabled: boolean = true
  ): Promise<ScheduledTask> {
    const task: ScheduledTask = {
      id: `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      cron,
      taskOptions,
      enabled,
      nextRun: this.calculateNextRun(cron)
    };

    await this.scheduleTask(task);
    return task;
  }

  async createOneTimeTask(
    taskOptions: TaskCreationOptions,
    delay: number
  ): Promise<string> {
    const taskId = `delayed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setTimeout(async () => {
      try {
        await this.taskService.executeTaskWithQueue(taskOptions);
        this.logger.log(`Executed delayed task: ${taskId}`);
      } catch (error) {
        this.logger.error(`Failed to execute delayed task ${taskId}:`, error);
      }
    }, delay);

    return taskId;
  }

  async cleanup(): Promise<void> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [taskId, task] of this.scheduledTasks.entries()) {
      if (task.lastRun && task.lastRun < cutoff) {
        this.scheduledTasks.delete(taskId);
        this.logger.log(`Cleaned up old scheduled task: ${task.name}`);
      }
    }
  }
}