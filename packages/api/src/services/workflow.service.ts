/**
 * Workflow Service - Drizzle ORM Implementation
 * 
 * This service provides business logic for Workflow operations.
 * It uses the Drizzle-based WorkflowRepository for data access.
 */

import { Injectable, Logger } from '@nestjs/common';
import { 
  WorkflowRepository, 
  WorkflowExecutionRepository,
  type Workflow,
  type NewWorkflow,
  type WorkflowExecution,
  type NewWorkflowExecution,
} from '../repositories/workflow.repository';
import { toError } from '../utils/error';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly executionRepository: WorkflowExecutionRepository
  ) {}

  /**
   * Handle errors consistently
   */
  private handleError(error: unknown, operation: string): never {
    const err = toError(error);
    this.logger.error(`Error in ${operation}: ${err.message}`, err.stack);
    throw err;
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(data: Partial<NewWorkflow>, userId: string): Promise<Workflow> {
    try {
      // Check for existing workflow with same name
      const existingWorkflow = await this.workflowRepository.findOne({
        name: data.name,
        creatorId: userId,
      });

      if (existingWorkflow) {
        throw new Error(`Workflow with name "${data.name}" already exists`);
      }

      const workflowData: NewWorkflow = {
        name: data.name || 'Untitled Workflow',
        description: data.description,
        definition: data.definition,
        status: data.status,
        creatorId: userId,
        agentId: data.agentId,
        metadata: data.metadata,
        isActive: data.isActive,
        variables: data.variables,
        triggers: data.triggers,
      };

      const workflow = await this.workflowRepository.create(workflowData);
      this.logger.log(`Created workflow: ${workflow.id} (${workflow.name})`);
      return workflow;
    } catch (error) {
      return this.handleError(error, 'createWorkflow');
    }
  }

  /**
   * Get all workflows for a user
   */
  async getWorkflows(userId: string): Promise<Workflow[]> {
    try {
      return await this.workflowRepository.findByUserId(userId);
    } catch (error) {
      return this.handleError(error, 'getWorkflows');
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(id: string, userId: string): Promise<Workflow> {
    try {
      const workflow = await this.workflowRepository.findOne({ id, creatorId: userId });
      if (!workflow) {
        throw new Error(`Workflow with ID ${id} not found`);
      }
      return workflow;
    } catch (error) {
      return this.handleError(error, `getWorkflowById(${id})`);
    }
  }

  /**
   * Update a workflow
   */
  async updateWorkflow(id: string, updates: Partial<NewWorkflow>, userId: string): Promise<Workflow> {
    try {
      // Verify ownership
      await this.getWorkflowById(id, userId);

      const workflow = await this.workflowRepository.update(id, updates);
      if (!workflow) {
        throw new Error(`Failed to update workflow ${id}`);
      }

      this.logger.log(`Updated workflow: ${id}`);
      return workflow;
    } catch (error) {
      return this.handleError(error, `updateWorkflow(${id})`);
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      await this.getWorkflowById(id, userId);

      await this.workflowRepository.delete(id);
      this.logger.log(`Deleted workflow: ${id}`);
    } catch (error) {
      this.handleError(error, `deleteWorkflow(${id})`);
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    id: string,
    userId: string,
    inputs: Record<string, any> = {}
  ): Promise<WorkflowExecution> {
    try {
      // Verify ownership
      const workflow = await this.getWorkflowById(id, userId);

      // Create execution record
      const executionData: NewWorkflowExecution = {
        workflowId: workflow.id,
        status: 'RUNNING',
        input: inputs,
      };

      const execution = await this.executionRepository.create(executionData);
      this.logger.log(`Started workflow execution: ${execution.id} for workflow ${id}`);

      // TODO: Implement actual workflow execution logic
      this.logger.warn(`Executing mock workflow for execution ID: ${execution.id}`);

      // Update execution to simulate completion
      const completedExecution = await this.executionRepository.update(execution.id, {
        status: 'COMPLETED',
        output: { result: 'Mock workflow executed successfully' },
        completedAt: new Date(),
      });

      if (!completedExecution) {
        throw new Error(`Failed to complete execution ${execution.id}`);
      }

      this.logger.log(`Completed workflow execution: ${execution.id}`);
      return completedExecution;
    } catch (error) {
      return this.handleError(error, `executeWorkflow(${id})`);
    }
  }

  /**
   * Get workflow executions
   */
  async getWorkflowExecutions(workflowId: string, userId: string): Promise<WorkflowExecution[]> {
    try {
      // Verify ownership
      await this.getWorkflowById(workflowId, userId);

      return await this.executionRepository.findByWorkflowId(workflowId);
    } catch (error) {
      return this.handleError(error, `getWorkflowExecutions(${workflowId})`);
    }
  }

  /**
   * Get workflow execution by ID
   */
  async getExecutionById(id: string, userId: string): Promise<WorkflowExecution> {
    try {
      const execution = await this.executionRepository.findById(id);

      if (!execution) {
        throw new Error(`Workflow execution with ID ${id} not found`);
      }

      // Verify ownership via workflow
      await this.getWorkflowById(execution.workflowId, userId);

      return execution;
    } catch (error) {
      return this.handleError(error, `getExecutionById(${id})`);
    }
  }
}