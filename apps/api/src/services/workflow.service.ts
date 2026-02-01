/**
 * WorkflowService - Migrated to Drizzle ORM
 * Handles workflow CRUD and execution operations
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { CreateWorkflowDto, Workflow, WorkflowExecution, WorkflowInput } from '@the-new-fuse/types';
import { WorkflowEngine, WorkflowExecutor } from '../types/core';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private readonly db: DatabaseService,
    @Inject('WorkflowEngine') private readonly workflowEngine: WorkflowEngine,
    @Inject('WorkflowExecutor') private readonly workflowExecutor: WorkflowExecutor
  ) {}

  async createWorkflow(data: CreateWorkflowDto): Promise<Workflow> {
    try {
      this.logger.log(`Creating workflow: ${data.name}`);

      // Use the workflow engine for validation and creation
      const workflowDefinition = {
        ...data,
        id: undefined,
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
      const { page = 1, limit = 20 } = options || {};

      // Get workflows using Drizzle repository (system-level access for admin)
      const workflows = await this.db.workflows.findActiveWorkflowsSystem();

      // Apply pagination manually
      const start = (page - 1) * limit;
      const paginatedWorkflows = workflows.slice(start, start + limit);

      // Map to Workflow interface
      const mappedWorkflows = paginatedWorkflows.map((workflow: any) => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description || undefined,
        status: workflow.status as any,
        steps: [],
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        creator: workflow.creatorId || undefined,
      }));

      return {
        workflows: mappedWorkflows,
        total: workflows.length,
      };
    } catch (error) {
      this.logger.error('Failed to get workflows:', error);
      throw error;
    }
  }

  async executeWorkflow(workflowId: string, input: WorkflowInput = {}): Promise<WorkflowExecution> {
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

  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    try {
      const execution = await this.db.workflows.findExecutionById(executionId);

      if (!execution) {
        return null;
      }

      return {
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status as any,
        input: execution.input,
        output: execution.output,
        error: execution.error || undefined,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt || undefined,
      } as WorkflowExecution;
    } catch (error) {
      this.logger.error(`Failed to get execution status ${executionId}:`, error);
      throw error;
    }
  }

  async getExecutions(
    workflowId?: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
    }
  ): Promise<{ executions: WorkflowExecution[]; total: number }> {
    try {
      const { page = 1, limit = 20, status } = options || {};

      let executions: any[];

      if (workflowId) {
        executions = await this.db.workflows.findExecutionsByWorkflowId(workflowId);
      } else {
        // Get all executions
        executions = [];
      }

      // Filter by status if provided
      if (status) {
        executions = executions.filter((e: any) => e.status === status);
      }

      // Apply pagination
      const start = (page - 1) * limit;
      const paginatedExecutions = executions.slice(start, start + limit);

      const formattedExecutions = paginatedExecutions.map((execution: any) => ({
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status as any,
        input: execution.input as any,
        output: execution.output as any,
        error: execution.error || undefined,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt || undefined,
      }));

      return {
        executions: formattedExecutions,
        total: executions.length,
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

  async cancelExecution(executionId: string): Promise<WorkflowExecution | null> {
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

  async pauseExecution(executionId: string): Promise<WorkflowExecution | null> {
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

  async resumeExecution(executionId: string): Promise<WorkflowExecution | null> {
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
      const errors: string[] = [];

      if (!workflow.name || workflow.name.trim() === '') {
        errors.push('Workflow name is required');
      }

      if (!workflow.steps || workflow.steps.length === 0) {
        errors.push('Workflow must have at least one step');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      this.logger.error('Failed to validate workflow:', error);
      throw error;
    }
  }
}
