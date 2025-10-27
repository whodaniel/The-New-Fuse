import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './task.entity';

// This is a temporary service. Replace with a real one.

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);
  private tasks = new Map<string, any>();

  constructor() {}

  async scheduleTask(task: any): Promise<any> {
    this.logger.log(`Schedule task ${task.id}`);
    this.tasks.set(task.id, {
      ...task,
      status: TaskStatus.PENDING,
      scheduledAt: new Date(),
    });
    return task;
  }

  async rescheduleTask(taskId: string, newScheduledTime: Date): Promise<any> {
    this.logger.log(`Reschedule task ${taskId}`);
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    task.scheduledAt = newScheduledTime;
    return task;
  }

  async cancelTask(taskId: string): Promise<any> {
    this.logger.log(`Cancel task ${taskId}`);
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    task.status = 'CANCELLED';
    return task;
  }

  async getScheduledTasks(): Promise<any[]> {
    this.logger.log('Get scheduled tasks');
    return Array.from(this.tasks.values()).filter(t => t.status === TaskStatus.PENDING);
  }
}
