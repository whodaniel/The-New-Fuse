import { Injectable } from '@nestjs/common';
import {
  Agent,
  Prisma,
  User,
  Workflow,
  WorkflowExecution,
  WorkflowExecutionStatus,
  WorkflowStatus,
} from '../../generated/prisma';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

export type WorkflowStep = {
  id: string;
  order: number;
  [key: string]: any;
};

export type AppWorkflow = Workflow & {
  executions: WorkflowExecution[];
  steps: WorkflowStep[];
  agent?: Agent | null;
  user?: User | null;
};

@Injectable()
export class WorkflowRepository extends BaseRepository<
  Workflow,
  Prisma.WorkflowCreateInput,
  Prisma.WorkflowUpdateInput,
  Prisma.WorkflowWhereInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'workflow');
  }

  // Helper method to convert Prisma Workflow to App Workflow
  private convertPrismaToApp(
    prismaWorkflow: Workflow & {
      executions?: WorkflowExecution[];
      agent?: Agent | null;
      user?: User | null;
    }
  ): AppWorkflow {
    const definition = (prismaWorkflow.definition as { steps?: WorkflowStep[] }) || { steps: [] };
    return {
      ...prismaWorkflow,
      executions: prismaWorkflow.executions?.map(this.convertExecutionPrismaToApp) ?? [],
      steps: definition.steps ?? [],
    };
  }

  // Helper method to convert Prisma WorkflowExecution to App WorkflowExecution
  private convertExecutionPrismaToApp(prismaExecution: WorkflowExecution): WorkflowExecution {
    return {
      ...prismaExecution,
      input: prismaExecution.input ?? null,
      output: prismaExecution.output ?? null,
      error: prismaExecution.error ?? null,
      completedAt: prismaExecution.completedAt ?? null,
      projectId: prismaExecution.projectId ?? null,
    };
  }

  async findById(id: string): Promise<AppWorkflow | null> {
    const result = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: {
            startedAt: 'desc',
          },
          take: 10,
        },
        agent: { include: { user: true } },
      },
    });
    return result ? this.convertPrismaToApp(result) : null;
  }

  async findMany(filters?: Prisma.WorkflowWhereInput): Promise<AppWorkflow[]> {
    const results = await this.prisma.workflow.findMany({
      where: filters,
      include: {
        executions: true,
        agent: { include: { user: true } },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return results.map((workflow: Workflow) => this.convertPrismaToApp(workflow));
  }

  async create(data: Prisma.WorkflowCreateInput): Promise<AppWorkflow> {
    const result = await this.prisma.workflow.create({
      data,
      include: {
        executions: true,
        agent: { include: { user: true } },
      },
    });
    return this.convertPrismaToApp(result);
  }

  async update(id: string, data: Prisma.WorkflowUpdateInput): Promise<AppWorkflow> {
    const result = await this.prisma.workflow.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        executions: true,
        agent: { include: { user: true } },
      },
    });
    return this.convertPrismaToApp(result);
  }

  async delete(id: string): Promise<AppWorkflow> {
    const result = await this.prisma.workflow.delete({
      where: { id },
      include: {
        executions: true,
        agent: { include: { user: true } },
      },
    });
    return this.convertPrismaToApp(result);
  }

  async findByCreatorId(creatorId: string): Promise<AppWorkflow[]> {
    const results = await this.prisma.workflow.findMany({
      where: { creatorId },
      include: {
        executions: true,
        agent: { include: { user: true } },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return results.map((workflow: Workflow) => this.convertPrismaToApp(workflow));
  }

  async findByAgentId(agentId: string): Promise<AppWorkflow[]> {
    const results = await this.prisma.workflow.findMany({
      where: { agentId },
      include: {
        executions: true,
        agent: { include: { user: true } },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return results.map((workflow: Workflow) => this.convertPrismaToApp(workflow));
  }

  async findByStatus(status: WorkflowStatus): Promise<AppWorkflow[]> {
    const results = await this.prisma.workflow.findMany({
      where: { status },
      include: {
        executions: true,
        agent: { include: { user: true } },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return results.map((workflow: Workflow) => this.convertPrismaToApp(workflow));
  }

  async updateStatus(id: string, status: WorkflowStatus): Promise<AppWorkflow> {
    const result = await this.prisma.workflow.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        executions: true,
        agent: { include: { user: true } },
      },
    });
    return this.convertPrismaToApp(result);
  }

  async addStep(
    workflowId: string,
    stepData: Omit<WorkflowStep, 'id' | 'order'>
  ): Promise<AppWorkflow> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        executions: true,
        agent: { include: { user: true } },
      },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const definition = (workflow.definition as { steps?: WorkflowStep[] }) || { steps: [] };
    const steps = definition.steps || [];
    const newStep: WorkflowStep = { ...stepData, id: `step_${Date.now()}`, order: steps.length };

    const result = await this.prisma.workflow.update({
      where: { id: workflowId },
      data: {
        definition: {
          ...definition,
          steps: [...steps, newStep],
        },
      },
      include: {
        executions: true,
        agent: { include: { user: true } },
      },
    });
    return this.convertPrismaToApp(result);
  }

  async removeStep(workflowId: string, stepId: string): Promise<AppWorkflow> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        executions: true,
        agent: { include: { user: true } },
      },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const definition = (workflow.definition as { steps?: WorkflowStep[] }) || { steps: [] };
    const steps = definition.steps || [];
    const filteredSteps = steps.filter((step) => step.id !== stepId);

    const result = await this.prisma.workflow.update({
      where: { id: workflowId },
      data: {
        definition: {
          ...definition,
          steps: filteredSteps,
        },
      },
      include: {
        executions: true,
        agent: { include: { user: true } },
      },
    });
    return this.convertPrismaToApp(result);
  }

  async reorderSteps(
    workflowId: string,
    stepOrders: Array<{ id: string; order: number }>
  ): Promise<void> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const definition = (workflow.definition as { steps?: WorkflowStep[] }) || { steps: [] };
    const steps = definition.steps || [];

    // Reorder steps based on stepOrders
    const reorderedSteps = steps
      .map((step) => {
        const orderInfo = stepOrders.find((o) => o.id === step.id);
        return orderInfo ? { ...step, order: orderInfo.order } : step;
      })
      .sort((a, b) => a.order - b.order);

    await this.prisma.workflow.update({
      where: { id: workflowId },
      data: {
        definition: {
          ...definition,
          steps: reorderedSteps,
        },
      },
    });
  }

  async getWorkflowStats(): Promise<{
    total: number;
    active: number;
    totalExecutions: number;
    successfulExecutions: number;
    successRate: number;
    byStatus: Record<string, number>;
    executionsByStatus: Record<string, number>;
  }> {
    const statusCounts = await this.prisma.workflow.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const totalWorkflows = await this.prisma.workflow.count();

    const activeWorkflows = await this.prisma.workflow.count({
      where: {
        status: WorkflowStatus.ACTIVE,
      },
    });

    const executionStats = await this.prisma.workflowExecution.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const totalExecutions = await this.prisma.workflowExecution.count();

    const successfulExecutions = await this.prisma.workflowExecution.count({
      where: {
        status: WorkflowExecutionStatus.COMPLETED,
      },
    });

    return {
      total: totalWorkflows,
      active: activeWorkflows,
      totalExecutions,
      successfulExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
      byStatus: statusCounts.reduce(
        (
          acc: Record<string, number>,
          { status, _count }: { status: WorkflowStatus; _count: { id: number } }
        ) => {
          acc[status] = _count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
      executionsByStatus: executionStats.reduce(
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

  async searchWorkflows(query: string): Promise<AppWorkflow[]> {
    const results = await this.prisma.workflow.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        executions: true,
        agent: { include: { user: true } },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return results.map((workflow: Workflow) => this.convertPrismaToApp(workflow));
  }
}
