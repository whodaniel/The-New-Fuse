import { Injectable, Logger } from '@nestjs/common';
import { TaskRepository } from './task.repository';

// Conflict 1 Resolution: Use 'Incoming' imports
import { Task } from './task.entity';
import { TaskStatus, TaskPriority } from '../types/types'; // Assuming this path is correct

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly taskRepository: TaskRepository) {}

  // Conflict 2 Resolution: Use 'Current' signature (it's better typed)
  async createTask(data: {
    type: string;
    userId: string;
    data?: any;
    priority?: TaskPriority;
  }): Promise<Task> {
    try {
      // Body of method is identical in both branches
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
      // Conflict 3 Resolution: Use 'Incoming' log (more specific)
      this.logger.error(`Failed to update task ${id}:`, error);
      throw error;
    }
  }

  // Conflict 4 Resolution: Merged all methods from both branches

  // From 'Current' (renamed from 'getTask' in 'Incoming')
  async getTaskById(id: string): Promise<Task | null> {
    return this.taskRepository.findById(id);
  }

  // From 'Current'
  async getTasksByUserId(userId: string): Promise<Task[]> {
    return this.taskRepository.findByUserId(userId);
  }

  // From 'Incoming'
  async getAllTasks(): Promise<Task[]> {
    return this.taskRepository.findAll();
  }
}