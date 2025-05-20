import { Injectable } from "@nestjs/common";
import { DatabaseService } from '../database/database.service.js';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
  CreateTaskDto,
} from "@the-new-fuse/types";

@Injectable()
export class TaskService {
  constructor(private readonly db: DatabaseService) {}

  async findStuckTasks(): Promise<Task[]> {
    const stuckTasks = await this.db.client.task.findMany({
      where: {
        status: TaskStatus.RUNNING,
        startTime: {
          lt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        },
      },
    });
    return stuckTasks;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    return await this.db.client.task.update({
      where: { id: taskId },
      data: updates,
    });
  }

  async findTaskById(taskId: string): Promise<Task | null> {
    const task = await this.db.client.task.findUnique({
      where: { id: taskId },
    });
    return task;
  }

  async createTask(data: CreateTaskDto): Promise<Task> {
    const taskData = {
      ...data,
      status: TaskStatus.PENDING,
      priority: data.priority || TaskPriority.MEDIUM,
      type: data.type || TaskType.Generic,
      metadata: {
        priority: data.priority || TaskPriority.MEDIUM,
        retryCount: 0,
        maxRetries: data.metadata?.maxRetries || 3,
        resourceUsage: {
          cpuUsage: 0,
          memoryUsage: 0,
          networkUsage: 0,
          diskUsage: 0,
        },
        ...data.metadata,
      },
      dependencies: data.dependencies || [],
      input: data.input || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.db.client.task.create({
      data: taskData,
    });
  }

  async getPendingTasks(): Promise<Task[]> {
    return this.db.client.task.findMany({
      where: {
        status: TaskStatus.PENDING,
      },
      orderBy: {
        priority: "desc",
      },
    });
  }

  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    return this.db.client.task.findMany({
      where: { status },
    });
  }

  async getTasksByPriority(priority: TaskPriority): Promise<Task[]> {
    return this.db.client.task.findMany({
      where: { priority },
    });
  }
}
