import { Injectable } from '@nestjs/common';
import { Task, TaskStatus, TaskPriority } from '../../generated/prisma';
import { PrismaService } from '../prisma.service';
import { Prisma } from '../../generated/prisma';

@Injectable()
export class TaskRepository {
  constructor(private prisma: PrismaService) {}

  private mapDatabaseTaskToTask(dbTask: Task): Task {
    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description ?? null,
      status: dbTask.status,
      priority: dbTask.priority,
      createdAt: dbTask.createdAt,
      updatedAt: dbTask.updatedAt,
      assignedTo: dbTask.assignedTo ?? null,
      createdBy: dbTask.createdBy,
      metadata: dbTask.metadata ?? null,
      completedAt: dbTask.completedAt ?? null,
      type: dbTask.type,
      dueDate: dbTask.dueDate ?? null,
      tags: dbTask.tags,
      dependencies: dbTask.dependencies,
      error: dbTask.error ?? null,
    };
  }

  private getTaskSelect() {
    return {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      type: true,
      createdAt: true,
      updatedAt: true,
      dueDate: true,
      assignedTo: true,
      createdBy: true,
      metadata: true,
      tags: true,
      dependencies: true,
      error: true,
      completedAt: true,
    };
  }

  async findById(id: string): Promise<Task | null> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: this.getTaskSelect()
    });

    if (!task) return null;
    return this.mapDatabaseTaskToTask(task);
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
    
    return tasks.map(task => this.mapDatabaseTaskToTask(task));
  }

  async create(data: Prisma.TaskCreateInput): Promise<Task> {
    const task = await this.prisma.task.create({
      data,
      select: this.getTaskSelect()
    });
    return this.mapDatabaseTaskToTask(task);
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
    return this.mapDatabaseTaskToTask(task);
  }

  async delete(id: string): Promise<Task> {
    const task = await this.prisma.task.delete({
      where: { id },
      select: this.getTaskSelect()
    });
    
    return this.mapDatabaseTaskToTask(task);
  }

  async findByCreatedBy(userId: string): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { createdBy: userId },
      select: this.getTaskSelect(),
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return tasks.map(task => this.mapDatabaseTaskToTask(task));
  }

  async findByAssignedTo(agentId: string): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { assignedTo: agentId },
      select: this.getTaskSelect(),
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return tasks.map(task => this.mapDatabaseTaskToTask(task));
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
    
    return tasks.map(task => this.mapDatabaseTaskToTask(task));
  }

  async findByPriority(priority: TaskPriority): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { priority },
      select: this.getTaskSelect(),
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return tasks.map(task => this.mapDatabaseTaskToTask(task));
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
      select: this.getTaskSelect()
    });
    
    return this.mapDatabaseTaskToTask(task);
  }

  async assignToAgent(id: string, agentId: string): Promise<Task> {
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        assignedTo: agentId,
        status: TaskStatus.IN_PROGRESS,
        updatedAt: new Date()
      },
      select: this.getTaskSelect()
    });
    
    return this.mapDatabaseTaskToTask(task);
  }

  async getTaskStats(createdBy?: string): Promise<{ total: number; completed: number; overdue: number; completionRate: number; byStatus: Record<string, number>; byPriority: Record<string, number> }> {
    const where = createdBy ? { createdBy: createdBy } : {};

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

  async getRecentTasks(createdBy: string, limit = 10): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { createdBy: createdBy },
      select: this.getTaskSelect(),
      orderBy: {
        updatedAt: 'desc'
      },
      take: limit
    });
    
    return tasks.map(task => this.mapDatabaseTaskToTask(task));
  }

  async searchTasks(createdBy: string, query: string): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        createdBy: createdBy,
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            description: {
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
    
    return tasks.map(task => this.mapDatabaseTaskToTask(task));
  }
}