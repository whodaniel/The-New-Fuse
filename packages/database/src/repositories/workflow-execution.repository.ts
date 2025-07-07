import { Injectable } from '@nestjs/common';
import { WorkflowExecution, WorkflowExecutionStatus } from '../types';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class WorkflowExecutionRepository extends BaseRepository<WorkflowExecution> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  private convertPrismaToApp(prismaExecution: any): WorkflowExecution {
    return {
      id: prismaExecution.id,
      workflowId: prismaExecution.workflowId,
      status: prismaExecution.status,
      input: prismaExecution.input || undefined,
      output: prismaExecution.output || undefined,
      error: prismaExecution.error || undefined,
      startedAt: prismaExecution.startedAt || undefined,
      finishedAt: prismaExecution.completedAt || undefined,
      createdAt: prismaExecution.createdAt || new Date(),
      updatedAt: prismaExecution.updatedAt || new Date()
    };
  }

  async findById(id: string): Promise<WorkflowExecution | null> {
    const result = await this.prisma.workflowExecution.findUnique({
      where: { id },
      select: {
        id: true,
        workflowId: true,
        status: true,
        input: true,
        output: true,
        error: true,
        startedAt: true,
        completedAt: true
      }
    });
    return result ? this.convertPrismaToApp(result) : null;
  }

  async findMany(filters?: any): Promise<WorkflowExecution[]> {
    const where = this.buildWhereClause(filters);
    const results = await this.prisma.workflowExecution.findMany({
      where,
      select: {
        id: true,
        workflowId: true,
        status: true,
        input: true,
        output: true,
        error: true,
        startedAt: true,
        completedAt: true
      },
      orderBy: {
        startedAt: 'desc'
      }
    });
    return results.map(result => this.convertPrismaToApp(result));
  }

  async create(data: any): Promise<WorkflowExecution> {
    const result = await this.prisma.workflowExecution.create({
      data,
      select: {
        id: true,
        workflowId: true,
        status: true,
        input: true,
        output: true,
        error: true,
        startedAt: true,
        completedAt: true
      }
    });
    return this.convertPrismaToApp(result);
  }

  async update(id: string, data: any): Promise<WorkflowExecution> {
    const result = await this.prisma.workflowExecution.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      select: {
        id: true,
        workflowId: true,
        status: true,
        input: true,
        output: true,
        error: true,
        startedAt: true,
        completedAt: true
      }
    });
    return this.convertPrismaToApp(result);
  }

  async delete(id: string): Promise<WorkflowExecution> {
    const result = await this.prisma.workflowExecution.delete({
      where: { id },
      select: {
        id: true,
        workflowId: true,
        status: true,
        input: true,
        output: true,
        error: true,
        startedAt: true,
        completedAt: true
      }
    });
    return this.convertPrismaToApp(result);
  }

  // Additional methods required by BaseRepository pattern
  async findOne(filter?: any, include?: any): Promise<WorkflowExecution | null> {
    const where = this.buildWhereClause(filter);
    const result = await this.prisma.workflowExecution.findFirst({ 
      where, 
      select: {
        id: true,
        workflowId: true,
        status: true,
        input: true,
        output: true,
        error: true,
        startedAt: true,
        completedAt: true
      }
    });
    return result ? this.convertPrismaToApp(result) : null;
  }

  async findAll(filter?: any, orderBy?: any, skip?: number, take?: number): Promise<WorkflowExecution[]> {
    const where = this.buildWhereClause(filter);
    const paginationOptions = this.getPaginationOptions(skip ? Math.floor(skip / (take || 100)) + 1 : undefined, take);
    const sortOptions = this.getSortOptions(orderBy?.field, orderBy?.direction);
    
    const results = await this.prisma.workflowExecution.findMany({
      where,
      select: {
        id: true,
        workflowId: true,
        status: true,
        input: true,
        output: true,
        error: true,
        startedAt: true,
        completedAt: true
      },
      orderBy: sortOptions.orderBy || { startedAt: 'desc' },
      skip: paginationOptions.skip,
      take: paginationOptions.take
    });
    return results.map(result => this.convertPrismaToApp(result));
  }

  async count(filter?: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.workflowExecution.count({ where });
  }

  protected async countTotal(where: any): Promise<number> {
    return this.prisma.workflowExecution.count({ where });
  }

  async findByWorkflowId(workflowId: string): Promise<WorkflowExecution[]> {
    const results = await this.prisma.workflowExecution.findMany({
      where: { workflowId },
      select: {
        id: true,
        workflowId: true,
        status: true,
        input: true,
        output: true,
        error: true,
        startedAt: true,
        completedAt: true
      },
      orderBy: {
        startedAt: 'desc'
      }
    });
    return results.map(result => this.convertPrismaToApp(result));
  }

  async findByStatus(status: WorkflowExecutionStatus): Promise<WorkflowExecution[]> {
    const results = await this.prisma.workflowExecution.findMany({
      where: { status: status as any },
      select: {
        id: true,
        workflowId: true,
        status: true,
        input: true,
        output: true,
        error: true,
        startedAt: true,
        completedAt: true
      },
      orderBy: {
        startedAt: 'desc'
      }
    });
    return results.map(result => this.convertPrismaToApp(result));
  }

  async updateStatus(id: string, status: WorkflowExecutionStatus, output?: any, error?: string): Promise<WorkflowExecution> {
    const updateData: any = {
      status: status as any,
      updatedAt: new Date()
    };

    if (status === WorkflowExecutionStatus.SUCCEEDED || status === WorkflowExecutionStatus.FAILED) {
      updateData.completedAt = new Date();
    }

    if (output !== undefined) {
      updateData.output = output;
    }

    if (error) {
      updateData.error = error;
    }

    const result = await this.prisma.workflowExecution.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        workflowId: true,
        status: true,
        input: true,
        output: true,
        error: true,
        startedAt: true,
        completedAt: true
      }
    });
    return this.convertPrismaToApp(result);
  }

  async getRunningExecutions(): Promise<WorkflowExecution[]> {
    return this.findByStatus(WorkflowExecutionStatus.RUNNING);
  }

  async getPendingExecutions(): Promise<WorkflowExecution[]> {
    return this.findByStatus(WorkflowExecutionStatus.PENDING);
  }

  async getExecutionStats(workflowId?: string): Promise<any> {
    const where = workflowId ? { workflowId } : {};

    const statusCounts = await this.prisma.workflowExecution.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true
      }
    });

    const totalExecutions = await this.prisma.workflowExecution.count({ where });

    const completedExecutions = await this.prisma.workflowExecution.count({
      where: {
        ...where,
        status: WorkflowExecutionStatus.SUCCEEDED as any
      }
    });

    const failedExecutions = await this.prisma.workflowExecution.count({
      where: {
        ...where,
        status: WorkflowExecutionStatus.FAILED as any
      }
    });

    // Calculate average execution time for completed executions
    const completedWithTimes = await this.prisma.workflowExecution.findMany({
      where: {
        ...where,
        status: WorkflowExecutionStatus.SUCCEEDED as any,
        completedAt: { not: null }
      },
      select: {
        startedAt: true,
        completedAt: true
      }
    });

    const executionTimes = completedWithTimes
      .filter((exec: any) => exec.completedAt)
      .map((exec: any) => exec.completedAt!.getTime() - exec.startedAt.getTime());

    const avgExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((a: number, b: number) => a + b, 0) / executionTimes.length
      : 0;

    return {
      total: totalExecutions,
      completed: completedExecutions,
      failed: failedExecutions,
      successRate: totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0,
      failureRate: totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0,
      avgExecutionTimeMs: avgExecutionTime,
      byStatus: statusCounts.reduce((acc: Record<string, number>, { status, _count }: { status: any, _count: any }) => {
        acc[status] = _count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  async getRecentExecutions(workflowId?: string, limit = 10): Promise<WorkflowExecution[]> {
    const where = workflowId ? { workflowId } : {};

    const results = await this.prisma.workflowExecution.findMany({
      where,
      select: {
        id: true,
        workflowId: true,
        status: true,
        input: true,
        output: true,
        error: true,
        startedAt: true,
        completedAt: true
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: limit
    });
    return results.map(result => this.convertPrismaToApp(result));
  }

  async getLongRunningExecutions(thresholdMinutes = 60): Promise<WorkflowExecution[]> {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);

    const results = await this.prisma.workflowExecution.findMany({
      where: {
        status: WorkflowExecutionStatus.RUNNING as any,
        startedAt: {
          lt: threshold
        }
      },
      select: {
        id: true,
        workflowId: true,
        status: true,
        input: true,
        output: true,
        error: true,
        startedAt: true,
        completedAt: true
      },
      orderBy: {
        startedAt: 'asc'
      }
    });
    return results.map(result => this.convertPrismaToApp(result));
  }

  async cancelExecution(id: string): Promise<WorkflowExecution> {
    return this.updateStatus(id, WorkflowExecutionStatus.CANCELLED);
  }

  async retryExecution(id: string): Promise<WorkflowExecution> {
    const execution = await this.findById(id);
    if (!execution) {
      throw new Error('Execution not found');
    }

    // Create a new execution based on the failed one
    return this.create({
      workflowId: execution.workflowId,
      input: execution.input,
      status: WorkflowExecutionStatus.PENDING
    });
  }

  async getExecutionHistory(workflowId: string, limit = 50): Promise<WorkflowExecution[]> {
    const results = await this.prisma.workflowExecution.findMany({
      where: { workflowId },
      select: {
        id: true,
        workflowId: true,
        status: true,
        input: true,
        output: true,
        error: true,
        startedAt: true,
        completedAt: true
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: limit
    });
    return results.map(result => this.convertPrismaToApp(result));
  }
}
