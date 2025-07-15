import { Injectable } from '@nestjs/common';
import { Workflow, WorkflowStatus, WorkflowExecutionStatus, WorkflowExecution, Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class WorkflowRepository extends BaseRepository<Workflow, Prisma.WorkflowCreateInput, Prisma.WorkflowUpdateInput, Prisma.WorkflowWhereInput> {
  constructor(prisma: PrismaService) {
    super(prisma, 'workflow');
  }

  // Helper method to convert Prisma Workflow to App Workflow
  private convertPrismaToApp(prismaWorkflow: Workflow & { executions?: WorkflowExecution[], steps?: any[], agent?: any, user?: any }): any {
    return {
      id: prismaWorkflow.id,
      name: prismaWorkflow.name,
      description: prismaWorkflow.description ?? null,
      definition: prismaWorkflow.definition,
      status: prismaWorkflow.status,
      createdAt: prismaWorkflow.createdAt,
      updatedAt: prismaWorkflow.updatedAt,
      lastExecutedAt: prismaWorkflow.lastExecutedAt ?? null,
      agentId: prismaWorkflow.agentId ?? null,
      creatorId: prismaWorkflow.creatorId ?? null,
      executions: prismaWorkflow.executions?.map((exec: any) => this.convertExecutionPrismaToApp(exec)) ?? [],
      steps: prismaWorkflow.steps?.map((step) => ({ ...step })) ?? [],
    };
  }

  // Helper method to convert Prisma WorkflowExecution to App WorkflowExecution
  private convertExecutionPrismaToApp(prismaExecution: WorkflowExecution): WorkflowExecution {
    return {
      id: prismaExecution.id,
      workflowId: prismaExecution.workflowId,
      status: prismaExecution.status,
      input: prismaExecution.input ?? null,
      output: prismaExecution.output ?? null,
      error: prismaExecution.error ?? null,
      startedAt: prismaExecution.startedAt,
      completedAt: prismaExecution.completedAt ?? null,
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
        },
        agent: true,
      }
    });
    return result ? this.convertPrismaToApp(result) : null;
  }

  async findMany(filters?: Prisma.WorkflowWhereInput): Promise<Workflow[]> {
    const results = await this.prisma.workflow.findMany({
      where: filters,
      include: {
        executions: true,
        agent: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return results.map(workflow => this.convertPrismaToApp(workflow));
  }

  async create(data: Prisma.WorkflowCreateInput): Promise<Workflow> {
    const result = await this.prisma.workflow.create({
      data,
      include: {
        executions: true,
        agent: true,
      }
    });
    return this.convertPrismaToApp(result);
  }

  async update(id: string, data: Prisma.WorkflowUpdateInput): Promise<Workflow> {
    const result = await this.prisma.workflow.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        executions: true,
        agent: true,
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

  async findByCreatorId(creatorId: string): Promise<Workflow[]> {
    const results = await this.prisma.workflow.findMany({
      where: { creatorId },
      include: {
        executions: true,
        agent: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return results.map(workflow => this.convertPrismaToApp(workflow));
  }

  async findByAgentId(agentId: string): Promise<Workflow[]> {
    const results = await this.prisma.workflow.findMany({
      where: { agentId },
      include: {
        executions: true,
        agent: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return results.map(workflow => this.convertPrismaToApp(workflow));
  }

  async findByStatus(status: WorkflowStatus): Promise<Workflow[]> {
    const results = await this.prisma.workflow.findMany({
      where: { status },
      include: {
        executions: true,
        agent: true,
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
        status,
        updatedAt: new Date()
      },
      include: {
        executions: true,
        agent: true,
      }
    });
    return this.convertPrismaToApp(result);
  }

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
        status: WorkflowStatus.ACTIVE
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
                status: WorkflowExecutionStatus.COMPLETED
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
        executions: true,
        agent: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return results.map(workflow => this.convertPrismaToApp(workflow));
  }
}
