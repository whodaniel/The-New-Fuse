import { BaseProcessor } from './BaseProcessor.js';
import { Logger } from '../types/core.js';
import {
  Message,
  MessageType,
  Task,
  CoreTaskResult as TaskResult,
  TaskStatus,
  UUID,
} from '@the-new-fuse/types';
import { AlertService } from '../services/AlertService.js';
import { RedisService } from '../services/RedisService.js';
import { MessageValidator } from '../services/MessageValidator.js';
import { InterAgentChatService } from '../services/InterAgentChatService.js';


/**
 * Processes incoming task assignment messages and executes the tasks.
 */
export class TaskProcessor extends BaseProcessor {
  protected logger: Logger;
  private alertService: AlertService;
  private redisService: RedisService;
  private messageValidator: MessageValidator;
  private chatService: InterAgentChatService;
  private agentId: UUID;
  public activeTasks: Map<UUID, Task>;
  private cancelledTasks: Set<UUID>;

  constructor(
    agentId: UUID,
    alertService: AlertService,
    redisService: RedisService,
    messageValidator: MessageValidator,
    chatService: InterAgentChatService
  ) {
    super();
    this.agentId = agentId;
    this.logger = new Logger(`TaskProcessor [Agent ${this.agentId}]`);
    this.alertService = alertService;
    this.redisService = redisService;
    this.messageValidator = messageValidator;
    this.chatService = chatService;
    this.activeTasks = new Map();
    this.cancelledTasks = new Set();

    this.logger.info('TaskProcessor initialized.');
    this.loadUnfinishedTasks();
  }

  private async loadUnfinishedTasks(): Promise<void> {
    this.logger.info('Checking for unfinished tasks...');
    try {
        const keys = await this.redisService.keys('task:*:status');
        for (const key of keys) {
            const data = await this.redisService.get(key);
            if (data) {
                const taskData = JSON.parse(data);
                if (taskData.status === TaskStatus.IN_PROGRESS) {
                    this.logger.warn(`Task ${taskData.id} was in progress. Re-queuing is not yet implemented.`);
                    // In a real implementation, you would re-queue or restart the task.
                    // For now, we will just mark it as failed.
                    await this.updateTaskStatus(taskData.id, TaskStatus.FAILED, 'Agent restarted during task execution.');
                }
            }
        }
    } catch (error) {
        this.logger.error(`Error loading unfinished tasks: ${(error as Error).message}`);
    }
  }

  async process(message: Message): Promise<TaskResult | null> {
    if (!this.messageValidator.validate(message) || message.type !== MessageType.TASK_ASSIGNMENT) {
      this.logger.debug(`Skipping message ${message.id}: Not a valid task assignment.`);
      return null;
    }

    const task = message.content as unknown as Task;

    if (this.activeTasks.has(task.id)) {
        this.logger.warn(`Task ${task.id} is already being processed. Ignoring duplicate assignment.`);
        return null;
    }

    this.logger.info(`Starting processing for task ${task.id}: "${task.title.substring(0, 50)}..."`);
    this.activeTasks.set(task.id, task);
    await this.updateTaskStatus(task.id, TaskStatus.IN_PROGRESS);

    try {
      this.logger.debug(`Executing task ${task.id}... (Placeholder)`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (this.cancelledTasks.has(task.id)) {
        this.cancelledTasks.delete(task.id);
        this.logger.info(`Task ${task.id} was cancelled during execution.`);
        await this.updateTaskStatus(task.id, TaskStatus.CANCELLED);
        this.activeTasks.delete(task.id);
        return null;
      }

      const resultData = {
          summary: `Task "${task.title}" completed successfully (placeholder).`,
          details: { executedAt: new Date() },
      };

      this.logger.info(`Task ${task.id} completed successfully.`);
      await this.updateTaskStatus(task.id, TaskStatus.COMPLETED);
      this.activeTasks.delete(task.id);

      const taskResult: TaskResult = {
        id: `result_${task.id}`,
        taskId: task.id,
        status: TaskStatus.COMPLETED,
        output: resultData,
        metrics: {
          duration: 1000,
          resourceUsage: { cpuUsage: 0, memoryUsage: 0 }
        },
        timestamp: new Date(),
      };

      if (task.originatorId) {
        await this.chatService.sendMessage(task.originatorId, taskResult, MessageType.TASK_RESULT);
      }
      return taskResult;

    } catch (error) {
      this.logger.error(`Error processing task ${task.id}: ${(error as Error).message}`);
      await this.updateTaskStatus(task.id, TaskStatus.FAILED, (error as Error).message);
      this.activeTasks.delete(task.id);
      await this.alertService.error(
          `Task ${task.id} failed`,
          `Agent ${this.agentId} / TaskProcessor`,
          { error: (error as Error).message, taskDescription: task.title }
      );

      const taskResult: TaskResult = {
        id: `result_${task.id}`,
        taskId: task.id,
        status: TaskStatus.FAILED,
        error: (error as Error).message,
        metrics: {
          duration: 0,
          resourceUsage: { cpuUsage: 0, memoryUsage: 0 }
        },
        timestamp: new Date(),
      };

      if (task.originatorId) {
        await this.chatService.sendMessage(task.originatorId, taskResult, MessageType.TASK_RESULT);
      }
      return taskResult;
    }
  }

  private async updateTaskStatus(taskId: UUID, status: TaskStatus, error?: string): Promise<void> {
    this.logger.debug(`Updating status for task ${taskId} to ${status}.`);
    const taskData = {
        id: taskId,
        status: status,
        updatedAt: new Date().toISOString(),
        ...(error && { error: error }),
    };
    try {
        await this.redisService.set(`task:${taskId}:status`, JSON.stringify(taskData), 3600 * 24);
        await this.redisService.publish('task-status-updates', JSON.stringify(taskData));
    } catch (redisError) {
        this.logger.error(`Failed to update task status in Redis for task ${taskId}: ${(redisError as Error).message}`);
    }
  }

  async cancelTask(taskId: UUID): Promise<boolean> {
      if (!this.activeTasks.has(taskId)) {
          this.logger.warn(`Cannot cancel task ${taskId}: Not currently active.`);
          return false;
      }

      this.logger.info(`Attempting to cancel task ${taskId}...`);
      this.cancelledTasks.add(taskId);

      // In a real implementation, you would abort ongoing operations.
      // For this placeholder, we just mark it as cancelled.
      await this.updateTaskStatus(taskId, TaskStatus.CANCELLED);
      this.activeTasks.delete(taskId);
      this.logger.info(`Task ${taskId} marked as cancelled.`);
      return true;
  }
}
