import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { WorkflowEngine, WorkflowExecutor } from '../types/core';
import { CreateWorkflowDto, WorkflowInput, WorkflowExecutionStatus, Workflow } from '@the-new-fuse/types';
import { Prisma } from '@the-new-fuse/database/generated/prisma';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('WorkflowEngine') private readonly workflowEngine: WorkflowEngine,
    @Inject('WorkflowExecutor') private readonly workflowExecutor: WorkflowExecutor,
  ) {}

  async createWorkflow(data: CreateWorkflowDto): Promise<Workflow> {
    try {
      this.logger.log(`Creating workflow: ${data.name}`);
      
      // Use the workflow engine for validation and creation
      const workflowDefinition = {
        ...data,
        id: undefined, // Let the engine generate the ID
        version: 1,
        status: 'DRAFT' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const workflow = await this.workflowEngine.createWorkflow(workflowDefinition);
      
      this.logger.log(`Created workflow: ${workflow.name} (${workflow.id})`);
      return workflow as Workflow;
    } catch (error) {
      this.logger.error('Failed to create workflow:', error);
      throw error;
    }
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    try {
      const workflow = await this.workflowEngine.getWorkflow(id);
      return workflow as Workflow | null;
    } catch (error) {
      this.logger.error(`Failed to get workflow ${id}:`, error);
      throw error;
    }
  }

  async getWorkflows(options?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ workflows: Workflow[]; total: number }> {
    try {
      const { page = 1, limit = 20, status, search } = options || {};
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (status) {
        where.status = status;
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [workflows, total] = await Promise.all([
        this.prisma.workflow.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
          include: {
            executions: {
              take: 1,
              orderBy: { startedAt: 'desc' }
            }
          }
        }),
        this.prisma.workflow.count({ where })
      ]);

      return {
        workflows: workflows as Workflow[],
        total
      };
    } catch (error) {
      this.logger.error('Failed to get workflows:', error);
      throw error;
    }
  }

  async executeWorkflow(workflowId: string, input: WorkflowInput = {}): Promise<WorkflowExecutionStatus> {
    try {
      this.logger.log(`Executing workflow: ${workflowId}`);
      
      const workflow = await this.workflowEngine.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Use the workflow executor for proper execution
      const execution = await this.workflowExecutor.execute(workflow, input);
      
      this.logger.log(`Started execution: ${execution.id} for workflow: ${workflowId}`);
      
      return {
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status as any,
        input: execution.input,
        output: execution.output,
        error: execution.error,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        createdAt: execution.createdAt || execution.startedAt,
        updatedAt: execution.updatedAt || execution.startedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to execute workflow ${workflowId}:`, error);
      throw error;
    }
  }

  async getExecutionStatus(executionId: string): Promise<WorkflowExecutionStatus | null> {
    try {
      const execution = await this.prisma.workflowExecution.findUnique({ 
        where: { id: executionId },
        include: {
          workflow: {
            select: { id: true, name: true }
          },
          logs: {
            orderBy: { timestamp: 'asc' }
          }
        }
      });
      
      if (!execution) {
        return null;
      }

      return {
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status as any,
        input: execution.input as any,
        output: execution.output as any,
        error: execution.error || undefined,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt || undefined,
        createdAt: execution.createdAt,
        updatedAt: execution.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to get execution status ${executionId}:`, error);
      throw error;
    }
  }

  async getExecutions(workflowId?: string, options?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ executions: WorkflowExecutionStatus[]; total: number }> {
    try {
      const { page = 1, limit = 20, status } = options || {};
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (workflowId) {
        where.workflowId = workflowId;
      }
      
      if (status) {
        where.status = status;
      }

      const [executions, total] = await Promise.all([
        this.prisma.workflowExecution.findMany({
          where,
          skip,
          take: limit,
          orderBy: { startedAt: 'desc' },
          include: {
            workflow: {
              select: { id: true, name: true }
            }
          }
        }),
        this.prisma.workflowExecution.count({ where })
      ]);

      const formattedExecutions = executions.map(execution => ({
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status as any,
        input: execution.input as any,
        output: execution.output as any,
        error: execution.error || undefined,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt || undefined,
        createdAt: execution.createdAt,
        updatedAt: execution.updatedAt,
      }));

      return {
        executions: formattedExecutions,
        total
      };
    } catch (error) {
      this.logger.error('Failed to get executions:', error);
      throw error;
    }
  }

  async updateWorkflow(id: string, data: Partial<CreateWorkflowDto>): Promise<Workflow | null> {
    try {
      this.logger.log(`Updating workflow: ${id}`);
      
      const workflow = await this.workflowEngine.updateWorkflow(id, data as any);
      
      if (!workflow) {
        return null;
      }

      this.logger.log(`Updated workflow: ${workflow.name} (${workflow.id})`);
      return workflow as Workflow;
    } catch (error) {
      this.logger.error(`Failed to update workflow ${id}:`, error);
      throw error;
    }
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    try {
      this.logger.log(`Deleting workflow: ${id}`);
      
      const success = await this.workflowEngine.deleteWorkflow(id);
      
      if (success) {
        this.logger.log(`Deleted workflow: ${id}`);
      }
      
      return success;
    } catch (error) {
      this.logger.error(`Failed to delete workflow ${id}:`, error);
      throw error;
    }
  }

  async cancelExecution(executionId: string): Promise<WorkflowExecutionStatus | null> {
    try {
      this.logger.log(`Cancelling execution: ${executionId}`);
      
      const execution = await this.workflowExecutor.cancel(executionId);
      
      if (!execution) {
        return null;
      }

      this.logger.log(`Cancelled execution: ${executionId}`);
      
      return {
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status as any,
        input: execution.input,
        output: execution.output,
        error: execution.error,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        createdAt: execution.createdAt || execution.startedAt,
        updatedAt: execution.updatedAt || execution.startedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to cancel execution ${executionId}:`, error);
      throw error;
    }
  }

  async pauseExecution(executionId: string): Promise<WorkflowExecutionStatus | null> {
    try {
      this.logger.log(`Pausing execution: ${executionId}`);
      
      const execution = await this.workflowExecutor.pause(executionId);
      
      if (!execution) {
        return null;
      }

      this.logger.log(`Paused execution: ${executionId}`);
      
      return {
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status as any,
        input: execution.input,
        output: execution.output,
        error: execution.error,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        createdAt: execution.createdAt || execution.startedAt,
        updatedAt: execution.updatedAt || execution.startedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to pause execution ${executionId}:`, error);
      throw error;
    }
  }

  async resumeExecution(executionId: string): Promise<WorkflowExecutionStatus | null> {
    try {
      this.logger.log(`Resuming execution: ${executionId}`);
      
      const execution = await this.workflowExecutor.resume(executionId);
      
      if (!execution) {
        return null;
      }

      this.logger.log(`Resumed execution: ${executionId}`);
      
      return {
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status as any,
        input: execution.input,
        output: execution.output,
        error: execution.error,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        createdAt: execution.createdAt || execution.startedAt,
        updatedAt: execution.updatedAt || execution.startedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to resume execution ${executionId}:`, error);
      throw error;
    }
  }

  async validateWorkflow(workflow: any): Promise<{ valid: boolean; errors: string[] }> {
    try {
      // This would use the workflow validator from the engine
      // For now, return a simple validation
      const errors: string[] = [];
      
      if (!workflow.name || workflow.name.trim() === '') {
        errors.push('Workflow name is required');
      }
      
      if (!workflow.steps || workflow.steps.length === 0) {
        errors.push('Workflow must have at least one step');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      this.logger.error('Failed to validate workflow:', error);
      throw error;
    }
  }
}
