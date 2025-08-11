import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/Task';
import { TaskStatusType } from '@the-new-fuse/types';
@Injectable()
export class TaskSchedulerService {
  // Implementation needed
}
  private readonly logger = new Logger(TaskSchedulerService.name);
  private maxConcurrentTasks: number = 10;
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async scheduleTask(task: Task): Promise<void> {
  // Implementation needed
}
    // Check if dependencies are resolved
    if (task.dependencies?.some(dep => dep.status === TaskStatusType.PENDING)) {
  // Implementation needed
}
      throw new Error('Cannot schedule task with pending dependencies');
    }

    // Check concurrent task limit
    const runningTasks = await this.taskRepository.find({
  // Implementation needed
}
      where: { status: TaskStatusType.RUNNING },
    });
    if (runningTasks.length >= this.maxConcurrentTasks) {
  // Implementation needed
}
      throw new Error('Maximum concurrent tasks limit reached');
    }

    // Schedule the task
    task.status = TaskStatusType.PENDING;
    task.scheduledAt = new Date();
    await this.taskRepository.save(task);
    this.logger.log(`Task ${task.id} scheduled successfully`);
  }

  async rescheduleTask(taskId: string, newScheduledTime: Date): Promise<void> {
  // Implementation needed
}
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
  // Implementation needed
}
      throw new Error(`Task ${taskId} not found`);
    }

    task.scheduledAt = newScheduledTime;
    await this.taskRepository.save(task);
    this.logger.log(`Task ${taskId} rescheduled to ${newScheduledTime}`);
  }

  async cancelTask(taskId: string): Promise<void> {
  // Implementation needed
}
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
  // Implementation needed
}
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status === TaskStatusType.RUNNING) {
  // Implementation needed
}
      throw new Error('Cannot cancel running task');
    }

    task.status = TaskStatusType.CANCELLED;
    await this.taskRepository.save(task);
    this.logger.log(`Task ${taskId} cancelled`);
  }

  async getScheduledTasks(): Promise<Task[]> {
  // Implementation needed
}
    return this.taskRepository.find({
  // Implementation needed
}
      where: { status: TaskStatusType.PENDING },
      order: { scheduledAt: 'ASC' },
    });
  }

  async getTaskQueue(): Promise<Task[]> {
  // Implementation needed
}
    return this.taskRepository.find({
  // Implementation needed
}
      where: [
        { status: TaskStatusType.PENDING },
        { status: TaskStatusType.RUNNING },
      ],
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }
}