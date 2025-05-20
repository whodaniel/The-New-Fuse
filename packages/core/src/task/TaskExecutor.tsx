import { Injectable } from '@nestjs/common';
import { Task, TaskStatus, TaskType, TaskResult, TaskStatusType, TaskMetadata } from '@the-new-fuse/types';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@the-new-fuse/utils';
import { EventEmitter } from 'events';
import { TaskRepository } from '@the-new-fuse/database';

const statusTransitions: Record<TaskStatusType, TaskStatusType[]> = {
  'pending': ['running', 'cancelled'],
  'running': ['completed', 'failed', 'cancelled'],
  'completed': [],
  'failed': ['pending'],
  'cancelled': ['pending'],
  'scheduled': ['pending', 'cancelled'],
  'in_progress': ['running', 'failed', 'cancelled']
} as const;

async function updateTaskStatus(task: Task, newStatus: TaskStatusType, taskRepository: TaskRepository): Promise<Task> {
  if (!statusTransitions[task.status]?.includes(newStatus)) {
    throw new Error(`Invalid task status transition: ${task.status} -> ${newStatus}`);
  }

  const updatedTask = await taskRepository.save({
    ...task,
    status: newStatus
  });

  return updatedTask;
}

@Injectable()
export class TaskExecutor extends EventEmitter {
  private logger: Logger;
  private runningTasks: Map<string, Promise<TaskResult>>;

  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly configService: ConfigService,
    private readonly redis: Redis
  ) {
    super();
    this.logger = new Logger('TaskExecutor');
    this.runningTasks = new Map();
  }

  async executeTask(task: Task): Promise<TaskResult> {
    const existingTask = this.runningTasks.get(task.id);
    if (existingTask) {
      return existingTask;
    }

    const startTime = Date.now();
    const execution = this.runTask(task);
    this.runningTasks.set(task.id, execution);

    try {
      const result = await execution;

      const completedTask = await this.taskRepository.save({
        ...task,
        status: TaskStatus.COMPLETED,
        metadata: {
          ...task.metadata,
          completedAt: new Date(),
          duration: Date.now() - startTime,
          output: result.output
        }
      });

      this.emit('taskCompleted', completedTask);

      return {
        id: task.id,
        taskId: task.id,
        status: TaskStatus.COMPLETED,
        output: result.output,
        metrics: {
          duration: Date.now() - startTime,
          cpuUsage: 0,
          memoryUsage: 0
        },
        timestamp: new Date()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.runningTasks.delete(task.id);
      this.logger.error(`Task ${task.id} failed:`, { error: errorMessage });

      const failedTask = await this.taskRepository.save({
        ...task,
        status: TaskStatus.FAILED,
        metadata: {
          ...task.metadata,
          completedAt: new Date(),
          errorMessage,
          lastError: errorMessage
        }
      });

      this.emit('taskFailed', failedTask);

      return {
        id: task.id,
        taskId: task.id,
        status: TaskStatus.FAILED,
        error: errorMessage,
        metrics: {
          duration: Date.now() - startTime,
          cpuUsage: 0,
          memoryUsage: 0
        },
        timestamp: new Date()
      };
    }
  }

  private async runTask(task: Task): Promise<{ output?: Record<string, unknown> }> {
    switch (task.type) {
      case 'processing':
        return this.processTask(task);
      case 'analysis':
        return this.analyzeTask(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async processTask(task: Task): Promise<{ output?: Record<string, unknown> }> {
    try {
      // Get task configuration from Redis
      const taskConfig = await this.redis.hgetall(`task:${task.id}:config`);

      const processedData = {}; // Assume some processing is done here

      const updatedTask = await this.taskRepository.save({
        ...task,
        status: TaskStatus.COMPLETED,
        metadata: {
          ...task.metadata,
          completedAt: new Date(),
          output: processedData
        }
      });

      return {
        output: {
          processed: true,
          data: processedData,
          config: taskConfig
        }
      };
    } catch (error) {
      this.logger.error(`Error processing task ${task.id}:`, error);
      throw error;
    }
  }

  private async analyzeTask(task: Task): Promise<{ output?: Record<string, unknown> }> {
    try {
      // Get analysis parameters from task metadata
      const analysisParams = task.metadata?.analysisParams || {};

      const analysisResults = {}; // Assume some analysis is done here

      await this.redis.hmset(`task:${task.id}:result`, {
        analyzedAt: new Date(),
        result: JSON.stringify(analysisResults)
      });

      return {
        output: {
          analyzed: true,
          results: analysisResults,
          parameters: analysisParams
        }
      };
    } catch (error) {
      this.logger.error(`Error analyzing task ${task.id}:`, error);
      throw error;
    }
  }

  async cancelTask(taskId: string): Promise<void> {
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) {
      // Implement cancellation logic if needed
      this.runningTasks.delete(taskId);
      await updateTaskStatus(task, TaskStatus.CANCELLED, this.taskRepository);
    }
  }

  private async updateTaskStatus(task: Task, newStatus: TaskStatusType): Promise<Task> {
    if (!statusTransitions[task.status]?.includes(newStatus)) {
      throw new Error(`Invalid task status transition: ${task.status} -> ${newStatus}`);
    }

    const updatedTask = await this.taskRepository.save({
      ...task,
      status: newStatus
    });

    return updatedTask;
  }

  private async processTaskData(data: unknown, config: Record<string, string>): Promise<any> {
    // Implement actual data processing logic based on task type and configuration
    const processingType = config.processingType || 'default';
    switch (processingType) {
      case 'transform':
        return this.transformData(data, config);
      case 'validate':
        return this.validateData(data, config);
      case 'aggregate':
        return this.aggregateData(data, config);
      default:
        return this.defaultProcessing(data);
    }
  }

  private async analyzeTaskData(data: unknown, params: Record<string, any>): Promise<any> {
    // Implement actual data analysis logic based on parameters
    const analysisType = params.analysisType || 'basic';
    switch (analysisType) {
      case 'statistical':
        return this.performStatisticalAnalysis(data, params);
      case 'pattern':
        return this.performPatternAnalysis(data, params);
      case 'prediction':
        return this.performPredictiveAnalysis(data, params);
      default:
        return this.performBasicAnalysis(data);
    }
  }

  private async transformData(data: unknown, config: Record<string, string>): Promise<any> {
    // Implement data transformation logic
    return data;
  }

  private async validateData(data: unknown, config: Record<string, string>): Promise<any> {
    // Implement data validation logic
    return { isValid: true, data };
  }

  private async aggregateData(data: unknown, config: Record<string, string>): Promise<any> {
    // Implement data aggregation logic
    return { aggregated: true, result: data };
  }

  private async defaultProcessing(data: unknown): Promise<any> {
    // Implement default processing logic
    return { processed: true, data };
  }

  private async performStatisticalAnalysis(data: unknown, params: Record<string, any>): Promise<any> {
    // Implement statistical analysis
    return { type: 'statistical', results: {} };
  }

  private async performPatternAnalysis(data: unknown, params: Record<string, any>): Promise<any> {
    // Implement pattern analysis
    return { type: 'pattern', results: {} };
  }

  private async performPredictiveAnalysis(data: unknown, params: Record<string, any>): Promise<any> {
    // Implement predictive analysis
    return { type: 'predictive', results: {} };
  }

  private async performBasicAnalysis(data: unknown): Promise<any> {
    // Implement basic analysis
    return { type: 'basic', results: {} };
  }

  private async updateTaskStatus(task: Task, newStatus: TaskStatusType): Promise<Task> {
    if (!statusTransitions[task.status]?.includes(newStatus)) {
      throw new Error(`Invalid task status transition: ${task.status} -> ${newStatus}`);
    }

    const updatedTask = await this.taskRepository.save({
      ...task,
      status: newStatus
    });

    return updatedTask;
  }

  private async processTaskData(data: unknown, config: Record<string, string>): Promise<any> {
    // Implement actual data processing logic based on task type and configuration
    const processingType = config.processingType || 'default';
    switch (processingType) {
      case 'transform':
        return this.transformData(data, config);
      case 'validate':
        return this.validateData(data, config);
      case 'aggregate':
        return this.aggregateData(data, config);
      default:
        return this.defaultProcessing(data);
    }
  }

  private async analyzeTaskData(data: unknown, params: Record<string, any>): Promise<any> {
    // Implement actual data analysis logic based on parameters
    const analysisType = params.analysisType || 'basic';
    switch (analysisType) {
      case 'statistical':
        return this.performStatisticalAnalysis(data, params);
      case 'pattern':
        return this.performPatternAnalysis(data, params);
      case 'prediction':
        return this.performPredictiveAnalysis(data, params);
      default:
        return this.performBasicAnalysis(data);
    }
  }

  async cancelTask(taskId: string): Promise<void> {
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) {
      // Implement cancellation logic if needed
      this.runningTasks.delete(taskId);
      await updateTaskStatus(task, TaskStatus.CANCELLED, this.taskRepository);
    }
  }

  private async updateTaskStatus(task: Task, newStatus: TaskStatusType): Promise<Task> {
    if (!statusTransitions[task.status]?.includes(newStatus)) {
      throw new Error(`Invalid task status transition: ${task.status} -> ${newStatus}`);
    }

    const updatedTask = await this.taskRepository.save({
      ...task,
      status: newStatus
    });

    return updatedTask;
  }
}
