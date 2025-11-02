import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Imports from Incoming change
import { Task } from './entities/Task';
import { TaskStatusType } from '@the-new-fuse/types';

// Imports from our previous merges
import { TaskQueue, QueueItem } from './queue';
import { TaskPayload } from './scheduler';
import { TaskExecutionContext } from './executor';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    // Inject our new Redis-based queue
    private readonly taskQueue: TaskQueue<TaskPayload>,
  ) {}

  /**
   * Saves a task to the database and adds it to the execution queue.
   */
  async scheduleTask(task: Task): Promise<Task> {
    this.logger.log(`Scheduling task ${task.id} (type: ${task.type})`);

    // 1. Check dependencies (from Incoming)
    if (task.dependencies && task.dependencies.length > 0) {
      this.logger.warn(`Task ${task.id} has dependencies. Ensure they are resolved.`);
      // In a real system, we'd check if deps are 'COMPLETED'
    }

    // 2. Save to database (from Incoming)
    task.status = TaskStatusType.PENDING;
    const savedTask = await this.taskRepository.save(task);

    // 3. Create payload and add to our new queue (Merged logic)
    const context: TaskExecutionContext = {
      taskId: savedTask.id,
      userId: savedTask.userId,
      params: savedTask.params,
    };

    const payload: TaskPayload = {
      taskType: savedTask.type,
      context: context,
    };

    const queueItem: QueueItem<TaskPayload> = {
      id: savedTask.id,
      data: payload,
      priority: savedTask.priority || 5, // Use priority from task, or default
      timestamp: new Date(),
      retries: 0,
      maxRetries: 3, // Default
    };

    // Add to the Redis queue, using the task type as the queue name
    await this.taskQueue.add(savedTask.type, queueItem);
    this.logger.log(`Task ${savedTask.id} enqueued for execution.`);

    return savedTask;
  }

  // NOTE: The 'executeTask' method from the 'Incoming' branch is
  // intentionally removed. This logic is now handled by the
  // 'TaskScheduler' (worker) and 'TaskExecutor'.

  /**
   * Cancels a task by updating its status in the database.
   */
  async cancelTask(taskId: string): Promise<void> {
    // This logic from 'Incoming' is still valid
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = TaskStatusType.CANCELLED;
    await this.taskRepository.save(task);
    this.logger.log(`Task ${taskId} cancelled.`);
  }

  /**
   * Retrieves all tasks that are pending execution.
   */
  async getScheduledTasks(): Promise<Task[]> {
    // This logic from 'Incoming' is still valid
    return this.taskRepository.find({
      where: { status: TaskStatusType.PENDING },
    });
  }
}