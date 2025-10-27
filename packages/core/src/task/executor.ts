import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Task } from './task.entity';

@Injectable()
export class TaskExecutor {
  private readonly logger = new Logger(TaskExecutor.name);
  private readonly executors = new Map<string, Function>();
  private isRunning = false;

  constructor(private readonly eventEmitter: EventEmitter2) {}

  register(taskType: string, executor: Function) {
    this.logger.log(`Registering executor for task type "${taskType}"`);
    this.executors.set(taskType, executor);
  }

  async execute(task: Task) {
    this.logger.log(`Executing task ${task.id} of type ${task.type}`);
    const executor = this.executors.get(task.type);
    if (!executor) {
      throw new Error(`No executor registered for task type "${task.type}"`);
    }

    try {
      const result = await executor(task.data);
      this.eventEmitter.emit('task.completed', { task, result });
      return result;
    } catch (error) {
      this.eventEmitter.emit('task.failed', { task, error });
      throw error;
    }
  }
}
