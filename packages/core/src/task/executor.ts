import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Interfaces from Incoming change
export interface TaskExecutionContext {
  taskId: string;
  userId?: string;
  params?: any;
  metadata?: Record<string, any>;
}

export interface TaskExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
}

// Merged Class
@Injectable() // From Current
export class TaskExecutor {
  private readonly logger = new Logger(TaskExecutor.name); // From Current
  
  // From Incoming (better, more-specific type)
  private executors: Map<string, (context: TaskExecutionContext) => Promise<any>> = new Map();

  // From Current (for NestJS DI)
  constructor(private readonly eventEmitter: EventEmitter2) {}

  // From Incoming (with logging from Current)
  register(taskType: string, executor: (context: TaskExecutionContext) => Promise<any>): void {
    this.logger.log(`Registering executor for task type "${taskType}"`);
    this.executors.set(taskType, executor);
  }

  // From Incoming
  unregister(taskType: string): void {
    this.executors.delete(taskType);
  }
  
  // Merged execute method: combines both branches' logic
  async execute(taskType: string, context: TaskExecutionContext): Promise<TaskExecutionResult> {
    this.logger.log(`Executing task ${context.taskId} of type ${taskType}`);
    
    const executor = this.executors.get(taskType);
    if (!executor) {
      const errorMsg = `No executor registered for task type "${taskType}"`;
      this.logger.error(errorMsg);
      // Adhere to the 'Incoming' return type
      return {
        success: false,
        error: errorMsg,
        duration: 0,
      };
    }

    const startTime = Date.now();
    try {
      // Execute using 'Incoming' logic
      const result = await executor(context); 
      const duration = Date.now() - startTime;

      // Emit event using 'Current' logic
      this.eventEmitter.emit('task.completed', { task: context, result });

      // Return result using 'Incoming' logic
      return {
        success: true,
        result,
        duration,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Task ${context.taskId} failed: ${errorMsg}`, error.stack);

      // Emit event using 'Current' logic
      this.eventEmitter.emit('task.failed', { task: context, error });

      // Return result using 'Incoming' logic
      return {
        success: false,
        error: errorMsg,
        duration,
      };
    }
  }
}