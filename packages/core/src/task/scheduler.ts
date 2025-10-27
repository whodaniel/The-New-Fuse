import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskQueue, QueueItem } from './queue';
import { TaskExecutor, TaskExecutionContext, TaskExecutionResult } from './executor';

// Define the shape of the data we'll put in the queue
export type TaskPayload = {
  taskType: string;
  context: TaskExecutionContext;
};

@Injectable()
export class TaskScheduler {
  // This class is the Queue Worker
  private readonly logger = new Logger(TaskScheduler.name);
  private readonly maxConcurrentTasks = 10;
  private runningTasks = 0;

  constructor(
    // Our queue will store items of type TaskPayload
    private readonly taskQueue: TaskQueue<TaskPayload>,
    private readonly taskExecutor: TaskExecutor,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('TaskScheduler (Worker) initialized.');
    // Start processing the queue
    this.startProcessing();
  }

  // The 'schedule' method from 'Current' is removed.
  // Other services (like a TaskService) will be responsible for
  // formatting a TaskPayload and adding it to the TaskQueue.

  private startProcessing(): void {
    this.logger.log(
      `Starting worker pool with ${this.maxConcurrentTasks} concurrent tasks.`,
    );
    // Start a worker for each concurrent task slot
    for (let i = 0; i < this.maxConcurrentTasks; i++) {
      this.tryProcessNext(i); // Pass worker ID for logging
    }
  }

  private async tryProcessNext(workerId: number): Promise<void> {
    this.logger.debug(`[Worker ${workerId}] Polling for next task...`);

    // We assume a single 'default' queue for all task types
    const item = await this.taskQueue.getNext('default');

    if (item) {
      this.runningTasks++;

      // The 'data' from the queue item is our TaskPayload
      const { taskType, context } = item.data;

      this.logger.log(
        `[Worker ${workerId}] Starting task ${context.taskId} (type: ${taskType})`,
      );
      this.eventEmitter.emit('task.started', { task: context });

      let result: TaskExecutionResult;
      try {
        // Use the TaskExecutor to run the task
        result = await this.taskExecutor.execute(taskType, context);

        if (result.success) {
          this.logger.log(
            `[Worker ${workerId}] Task ${context.taskId} completed successfully.`,
          );
          this.eventEmitter.emit('task.completed', {
            task: context,
            result: result.result,
          });
        } else {
          this.logger.warn(
            `[Worker ${workerId}] Task ${context.taskId} failed: ${result.error}`,
          );
          this.eventEmitter.emit('task.failed', {
            task: context,
            error: result.error,
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `[Worker ${workerId}] Unhandled exception during task ${context.taskId}: ${errorMsg}`,
          error.stack,
        );
        this.eventEmitter.emit('task.failed', {
          task: context,
          error: errorMsg,
        });
      } finally {
        this.runningTasks--;

        // After finishing, this worker immediately tries to get another task
        this.tryProcessNext(workerId);
      }
    } else {
      // Queue was empty. This worker will wait a bit before polling again.
      this.logger.debug(`[Worker ${workerId}] Queue empty. Sleeping for 1s.`);
      setTimeout(() => this.tryProcessNext(workerId), 1000); // Poll every 1 second
    }
  }
}