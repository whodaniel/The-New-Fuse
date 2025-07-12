import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowExecution } from '@the-new-fuse/types';

@Injectable()
export class WorkflowExecutionRepository {
  constructor(protected readonly prisma: PrismaService) {}

  // Helper method to convert Prisma WorkflowExecution to App WorkflowExecution
  private convertPrismaToApp(prismaExecution: any): WorkflowExecution {
    // Convert string status to proper WorkflowExecution status type
    let typedStatus: 'running' | 'completed' | 'failed' = 'running';
    
    if (typeof prismaExecution.status === 'string') {
      const status = prismaExecution.status.toLowerCase();
      if (status === 'completed' || status === 'succeeded') typedStatus = 'completed';
      else if (status === 'failed') typedStatus = 'failed';
      else typedStatus = 'running';
    }

    return {
      id: prismaExecution.id,
      workflowId: prismaExecution.workflowId,
      status: typedStatus,
      startedAt: prismaExecution.startedAt,
      completedAt: prismaExecution.finishedAt || null,
      result: prismaExecution.outputs || undefined,
      error: prismaExecution.error || null,
      stepResults: prismaExecution.stepResults || {},
      deletedAt: null,
      createdAt: prismaExecution.createdAt?.toISOString() || prismaExecution.startedAt.toISOString(),
      updatedAt: prismaExecution.updatedAt?.toISOString() || new Date().toISOString()
    } as unknown as WorkflowExecution;
  }

  // Implement abstract methods from BaseRepository
  async findById(id: string): Promise<WorkflowExecution | null> {
    const result = await this.prisma.workflowExecution.findUnique({ 
      where: { id },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });
    return result ? this.convertPrismaToApp(result) : null;
  }

  async findMany(filters?: any): Promise<WorkflowExecution[]> {
    const where = filters || {};
    const results = await this.prisma.workflowExecution.findMany({ 
      where,
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });
    return results.map(execution => this.convertPrismaToApp(execution));
  }

  async create(data: any): Promise<WorkflowExecution> {
    const result = await this.prisma.workflowExecution.create({ 
      data,
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });
    return this.convertPrismaToApp(result);
  }

  async update(id: string, data: any): Promise<WorkflowExecution> {
    const result = await this.prisma.workflowExecution.update({ 
      where: { id }, 
      data,
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });
    return this.convertPrismaToApp(result);
  }

  async delete(id: string): Promise<WorkflowExecution> {
    const result = await this.prisma.workflowExecution.delete({ where: { id } });
    return this.convertPrismaToApp(result);
  }

  // Additional methods for compatibility with existing services
  async findAll(filter?: any, include?: any, orderBy?: any, skip?: number, take?: number): Promise<WorkflowExecution[]> {
    const where = filter || {};
    
    const options: any = {
      where,
      include: include || {
        workflow: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    };
    
    if (orderBy?.field) {
      options.orderBy = { [orderBy.field]: orderBy.direction || 'asc' };
    }
    
    if (skip !== undefined) {
      options.skip = skip;
    }
    
    if (take !== undefined) {
      options.take = take;
    }
    
    const results = await this.prisma.workflowExecution.findMany(options);
    return results.map(execution => this.convertPrismaToApp(execution));
  }

  async findOne(filter?: any, include?: any): Promise<WorkflowExecution | null> {
    const where = filter || {};
    const result = await this.prisma.workflowExecution.findFirst({ 
      where, 
      include: include || {
        workflow: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });
    return result ? this.convertPrismaToApp(result) : null;
  }

  async count(filter?: any): Promise<number> {
    const where = filter || {};
    return this.prisma.workflowExecution.count({ where });
  }

  protected async countTotal(where: any): Promise<number> {
    return this.prisma.workflowExecution.count({ where });
  }

  // Custom repository methods
  async findByWorkflowId(workflowId: string): Promise<WorkflowExecution[]> {
    return this.findAll({ workflowId });
  }

  async findByStatus(status: string): Promise<WorkflowExecution[]> {
    return this.findAll({ status });
  }

  async findByUserId(userId: string): Promise<WorkflowExecution[]> {
    return this.findAll({ userId });
  }

  async updateStatus(id: string, status: string, output?: any, error?: string): Promise<WorkflowExecution> {
    const updateData: any = { status };

    if (status === 'completed' || status === 'succeeded' || status === 'failed') {
      updateData.finishedAt = new Date();
    }

    if (output !== undefined) {
      updateData.outputs = output;
    }

    if (error) {
      updateData.error = error;
    }

    return this.update(id, updateData);
  }

  async getRunningExecutions(): Promise<WorkflowExecution[]> {
    return this.findByStatus('running');
  }

  async getPendingExecutions(): Promise<WorkflowExecution[]> {
    return this.findByStatus('pending');
  }

  async cancelExecution(id: string): Promise<WorkflowExecution> {
    return this.updateStatus(id, 'cancelled');
  }

  async getExecutionHistory(workflowId: string, limit = 50): Promise<WorkflowExecution[]> {
    const results = await this.prisma.workflowExecution.findMany({
      where: { workflowId },
      orderBy: {
        startedAt: 'desc'
      },
      take: limit
    });
    return results.map(execution => this.convertPrismaToApp(execution));
  }
}