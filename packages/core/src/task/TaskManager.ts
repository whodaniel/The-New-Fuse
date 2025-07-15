import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { TaskExecutor, Task, TaskStatusType } from './TaskExecutor';

export interface TaskMetadata {
  id: string;
  type: string;
  status: TaskStatusType;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  dependencies: string[];
  maxRetries: number;
  currentRetry: number;
}

@Injectable()
export class TaskManager {
  private readonly logger = new Logger(TaskManager.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly taskExecutor: TaskExecutor
  ) {}

  async createTask(taskData: {
    type: string;
    data: any;
    params?: Record<string, any>;
    config?: Record<string, any>;
    priority?: number;
    dependencies?: string[];
    maxRetries?: number;
  }): Promise<Task> {
    const task = await this.prisma.task.create({
      data: {
        type: taskData.type,
        data: taskData.data,
        params: taskData.params || {},
        config: taskData.config || {},
        status: 'pending',
        priority: taskData.priority || 0,
        dependencies: taskData.dependencies || [],
        maxRetries: taskData.maxRetries || 3,
        currentRetry: 0,
      }
    });

    this.logger.log(`Created task ${task.id} of type ${task.type}`);
    return this.mapPrismaTaskToTask(task);
  }

  async getTask(taskId: string): Promise<Task | null> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId }
    });

    return task ? this.mapPrismaTaskToTask(task) : null;
  }

  async updateTaskStatus(taskId: string, status: TaskStatusType): Promise<Task> {
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { 
        status,
        updatedAt: new Date()
      }
    });

    return this.mapPrismaTaskToTask(task);
  }

  async executeTask(taskId: string): Promise<any> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status !== 'pending') {
      throw new Error(`Task ${taskId} is not in pending status`);
    }

    // Check dependencies
    const dependenciesMet = await this.checkDependencies(taskId);
    if (!dependenciesMet) {
      this.logger.log(`Task ${taskId} waiting for dependencies`);
      return null;
    }

    try {
      await this.updateTaskStatus(taskId, 'running');
      const result = await this.taskExecutor.executeTask(task);
      await this.updateTaskStatus(taskId, 'completed');
      return result;
    } catch (error) {
      const taskRecord = await this.prisma.task.findUnique({
        where: { id: taskId }
      });

      if (taskRecord && taskRecord.currentRetry < taskRecord.maxRetries) {
        await this.prisma.task.update({
          where: { id: taskId },
          data: {
            status: 'pending',
            currentRetry: taskRecord.currentRetry + 1,
            updatedAt: new Date()
          }
        });
        this.logger.log(`Retrying task ${taskId} (attempt ${taskRecord.currentRetry + 1})`);
      } else {
        await this.updateTaskStatus(taskId, 'failed');
      }
      throw error;
    }
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = await this.getTask(taskId);
    if (!task) {
      return false;
    }

    if (['completed', 'failed', 'cancelled'].includes(task.status)) {
      return false;
    }

    await this.updateTaskStatus(taskId, 'cancelled');
    this.logger.log(`Cancelled task ${taskId}`);
    return true;
  }

  async getPendingTasks(): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { status: 'pending' },
      orderBy: { priority: 'desc' }
    });

    return tasks.map(task => this.mapPrismaTaskToTask(task));
  }

  async getTasksByStatus(status: TaskStatusType): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' }
    });

    return tasks.map(task => this.mapPrismaTaskToTask(task));
  }

  async getTaskMetadata(taskId: string): Promise<TaskMetadata | null> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) return null;

    return {
      id: task.id,
      type: task.type,
      status: task.status as TaskStatusType,
      priority: task.priority,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      dependencies: task.dependencies || [],
      maxRetries: task.maxRetries,
      currentRetry: task.currentRetry
    };
  }

  private async checkDependencies(taskId: string): Promise<boolean> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { dependencies: true }
    });

    if (!task || !task.dependencies || task.dependencies.length === 0) {
      return true;
    }

    const dependencies = await this.prisma.task.findMany({
      where: {
        id: { in: task.dependencies }
      },
      select: { id, status: true }
    });

    return dependencies.every(dep => dep.status === 'completed');
  }

  private mapPrismaTaskToTask(prismaTask: any): Task {
    return {
      id: prismaTask.id,
      type: prismaTask.type,
      status: prismaTask.status as TaskStatusType,
      data: prismaTask.data,
      params: prismaTask.params || {},
      config: prismaTask.config || {},
      result: prismaTask.result,
      error: prismaTask.error,
      createdAt: prismaTask.createdAt,
      updatedAt: prismaTask.updatedAt
    };
  }
}