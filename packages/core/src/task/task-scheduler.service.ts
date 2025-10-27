import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/Task';
import { TaskStatusType } from '@the-new-fuse/types';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);
  private maxConcurrentTasks: number = 10;

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async scheduleTask(task: Task): Promise<Task> {
    // Check if dependencies are resolved
    if (task.dependencies && task.dependencies.length > 0) {
      throw new Error('Cannot schedule task with pending dependencies');
    }

    // Check concurrent task limit
    const runningTasks = await this.taskRepository.find({
      where: { status: TaskStatusType.RUNNING },
    });

    if (runningTasks.length >= this.maxConcurrentTasks) {
      throw new Error('Maximum concurrent tasks limit reached');
    }

    // Schedule the task
    task.status = TaskStatusType.PENDING;
    return this.taskRepository.save(task);
  }

  async executeTask(taskId: string): Promise<void> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = TaskStatusType.RUNNING;
    await this.taskRepository.save(task);

    try {
      // Execute task logic here
      this.logger.log(`Executing task ${task.id}`);

      task.status = TaskStatusType.COMPLETED;
      await this.taskRepository.save(task);
    } catch (error) {
      this.logger.error(`Task ${task.id} failed:`, error);
      task.status = TaskStatusType.FAILED;
      await this.taskRepository.save(task);
      throw error;
    }
  }

  async cancelTask(taskId: string): Promise<void> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = TaskStatusType.CANCELLED;
    await this.taskRepository.save(task);
  }

  async getScheduledTasks(): Promise<Task[]> {
    return this.taskRepository.find({
      where: { status: TaskStatusType.PENDING },
    });
  }
}
