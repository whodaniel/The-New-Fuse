import { prisma } from './prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';

/**
 * WorkflowManager handles database operations for workflows and workflow executions
 */
export class WorkflowManager {
  /**
   * Create a new workflow
   * @param name Workflow name
   * @param description Workflow description
   * @param steps Workflow steps definition
   * @param createdBy Agent ID that created the workflow
   * @returns The created workflow
   */
  async createWorkflow(
    name: string,
    description: string,
    steps: any[],
    createdBy: string
  ): Promise<any> {
    try {
      const workflow = await prisma.workflow.create({
        data: {
          name,
          description,
          steps,
          createdBy
        }
      });
      
      logger.info(`Created workflow: ${name} (${workflow.id})`);
      return workflow;
    } catch (error) {
      logger.error(`Error creating workflow: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get workflow by ID
   * @param workflowId The workflow ID
   * @returns Workflow details
   */
  async getWorkflowById(workflowId: string): Promise<any> {
    try {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId }
      });
      
      if (!workflow) {
        throw new Error(`Workflow with ID ${workflowId} not found`);
      }
      
      return workflow;
    } catch (error) {
      logger.error(`Error getting workflow: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update an existing workflow
   * @param workflowId Workflow ID to update
   * @param name New workflow name
   * @param description New workflow description
   * @param steps New workflow steps
   * @returns The updated workflow
   */
  async updateWorkflow(
    workflowId: string,
    name?: string,
    description?: string,
    steps?: any[]
  ): Promise<any> {
    try {
      const data: any = {};
      if (name !== undefined) data.name = name;
      if (description !== undefined) data.description = description;
      if (steps !== undefined) data.steps = steps;
      data.updatedAt = new Date();
      
      const workflow = await prisma.workflow.update({
        where: { id: workflowId },
        data
      });
      
      logger.info(`Updated workflow: ${workflow.id}`);
      return workflow;
    } catch (error) {
      logger.error(`Error updating workflow: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * List all workflows, optionally filtered by creator
   * @param createdBy Optional agent ID that created the workflows
   * @returns Array of workflows
   */
  async listWorkflows(createdBy?: string): Promise<any[]> {
    try {
      const filter: any = {};
      
      if (createdBy) {
        filter.createdBy = createdBy;
      }
      
      const workflows = await prisma.workflow.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' }
      });
      
      logger.info(`Retrieved ${workflows.length} workflows`);
      return workflows;
    } catch (error) {
      logger.error(`Error listing workflows: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete a workflow
   * @param workflowId The workflow ID to delete
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      await prisma.workflow.delete({
        where: { id: workflowId }
      });
      
      logger.info(`Deleted workflow ${workflowId}`);
    } catch (error) {
      logger.error(`Error deleting workflow: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Start a workflow execution
   * @param workflowId Workflow ID to execute
   * @param initiatedBy Agent ID that started the execution
   * @param inputs Initial inputs for the workflow
   * @returns The workflow execution record
   */
  async startExecution(
    workflowId: string,
    initiatedBy: string,
    inputs: any = {}
  ): Promise<any> {
    try {
      // Retrieve the workflow
      const workflow = await this.getWorkflowById(workflowId);
      
      // Create the execution record
      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId,
          initiatedBy,
          inputs,
          status: 'in_progress',
          currentStepIndex: 0
        },
        include: {
          workflow: true
        }
      });
      
      logger.info(`Started workflow execution: ${execution.id}`);
      return execution;
    } catch (error) {
      logger.error(`Error starting workflow execution: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update workflow execution status
   * @param executionId Execution ID to update
   * @param status New status
   * @param currentStepIndex Current step index
   * @param outputs Optional outputs from the workflow
   * @param error Optional error message
   */
  async updateExecutionStatus(
    executionId: string,
    status: 'in_progress' | 'completed' | 'failed' | 'paused',
    currentStepIndex?: number,
    outputs?: any,
    error?: string
  ): Promise<any> {
    try {
      const data: any = { status };
      
      if (currentStepIndex !== undefined) {
        data.currentStepIndex = currentStepIndex;
      }
      
      if (outputs) {
        data.outputs = outputs;
      }
      
      if (error) {
        data.error = error;
      }
      
      if (status === 'completed' || status === 'failed') {
        data.endTime = new Date();
      }
      
      const execution = await prisma.workflowExecution.update({
        where: { id: executionId },
        data,
        include: {
          workflow: true
        }
      });
      
      logger.info(`Updated workflow execution status: ${executionId} -> ${status}`);
      return execution;
    } catch (error) {
      logger.error(`Error updating workflow execution: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get workflow execution by ID
   * @param executionId The execution ID
   * @returns Execution details
   */
  async getExecutionById(executionId: string): Promise<any> {
    try {
      const execution = await prisma.workflowExecution.findUnique({
        where: { id: executionId },
        include: {
          workflow: true
        }
      });
      
      if (!execution) {
        throw new Error(`Workflow execution with ID ${executionId} not found`);
      }
      
      return execution;
    } catch (error) {
      logger.error(`Error getting workflow execution: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * List executions for a workflow
   * @param workflowId Workflow ID
   * @param limit Maximum number of executions to return
   * @returns Array of executions
   */
  async listExecutions(workflowId: string, limit = 10): Promise<any[]> {
    try {
      const executions = await prisma.workflowExecution.findMany({
        where: { workflowId },
        include: {
          workflow: true
        },
        orderBy: { startTime: 'desc' },
        take: limit
      });
      
      logger.info(`Retrieved ${executions.length} executions for workflow ${workflowId}`);
      return executions;
    } catch (error) {
      logger.error(`Error listing workflow executions: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Record a step execution
   * @param executionId Execution ID
   * @param stepIndex Step index in the workflow
   * @param stepId Step identifier
   * @param inputs Inputs to the step
   * @param outputs Outputs from the step
   * @param error Optional error message
   */
  async recordStepExecution(
    executionId: string,
    stepIndex: number,
    stepId: string,
    inputs: any,
    outputs?: any,
    error?: string
  ): Promise<any> {
    try {
      const step = await prisma.workflowStepExecution.create({
        data: {
          executionId,
          stepIndex,
          stepId,
          inputs,
          outputs,
          error,
          endTime: new Date(),
          status: error ? 'failed' : 'completed'
        }
      });
      
      logger.info(`Recorded step execution: ${step.id} (Workflow: ${executionId}, Step: ${stepIndex})`);
      return step;
    } catch (error) {
      logger.error(`Error recording step execution: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get step executions for a workflow execution
   * @param executionId Execution ID
   * @returns Array of step executions
   */
  async getStepExecutions(executionId: string): Promise<any[]> {
    try {
      const steps = await prisma.workflowStepExecution.findMany({
        where: { executionId },
        orderBy: { stepIndex: 'asc' }
      });
      
      logger.info(`Retrieved ${steps.length} step executions for workflow ${executionId}`);
      return steps;
    } catch (error) {
      logger.error(`Error getting step executions: ${error.message}`);
      throw error;
    }
  }
}