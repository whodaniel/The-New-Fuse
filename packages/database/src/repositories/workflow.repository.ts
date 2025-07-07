import { Injectable } from '@nestjs/common';
import { Workflow, WorkflowStatus, WorkflowExecutionStatus } from '../types';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class WorkflowRepository extends BaseRepository<Workflow> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // Helper method to convert Prisma Workflow to App Workflow
  private convertPrismaToApp(prismaWorkflow: any): Workflow {
    return {
      id: prismaWorkflow.id,
      name: prismaWorkflow.name,
      description: prismaWorkflow.description || undefined,
      status: prismaWorkflow.status,
      definition: prismaWorkflow.definition,
      createdAt: prismaWorkflow.createdAt,
      updatedAt: prismaWorkflow.updatedAt,
      executions: prismaWorkflow.executions ? prismaWorkflow.executions.map((exec: any) => this.convertExecutionPrismaToApp(exec)) : undefined
    } as Workflow;
  }

  // Helper method to convert Prisma WorkflowExecution to App WorkflowExecution
  private convertExecutionPrismaToApp(prismaExecution: any): any {
    return {
      id: prismaExecution.id,
      workflowId: prismaExecution.workflowId,
      status: prismaExecution.status,
      input: prismaExecution.input || undefined,
      output: prismaExecution.output || undefined,
      error: prismaExecution.error || undefined,
      startedAt: prismaExecution.startedAt || undefined,
      finishedAt: prismaExecution.finishedAt || undefined,
      createdAt: prismaExecution.createdAt,
      updatedAt: prismaExecution.updatedAt,
      workflow: prismaExecution.workflow ? this.convertPrismaToApp(prismaExecution.workflow) : undefined
    };
  }

  async findById(id: string): Promise<Workflow | null> {
    const result = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: {
            startedAt: 'desc'
          },
          take: 10
        }
      }
    });
    return result ? this.convertPrismaToApp(result) : null;
  }

  async findMany(filters?: any): Promise<Workflow[]> {
    const where = this.buildWhereClause(filters);
    const results = await this.prisma.workflow.findMany({
      where,
      include: {
        _count: {
          select: {
            executions: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return results.map(workflow => this.convertPrismaToApp(workflow));
  }

  async create(data: any): Promise<Workflow> {
    const result = await this.prisma.workflow.create({
      data,
      include: {
        executions: true
      }
    });
    return this.convertPrismaToApp(result);
  }

  async update(id: string, data: any): Promise<Workflow> {
    const result = await this.prisma.workflow.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        executions: true
      }
    });
    return this.convertPrismaToApp(result);
  }

  async delete(id: string): Promise<Workflow> {
    const result = await this.prisma.workflow.delete({
      where: { id }
    });
    return this.convertPrismaToApp(result);
  }

  // Additional methods required by BaseRepository pattern
  async findOne(filter?: any, include?: any): Promise<Workflow | null> {
    const where = this.buildWhereClause(filter);
    const result = await this.prisma.workflow.findFirst({ 
      where, 
      include: include || {
        executions: {
          orderBy: {
            startedAt: 'desc'
          },
          take: 10
        }
      }
    });
    return result ? this.convertPrismaToApp(result) : null;
  }

  async findAll(filter?: any, include?: any, orderBy?: any, skip?: number, take?: number): Promise<Workflow[]> {
    const where = this.buildWhereClause(filter);
    const paginationOptions = this.getPaginationOptions(skip ? Math.floor(skip / (take || 100)) + 1 : undefined, take);
    const sortOptions = this.getSortOptions(orderBy?.field, orderBy?.direction);
    
    const results = await this.prisma.workflow.findMany({
      where,
      include: include || {
        _count: {
          select: {
            executions: true
          }
        }
      },
      orderBy: sortOptions.orderBy || { updatedAt: 'desc' },
      skip: paginationOptions.skip,
      take: paginationOptions.take
    });
    return results.map(workflow => this.convertPrismaToApp(workflow));
  }

  async count(filter?: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.workflow.count({ where });
  }

  protected async countTotal(where: any): Promise<number> {
    return this.prisma.workflow.count({ where });
  }

  // Note: Workflow model doesn't have userId field in current schema
  // This method is kept for compatibility but will return empty array
  async findByUserId(_userId: string): Promise<Workflow[]> {
    // Since there's no userId field in Workflow, return empty array
    return [];
  }

  // Note: Workflow model doesn't have agentId field in current schema
  // This method is kept for compatibility but will return empty array
  async findByAgentId(_agentId: string): Promise<Workflow[]> {
    // Since there's no agentId field in Workflow, return empty array
    return [];
  }

  async findByStatus(status: WorkflowStatus): Promise<Workflow[]> {
    const results = await this.prisma.workflow.findMany({
      where: { status: status as any },
      include: {
        _count: {
          select: {
            executions: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return results.map(workflow => this.convertPrismaToApp(workflow));
  }

  async updateStatus(id: string, status: WorkflowStatus): Promise<Workflow> {
    const result = await this.prisma.workflow.update({
      where: { id },
      data: {
        status: status as any,
        updatedAt: new Date()
      },
      include: {
        executions: true
      }
    });
    return this.convertPrismaToApp(result);
  }

  // Note: WorkflowStep model doesn't exist in current schema
  // Steps are stored in the definition JSON field
  async addStep(workflowId: string, stepData: any): Promise<any> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId }
    });
    
    if (!workflow) {
      throw new Error('Workflow not found');
    }
    
    const definition = workflow.definition as any || { steps: [] };
    const steps = definition.steps || [];
    const newStep = { ...stepData, id: `step_${Date.now()}`, order: steps.length };
    
    const result = await this.prisma.workflow.update({
      where: { id: workflowId },
      data: {
        definition: {
          ...definition,
          steps: [...steps, newStep]
        }
      }
    });
    return this.convertPrismaToApp(result);
  }

  // Note: WorkflowStep model doesn't exist in current schema
  // Steps are stored in the definition JSON field
  async removeStep(workflowId: string, stepId: string): Promise<any> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId }
    });
    
    if (!workflow) {
      throw new Error('Workflow not found');
    }
    
    const definition = workflow.definition as any || { steps: [] };
    const steps = definition.steps || [];
    const filteredSteps = steps.filter((step: any) => step.id !== stepId);
    
    const result = await this.prisma.workflow.update({
      where: { id: workflowId },
      data: {
        definition: {
          ...definition,
          steps: filteredSteps
        }
      }
    });
    return this.convertPrismaToApp(result);
  }

  // Note: WorkflowStep model doesn't exist in current schema
  // Steps are stored in the definition JSON field
  async reorderSteps(workflowId: string, stepOrders: Array<{ id: string; order: number }>): Promise<void> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId }
    });
    
    if (!workflow) {
      throw new Error('Workflow not found');
    }
    
    const definition = workflow.definition as any || { steps: [] };
    const steps = definition.steps || [];
    
    // Reorder steps based on stepOrders
    const reorderedSteps = steps.map((step: any) => {
      const orderInfo = stepOrders.find(o => o.id === step.id);
      return orderInfo ? { ...step, order: orderInfo.order } : step;
    }).sort((a: any, b: any) => a.order - b.order);
    
    await this.prisma.workflow.update({
      where: { id: workflowId },
      data: {
        definition: {
          ...definition,
          steps: reorderedSteps
        }
      }
    });
  }

  async getWorkflowStats(): Promise<any> {
    const statusCounts = await this.prisma.workflow.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const totalWorkflows = await this.prisma.workflow.count();

    const activeWorkflows = await this.prisma.workflow.count({
      where: {
        status: WorkflowStatus.ACTIVE as any
      }
    });

    // Get execution stats
    const executionStats = await this.prisma.workflowExecution.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const totalExecutions = await this.prisma.workflowExecution.count();

    const successfulExecutions = await this.prisma.workflowExecution.count({
      where: {
        status: WorkflowExecutionStatus.SUCCEEDED as any
      }
    });

    return {
      total: totalWorkflows,
      active: activeWorkflows,
      totalExecutions,
      successfulExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
      byStatus: statusCounts.reduce((acc: Record<string, number>, { status, _count }: { status: any, _count: any }) => {
        acc[status] = _count.id;
        return acc;
      }, {} as Record<string, number>),
      executionsByStatus: executionStats.reduce((acc: Record<string, number>, { status, _count }: { status: any, _count: any }) => {
        acc[status] = _count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  async searchWorkflows(query: string): Promise<Workflow[]> {
    const results = await this.prisma.workflow.findMany({
      where: {
        OR: [
          {
            name: {
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
      include: {
        _count: {
          select: {
            executions: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return results.map(workflow => this.convertPrismaToApp(workflow));
  }
}
