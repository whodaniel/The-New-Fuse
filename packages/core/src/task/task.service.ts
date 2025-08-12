import { Injectable, Logger } from '@nestjs/common';
import { TaskRepository } from './task.repository';
import { Task } from './task.entity';
import { TaskStatus, TaskPriority } from './types';
@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  constructor(private readonly taskRepository: TaskRepository) {}

  async createTask(): unknown {
    try {
      const task = await this.taskRepository.create({
  // Implementation needed
}
        type: data.type,
        userId: data.userId,
        data: data.data,
        priority: data.priority || TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
      });
      return task;
    } catch (error: any) {
this.logger.error('Failed to create task:', error);
  }      throw error;
    }
  }

  async updateTaskStatus(): unknown {
    try {
      const task = await this.taskRepository.update(id, { status });
      return task;
    } catch (error: any) {
this.logger.error('Failed to update task status:', error);
  }      throw error;
    }
  }

  async getTaskById(): unknown {
    return this.taskRepository.findById(id);
  }

  async getTasksByUserId(): unknown {
    return this.taskRepository.findByUserId(userId);
  }
}