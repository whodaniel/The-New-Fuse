import { Injectable } from '@nestjs/common';
import { Task, TaskStatus, TaskPriority, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TaskRepository {
  constructor(private prisma: PrismaService) {}

  

  private getTaskSelect() {
    return {
      id: true,
      type: true,
      status: true,
      priority: true,
      data: true,
      result: true,
      error: true,
      startTime: true,
      endTime: true,
      pipelineId: true,
      agentId: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    };
  }

  async findById(id: string): Promise<Task | null> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: this.getTaskSelect()
    });

    if (!task) return null;
    return task;
  }

  async findMany(filters?: Prisma.TaskWhereInput): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: filters,
      select: this.getTaskSelect(),
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return tasks;
  }

  async create(data: Prisma.TaskCreateInput): Promise<Task> {
    const task = await this.prisma.task.create({
      data,
      select: this.getTaskSelect()
    });
    return task;
  }

  async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      select: this.getTaskSelect()
    });
    return task;
  }

  async delete(id: string): Promise<Task> {
    const task = await this.prisma.task.delete({
      where: { id },
      select: this.getTaskSelect()
    });
    
    return task;
  }

  async findByUserId(userId: string): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { userId },
      select: this.getTaskSelect(),
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return tasks;
  }

  async findByAgentId(agentId: string): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { agentId },
      select: this.getTaskSelect(),
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return tasks;
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { status },
      select: this.getTaskSelect(),
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return tasks;
  }

  async findByPriority(priority: TaskPriority): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { priority },
      select: this.getTaskSelect(),
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return tasks;
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === TaskStatus.COMPLETED) {
      updateData.endTime = new Date();
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
      select: this.getTaskSelect()
    });
    
    return task;
  }

  async assignToAgent(id: string, agentId: string): Promise<Task> {
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        agentId,
        status: TaskStatus.IN_PROGRESS,
        startTime: new Date(),
        updatedAt: new Date()
      },
      select: this.getTaskSelect()
    });
    
    return task;
  }

  async getTaskStats(userId?: string): Promise<{ total: number; completed: number; overdue: number; completionRate: number; byStatus: Record<string, number>; byPriority: Record<string, number> }> {
    const where = userId ? { userId } : {};

    const statusCounts = await this.prisma.task.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true
      }
    });

    const priorityCounts = await this.prisma.task.groupBy({
      by: ['priority'],
      where,
      _count: {
        id: true
      }
    });

    const totalTasks = await this.prisma.task.count({ where });

    const completedTasks = await this.prisma.task.count({
      where: {
        ...where,
        status: TaskStatus.COMPLETED
      }
    });

    const overdueTasks = 0; // Not available in current schema since no dueDate field

    return {
      total: totalTasks,
      completed: completedTasks,
      overdue: overdueTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      byStatus: statusCounts.reduce((acc: Record<string, number>, { status, _count }: { status: TaskStatus, _count: { id: number } }) => {
        acc[status] = _count.id;
        return acc;
      }, {} as Record<string, number>),
      byPriority: priorityCounts.reduce((acc: Record<string, number>, { priority, _count }: { priority: TaskPriority, _count: { id: number } }) => {
        acc[priority] = _count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  async getRecentTasks(userId: string, limit = 10): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { userId },
      select: this.getTaskSelect(),
      orderBy: {
        updatedAt: 'desc'
      },
      take: limit
    });
    
    return tasks;
  }

  async searchTasks(userId: string, query: string): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        OR: [
          {
            type: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: this.getTaskSelect(),
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' }
      ]
    });
    
    return tasks;
  }
}