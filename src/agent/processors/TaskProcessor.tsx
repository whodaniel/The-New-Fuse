import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AgentMessage, TaskStatus } from '../../types/agent.types.js';
import { TaskQueueService } from '../services/TaskQueueService.js';
import { TaskValidationService } from '../services/TaskValidationService.js';

interface TaskResult {
  messageId: string;
  taskId: string;
  status: TaskStatus;
  timestamp: string;
  error?: string;
  result?: unknown;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class TaskProcessor {
  private readonly logger = new Logger(TaskProcessor.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly taskQueue: TaskQueueService,
    private readonly taskValidator: TaskValidationService
  ) {}

  async process(message: AgentMessage): Promise<void> {
    this.logger.debug(`Processing task: ${message.id}`);

    try {
      await this.validateTask(message);
      const result = await this.executeTask(message);

      const taskResult: TaskResult = {
        messageId: message.id,
        taskId: message.content.taskId,
        status: 'completed',
        timestamp: new Date().toISOString(),
        result,
        metadata: message.metadata
      };

      this.eventEmitter.emit("agent.task.completed", taskResult);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Task processing failed: ${errorMessage}`);

      const taskResult: TaskResult = {
        messageId: message.id,
        taskId: message.content.taskId,
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: errorMessage,
        metadata: message.metadata
      };

      this.eventEmitter.emit("agent.task.failed", taskResult);
      throw error;
    }
  }

  private async validateTask(message: AgentMessage): Promise<void> {
    if (!message.content?.taskId) {
      throw new Error('Task ID is required');
    }

    await this.taskValidator.validate(message.content);
  }

  private async executeTask(message: AgentMessage): Promise<unknown> {
    const { taskId, params } = message.content;

    // Add task to queue and get position
    const position = await this.taskQueue.add({
      taskId,
      params,
      priority: message.priority,
      metadata: message.metadata
    });

    // Wait for task to reach front of queue
    await this.taskQueue.waitForTurn(taskId, position);

    try {
      // Execute task logic here
      const result = await this.performTaskExecution(message.content);
      
      // Mark task as completed in queue
      await this.taskQueue.complete(taskId);
      
      return result;
    } catch (error) {
      // Mark task as failed in queue
      await this.taskQueue.fail(taskId);
      throw error;
    }
  }

  private async performTaskExecution(taskContent: unknown): Promise<unknown> {
    // Implement actual task execution logic here
    // This could involve calling other services, performing computations, etc.
    return null;
  }
}
