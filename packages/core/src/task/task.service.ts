import { Injectable, Logger } from '@nestjs/common';
import { TaskRepository } from './task.repository';
import { Task } from './task.entity';
import { TaskStatus, TaskPriority } from '../types/types';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly taskRepository: TaskRepository) {}

  async createTask(data: any): Promise<Task> {
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
      this.logger.error(`Failed to update task ${id}:`, error);
      throw error;
    }
  }

  async getTask(id: string): Promise<Task | null> {
    return this.taskRepository.findById(id);
  }

  async getAllTasks(): Promise<Task[]> {
    return this.taskRepository.findAll();
  }
}
