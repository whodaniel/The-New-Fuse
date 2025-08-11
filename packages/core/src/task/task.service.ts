import { Injectable, Logger } from '@nestjs/common';
import { TaskRepository } from './task.repository';
import { Task } from './task.entity';
import { TaskStatus, TaskPriority } from './types';
@Injectable()
export class TaskService {
  // Implementation needed
}
  private readonly logger = new Logger(TaskService.name);
  constructor(private readonly taskRepository: TaskRepository) {}

  async createTask(data: {
  // Implementation needed
}
    type: string;
    userId: string;
    data?: any;
    priority?: TaskPriority;
  }): Promise<Task> {
  // Implementation needed
}
    try {
  // Implementation needed
}
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
  // Implementation needed
}
      this.logger.error('Failed to create task:', error);
      throw error;
    }
  }

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  // Implementation needed
}
    try {
  // Implementation needed
}
      const task = await this.taskRepository.update(id, { status });
      return task;
    } catch (error: any) {
  // Implementation needed
}
      this.logger.error('Failed to update task status:', error);
      throw error;
    }
  }

  async getTaskById(id: string): Promise<Task | null> {
  // Implementation needed
}
    return this.taskRepository.findById(id);
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
  // Implementation needed
}
    return this.taskRepository.findByUserId(userId);
  }
}