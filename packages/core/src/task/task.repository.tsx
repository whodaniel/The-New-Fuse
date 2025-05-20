import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Task, TaskQuery, TaskResult, TaskType } from './types.js';

@Injectable()
export class TaskRepository {
  constructor(private prisma: PrismaService) {}

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    return this.prisma.task.create({
      data: task,
    });
  }

  async findTaskById(id: string): Promise<Task | null> {
    return this.prisma.task.findUnique({
      where: { id },
    });
  }

  async findTasks(query: TaskQuery): Promise<Task[]> {
    const where: any = {};

    if (query.types?.length) {
      where.type = { in: query.types };
    }

    if (query.priorities?.length) {
      where.priority = { in: query.priorities };
    }

    if (query.statuses?.length) {
      where.status = { in: query.statuses };
    }

    if (query.creator) {
      where.creatorId = query.creator;
    }

    if (query.assignee) {
      where.assigneeId = query.assignee;
    }

    if (query.tags?.length) {
      where.tags = {
        hasEvery: query.tags,
      };
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate;
      }
    }

    if (query.metadata) {
      where.metadata = {
        contains: query.metadata,
      };
    }

    return this.prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  async updateTaskResult(id: string, result: TaskResult): Promise<Task> {
    return this.prisma.task.update({
      where: { id },
      data: { result },
    });
  }

  async deleteTask(id: string): Promise<void> {
    await this.prisma.task.delete({
      where: { id },
    });
  }
}