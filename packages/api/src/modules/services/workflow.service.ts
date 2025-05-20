import { Injectable, Logger } from '@nestjs/common';
import { BaseService } from './base.service.js';
import { WorkflowRepository } from '@the-new-fuse/database/src/repositories/workflow.repository';
import { WorkflowExecutionRepository } from '@the-new-fuse/database/src/repositories/workflow-execution.repository';
import {
  Workflow,
  WorkflowExecution,
  CreateWorkflowDto,
  UpdateWorkflowDto,
  WorkflowStatus
} from '@the-new-fuse/types';
import { PrismaService } from '../../services/prisma.service.js';
import { v4 as uuidv4 } from 'uuid';
import { toError } from '../../utils/error.js'; // Import the helper

@Injectable()
export class WorkflowService extends BaseService<Workflow> {
  // Change from private to protected to match BaseService
  protected readonly logger = new Logger(WorkflowService.name);
  // Change repository visibility to protected
  protected readonly repository: WorkflowRepository;
  private readonly executionRepository: WorkflowExecutionRepository;

  constructor(protected readonly prisma: PrismaService) {
    // Initialize the repository with the prisma client
    const repository = new WorkflowRepository(prisma);
    super(repository, 'WorkflowService');
    this.repository = repository;
    this.executionRepository = new WorkflowExecutionRepository(prisma);
  }

  /**
   * Create a new workflow
   * @param data Workflow creation data
   * @param userId User ID
   * @returns Created workflow
   */
  async createWorkflow(data: CreateWorkflowDto, userId: string): Promise<Workflow> {
    try {
      // Check for existing workflow with same name
      const existingWorkflow = await this.repository.findOne({
        name: data.name,
        userId
      });

      if (existingWorkflow) {
        throw new Error(`Workflow with name "${data.name}" already exists`);
      }

      // Create the workflow
      const workflow = await this.repository.create({
        id: uuidv4(),
        name: data.name,
        description: data.description,
        steps: data.steps || [],
        status: WorkflowStatus.DRAFT,
        metadata: data.metadata || {},
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      this.logger.log(`Created workflow: ${workflow.id} (${workflow.name})`);
      return this.addRequiredProperties(workflow);
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error creating workflow: ${err.message}`, err.stack); // Use err
      throw error;
    }
  }

  /**
   * Get all workflows for a user
   * @param userId User ID
   * @returns Array of workflows
   */
  async getWorkflows(userId: string): Promise<Workflow[]> {
    try {
      const workflows = await this.repository.findAll({ userId });
      return workflows.map(workflow => this.addRequiredProperties(workflow));
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error getting workflows: ${err.message}`, err.stack); // Use err
      throw error;
    }
  }

  /**
   * Get workflow by ID
   * @param id Workflow ID
   * @param userId User ID
   * @returns Workflow or null if not found
   */
  async getWorkflowById(id: string, userId: string): Promise<Workflow> {
    try {
      const workflow = await this.repository.findOne({ id, userId });
      if (!workflow) {
        throw new Error(`Workflow with ID ${id} not found`);
      }
      return this.addRequiredProperties(workflow);
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error getting workflow by ID: ${err.message}`, err.stack); // Use err
      throw error;
    }
  }

  /**
   * Update a workflow
   * @param id Workflow ID
   * @param updates Workflow update data
   * @param userId User ID
   * @returns Updated workflow
   */
  async updateWorkflow(id: string, updates: UpdateWorkflowDto, userId: string): Promise<Workflow> {
    try {
      // Check if workflow exists and belongs to user
      await this.getWorkflowById(id, userId);

      // Update the workflow
      const workflow = await this.repository.update(id, {
        ...(updates.name && { name: updates.name }),
        ...(updates.description && { description: updates.description }),
        ...(updates.steps && { steps: updates.steps }),
        ...(updates.status && { status: updates.status }),
        ...(updates.metadata && { metadata: updates.metadata }),
        updatedAt: new Date()
      } as any);

      this.logger.log(`Updated workflow: ${id}`);
      return this.addRequiredProperties(workflow);
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error updating workflow: ${err.message}`, err.stack); // Use err
      throw error;
    }
  }

  /**
   * Delete a workflow
   * @param id Workflow ID
   * @param userId User ID
   */
  async deleteWorkflow(id: string, userId: string): Promise<void> {
    try {
      // Check if workflow exists and belongs to user
      await this.getWorkflowById(id, userId);

      // Soft delete the workflow
      await this.repository.delete(id);

      this.logger.log(`Deleted workflow: ${id}`);
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error deleting workflow: ${err.message}`, err.stack); // Use err
      throw error;
    }
  }

  /**
   * Execute a workflow
   * @param id Workflow ID
   * @param userId User ID
   * @param inputs Optional workflow inputs
   * @returns Workflow execution
   */
  async executeWorkflow(id: string, userId: string, inputs: Record<string, any> = {}): Promise<WorkflowExecution> {
    try {
      // Check if workflow exists and belongs to user
      const workflow = await this.getWorkflowById(id, userId);

      // Create execution record
      const execution = await this.executionRepository.create({
        id: uuidv4(),
        workflowId: workflow.id,
        status: 'running', // Using properly typed status
        inputs,
        outputs: {},
        progress: 0,
        startedAt: new Date(),
        userId,
        metadata: {}
      } as any);

      this.logger.log(`Started workflow execution: ${execution.id} for workflow ${id}`);

      // In a real implementation, we would trigger the actual workflow execution here,
      // potentially using a queue or background processing system
      // For this example, we'll just update the execution record with a successful completion

      // Update execution record
      const completedExecution = await this.executionRepository.update(execution.id, {
        status: 'completed', // Using properly typed status
        progress: 100,
        outputs: { result: 'Workflow executed successfully' },
        finishedAt: new Date()
      } as any);

      this.logger.log(`Completed workflow execution: ${execution.id}`);
      return this.convertExecutionStatus(completedExecution);
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error executing workflow: ${err.message}`, err.stack); // Use err
      throw error;
    }
  }

  /**
   * Get workflow executions
   * @param workflowId Workflow ID
   * @param userId User ID
   * @returns Array of workflow executions
   */
  async getWorkflowExecutions(workflowId: string, userId: string): Promise<WorkflowExecution[]> {
    try {
      // Check if workflow exists and belongs to user
      await this.getWorkflowById(workflowId, userId);

      // Get executions
      const executions = await this.executionRepository.findAll({
        workflowId,
        userId
      });
      
      // Convert status string to the proper enum value
      return executions.map(execution => this.convertExecutionStatus(execution));
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error getting workflow executions: ${err.message}`, err.stack); // Use err
      throw error;
    }
  }

  /**
   * Get workflow execution by ID
   * @param id Execution ID
   * @param userId User ID
   * @returns Workflow execution
   */
  async getExecutionById(id: string, userId: string): Promise<WorkflowExecution> {
    try {
      const execution = await this.executionRepository.findOne({
        id,
        userId
      });

      if (!execution) {
        throw new Error(`Workflow execution with ID ${id} not found`);
      }

      return this.convertExecutionStatus(execution);
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error getting workflow execution: ${err.message}`, err.stack); // Use err
      throw error;
    }
  }

  /**
   * Helper method to add required properties to workflow objects
   */
  private addRequiredProperties(workflow: any): Workflow {
    if (!workflow) return workflow;
    
    return {
      ...workflow,
      status: workflow.status || WorkflowStatus.DRAFT,
      steps: workflow.steps || []
    } as Workflow;
  }

  /**
   * Helper method to convert string status to proper WorkflowExecution status type
   */
  private convertExecutionStatus(execution: any): WorkflowExecution {
    if (!execution) return execution;
    
    // Convert string status to the expected enum value
    let typedStatus: 'running' | 'completed' | 'failed' = 'running';
    
    if (typeof execution.status === 'string') {
      const status = execution.status.toLowerCase();
      if (status === 'completed') typedStatus = 'completed';
      else if (status === 'failed') typedStatus = 'failed';
      else typedStatus = 'running';
    }
    
    return {
      ...execution,
      status: typedStatus,
      stepResults: execution.stepResults || {}
    } as WorkflowExecution;
  }
}