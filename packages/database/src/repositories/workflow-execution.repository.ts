import { Injectable } from '@nestjs/common';
import { Prisma, WorkflowExecution, WorkflowExecutionStatus } from '../../generated/prisma';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class WorkflowExecutionRepository extends BaseRepository<
  WorkflowExecution,
  Prisma.WorkflowExecutionCreateInput,
  Prisma.WorkflowExecutionUpdateInput,
  Prisma.WorkflowExecutionWhereInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'workflowExecution');
  }

  private convertPrismaToApp(prismaExecution: WorkflowExecution): WorkflowExecution {
    return {
      id: prismaExecution.id,
      workflowId: prismaExecution.workflowId,
      status: prismaExecution.status,
      input: prismaExecution.input ?? null,
      output: prismaExecution.output ?? null,
      error: prismaExecution.error ?? null,
      startedAt: prismaExecution.startedAt,
      completedAt: prismaExecution.completedAt ?? null,
      projectId: prismaExecution.projectId ?? null,
    };
  }

  async findById(id: string): Promise<WorkflowExecution | null> {
    const result = await this.prisma.workflowExecution.findUnique({
      where: { id },
    });
    return result ? this.convertPrismaToApp(result) : null;
  }

  async findMany(filters?: Prisma.WorkflowExecutionWhereInput): Promise<WorkflowExecution[]> {
    const results = await this.prisma.workflowExecution.findMany({
      where: filters,
      orderBy: {
        startedAt: 'desc',
      },
    });
    return results.map((result: WorkflowExecution) => this.convertPrismaToApp(result));
  }

  async create(data: Prisma.WorkflowExecutionCreateInput): Promise<WorkflowExecution> {
    const result = await this.prisma.workflowExecution.create({
      data,
    });
    return this.convertPrismaToApp(result);
  }

  async update(id: string, data: Partial<WorkflowExecution>): Promise<WorkflowExecution> {
    // Build update data with proper Prisma types
    const updateData: Prisma.WorkflowExecutionUpdateInput = {};

    // Note: workflowId and projectId are relation fields and can't be updated directly
    if (data.status !== undefined) updateData.status = data.status;
    if (data.input !== undefined && data.input !== null)
      updateData.input = data.input as Prisma.InputJsonValue;
    if (data.output !== undefined && data.output !== null)
      updateData.output = data.output as Prisma.InputJsonValue;
    if (data.error !== undefined) updateData.error = data.error;
    if (data.startedAt !== undefined) updateData.startedAt = data.startedAt;
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;

    const result = await this.prisma.workflowExecution.update({
      where: { id },
      data: updateData,
    });
    return this.convertPrismaToApp(result);
  }

  async delete(id: string): Promise<WorkflowExecution> {
    const result = await this.prisma.workflowExecution.delete({
      where: { id },
    });
    return this.convertPrismaToApp(result);
  }

  async findByWorkflowId(workflowId: string): Promise<WorkflowExecution[]> {
    const results = await this.prisma.workflowExecution.findMany({
      where: { workflowId },
      orderBy: {
        startedAt: 'desc',
      },
    });
    return results.map((result: WorkflowExecution) => this.convertPrismaToApp(result));
  }

  async findByStatus(status: WorkflowExecutionStatus): Promise<WorkflowExecution[]> {
    const results = await this.prisma.workflowExecution.findMany({
      where: { status },
      orderBy: {
        startedAt: 'desc',
      },
    });
    return results.map((result: WorkflowExecution) => this.convertPrismaToApp(result));
  }

  async updateStatus(
    id: string,
    status: WorkflowExecutionStatus,
    output?: Prisma.JsonValue,
    error?: string
  ): Promise<WorkflowExecution> {
    const updateData: Prisma.WorkflowExecutionUpdateInput = {
      status,
    };

    if (status === WorkflowExecutionStatus.COMPLETED || status === WorkflowExecutionStatus.FAILED) {
      updateData.completedAt = new Date();
    }

    if (output !== undefined && output !== null) {
      updateData.output = output as Prisma.InputJsonValue;
    }

    if (error) {
      updateData.error = error;
    }

    const result = await this.prisma.workflowExecution.update({
      where: { id },
      data: updateData,
    });
    return this.convertPrismaToApp(result);
  }

  async getRunningExecutions(): Promise<WorkflowExecution[]> {
    return this.findByStatus(WorkflowExecutionStatus.RUNNING);
  }

  async getPendingExecutions(): Promise<WorkflowExecution[]> {
    return this.findByStatus(WorkflowExecutionStatus.PENDING);
  }

  async getExecutionStats(workflowId?: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    successRate: number;
    failureRate: number;
    avgExecutionTimeMs: number;
    byStatus: Record<string, number>;
  }> {
    const where: Prisma.WorkflowExecutionWhereInput = workflowId ? { workflowId } : {};

    const statusCounts = await this.prisma.workflowExecution.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });

    const totalExecutions = await this.prisma.workflowExecution.count({ where });

    const completedExecutions = await this.prisma.workflowExecution.count({
      where: {
        ...where,
        status: WorkflowExecutionStatus.COMPLETED,
      },
    });

    const failedExecutions = await this.prisma.workflowExecution.count({
      where: {
        ...where,
        status: WorkflowExecutionStatus.FAILED,
      },
    });

    // Calculate average execution time for completed executions
    const completedWithTimes = await this.prisma.workflowExecution.findMany({
      where: {
        ...where,
        status: WorkflowExecutionStatus.COMPLETED,
        completedAt: { not: null },
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    });

    const executionTimes = completedWithTimes
      .filter(
        (exec: { completedAt: Date | null }): exec is { startedAt: Date; completedAt: Date } =>
          exec.completedAt !== null
      )
      .map(
        (exec: { completedAt: Date; startedAt: Date }) =>
          exec.completedAt.getTime() - exec.startedAt.getTime()
      );

    const avgExecutionTime =
      executionTimes.length > 0
        ? executionTimes.reduce((a: number, b: number) => a + b, 0) / executionTimes.length
        : 0;

    return {
      total: totalExecutions,
      completed: completedExecutions,
      failed: failedExecutions,
      successRate: totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0,
      failureRate: totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0,
      avgExecutionTimeMs: avgExecutionTime,
      byStatus: statusCounts.reduce(
        (
          acc: Record<string, number>,
          { status, _count }: { status: WorkflowExecutionStatus; _count: { id: number } }
        ) => {
          acc[status] = _count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }

  async getRecentExecutions(workflowId?: string, limit = 10): Promise<WorkflowExecution[]> {
    const where = workflowId ? { workflowId } : {};

    const results = await this.prisma.workflowExecution.findMany({
      where,
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
    });
    return results.map((result: WorkflowExecution) => this.convertPrismaToApp(result));
  }

  async getLongRunningExecutions(thresholdMinutes = 60): Promise<WorkflowExecution[]> {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);

    const results = await this.prisma.workflowExecution.findMany({
      where: {
        status: WorkflowExecutionStatus.RUNNING,
        startedAt: {
          lt: threshold,
        },
      },
      orderBy: {
        startedAt: 'asc',
      },
    });
    return results.map((result: WorkflowExecution) => this.convertPrismaToApp(result));
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
      workflow: { connect: { id: execution.workflowId } },
      input: execution.input || {},
      status: WorkflowExecutionStatus.PENDING,
      startedAt: new Date(),
    });
  }

  async getExecutionHistory(workflowId: string, limit = 50): Promise<WorkflowExecution[]> {
    const results = await this.prisma.workflowExecution.findMany({
      where: { workflowId },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
    });
    return results.map((result: WorkflowExecution) => this.convertPrismaToApp(result));
  }
}
