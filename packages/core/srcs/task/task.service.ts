import { Injectable, Logger } from '@nestjs/common';
import { TaskRepository } from './task.repository';
import { Task, TaskStatus, TaskPriority } from './task.entity';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly taskRepository: TaskRepository) {}

  async createTask(data: {
    type: string;
    userId: string;
    data?: any;
    priority?: TaskPriority;
  }): Promise<Task> {
    try {
      const task = await this.taskRepository.create({
        type: data.type,
        userId: data.userId,
        data: data.data,
        priority: data.priority || TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
      });
      return task;
    } catch (error: any) {
      this.logger.error('Failed to create task:', error);
      throw error;
    }
  }

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    try {
      const task = await this.taskRepository.update(id, { status });
      return task;
    } catch (error: any) {
      this.logger.error('Failed to update task status:', error);
      throw error;
    }
  }

  async getTaskById(id: string): Promise<Task | null> {
    return this.taskRepository.findById(id);
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    return this.taskRepository.findByUserId(userId);
  }
}
