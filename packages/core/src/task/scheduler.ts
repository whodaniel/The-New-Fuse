import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Task, TaskStatus } from './task.entity';
import { TaskQueue } from './queue';

@Injectable()
export class TaskScheduler {
  private readonly logger = new Logger(TaskScheduler.name);
  private readonly maxConcurrentTasks = 10;
  private runningTasks = 0;

  constructor(
    private readonly taskQueue: TaskQueue,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async schedule(task: Task): Promise<void> {
    this.logger.log(`Scheduling task ${task.id}`);
    await this.taskQueue.add(task);
    this.eventEmitter.emit('task.scheduled', task);
    this.tryProcessNext();
  }

  private async tryProcessNext(): Promise<void> {
    this.logger.log('Trying to process next task');
    if (this.runningTasks >= this.maxConcurrentTasks) {
      this.logger.log('Max concurrent tasks reached');
      return;
    }

    const task = await this.taskQueue.getNext();
    if (task) {
      this.runningTasks++;
      this.eventEmitter.emit('task.started', task);
      try {
        // In a real implementation, you would execute the task here
        this.logger.log(`Executing task ${task.id}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
        this.eventEmitter.emit('task.completed', { task, result: 'Success' });
      } catch (error) {
        this.eventEmitter.emit('task.failed', { task, error });
      } finally {
        this.runningTasks--;
        this.tryProcessNext();
      }
    }
  }
}
