import { Injectable } from '@nestjs/common';
import { TaskStatus, TaskStatusType, TaskType, TaskPriority, TaskResult, Task, TaskMetadata } from '@the-new-fuse/types';
import { PrismaClient } from '@the-new-fuse/database/client';
import { PrismaService } from '@the-new-fuse/database';
import crypto from 'crypto';

@Injectable()
export class TaskManager {
  constructor(private readonly prisma: PrismaService) {}
  
  async createTask(taskData: Partial<Task>): Promise<Task> {
    const newTask: Task = {
      id: taskData.id || crypto.randomUUID(),
      title: taskData.title || '',
      description: taskData.description || '',
      type: taskData.type || TaskType.GENERIC,
      priority: taskData.priority || TaskPriority.NORMAL,
      status: TaskStatus.PENDING,
      userId: taskData.userId || 'system',
      metadata: {
        creator: taskData.metadata?.creator || 'system',
        ...taskData.metadata
      } as TaskMetadata,
      dependencies: taskData.dependencies || [],
      createdAt: new Date(),
      input: taskData.input || {},
      output: taskData.output || {},
      scheduledAt: taskData.scheduledAt,
      started: taskData.started,
      completed: taskData.completed
    };

    return this.prisma.task.create({
      data: newTask
    });
  }

  async updateTaskStatus(taskId: string, status: TaskStatusType, metadata?: any): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId }
    });

    if(!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    return this.prisma.task.update( {
      where: { id: taskId },
      data: {
        status,
        metadata,
        updatedAt: new Date()
      }
    });
  }

  async updateTaskResult(taskId: string, result: TaskResult): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId }
    });

    if(!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const metadata   = await this.prisma.task.findUnique({
      where: { id: taskId }
    });

    return this.prisma.task.update( {
      where: { id: taskId },
      data: {
        status: result.status,
        metadata,
        updatedAt: new Date()
      }
    });
  }

  async completeTask(taskId: string, result: TaskResult): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId }
    });

    if(!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const metadata  = await this.prisma.task.findUnique({
      where: { id: taskId }
    });

    return this.prisma.task.update( {
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        metadata,
        updatedAt: new Date()
      }
    });
  }

  async findTaskById(taskId: string): Promise<Task | null> {
    return this.prisma.task.findUnique({
      where: { id: taskId }
    });
  }

  async findTasksByStatus(status: TaskStatusType): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { status }
    });
  }

  async findTasksByDependency(dependencyId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: {
        dependencies: {
          some: {
            taskId: dependencyId
          }
        }
      }
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.prisma.task.delete({
      where: { id: taskId }
    });
  }
}
