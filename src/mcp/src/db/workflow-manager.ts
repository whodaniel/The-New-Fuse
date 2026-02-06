import { db } from './db-client.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';

/**
 * WorkflowManager handles database operations for workflows and workflow executions
 */
export class WorkflowManager {
  /**
   * Create a new workflow
   */
  async createWorkflow(
    name: string,
    description: string,
    steps: any[],
    createdBy: string
  ): Promise<any> {
    try {
      const workflow = await db.workflow.create({
        data: {
          id: uuidv4(),
          name,
          description,
          steps,
          createdBy,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info(`Created workflow: ${name} (${workflow.id})`);
      return workflow;
    } catch (error: any) {
      logger.error(`Error creating workflow: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(workflowId: string): Promise<any> {
    try {
      const workflow = await db.workflow.findUnique({ where: { id: workflowId } });

      if (!workflow) {
        throw new Error(`Workflow with ID ${workflowId} not found`);
      }

      return workflow;
    } catch (error: any) {
      logger.error(`Error getting workflow: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update an existing workflow
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

      const workflow = await db.workflow.update({
        where: { id: workflowId },
        data,
      });

      logger.info(`Updated workflow: ${workflow.id}`);
      return workflow;
    } catch (error: any) {
      logger.error(`Error updating workflow: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all workflows, optionally filtered by creator
   */
  async listWorkflows(createdBy?: string): Promise<any[]> {
    try {
      const filter: any = {};

      if (createdBy) {
        filter.createdBy = createdBy;
      }

      const workflows = await db.workflow.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' },
      });

      logger.info(`Retrieved ${workflows.length} workflows`);
      return workflows;
    } catch (error: any) {
      logger.error(`Error listing workflows: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      await db.workflow.delete({ where: { id: workflowId } });
      logger.info(`Deleted workflow ${workflowId}`);
    } catch (error: any) {
      logger.error(`Error deleting workflow: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start a workflow execution
   */
  async startExecution(
    workflowId: string,
    initiatedBy: string,
    inputs: any = {}
  ): Promise<any> {
    try {
      const workflow = await this.getWorkflowById(workflowId);

      const execution = await db.workflowExecution.create({
        data: {
          id: uuidv4(),
          workflowId,
          initiatedBy,
          inputs,
          status: 'in_progress',
          currentStepIndex: 0,
          startTime: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info(`Started workflow execution: ${execution.id}`);
      return { ...execution, workflow };
    } catch (error: any) {
      logger.error(`Error starting workflow execution: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update workflow execution status
   */
  async updateExecutionStatus(
    executionId: string,
    status: 'in_progress' | 'completed' | 'failed' | 'paused',
    currentStepIndex?: number,
    outputs?: any,
    error?: string
  ): Promise<any> {
    try {
      const data: any = { status, updatedAt: new Date() };

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

      const execution = await db.workflowExecution.update({
        where: { id: executionId },
        data,
      });

      const workflow = await db.workflow.findUnique({ where: { id: execution.workflowId } });

      logger.info(`Updated workflow execution status: ${executionId} -> ${status}`);
      return { ...execution, workflow };
    } catch (error: any) {
      logger.error(`Error updating workflow execution: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get workflow execution by ID
   */
  async getExecutionById(executionId: string): Promise<any> {
    try {
      const execution = await db.workflowExecution.findUnique({ where: { id: executionId } });

      if (!execution) {
        throw new Error(`Workflow execution with ID ${executionId} not found`);
      }

      const workflow = await db.workflow.findUnique({ where: { id: execution.workflowId } });
      return { ...execution, workflow };
    } catch (error: any) {
      logger.error(`Error getting workflow execution: ${error.message}`);
      throw error;
    }
  }

  /**
   * List executions for a workflow
   */
  async listExecutions(workflowId: string, limit = 10): Promise<any[]> {
    try {
      const executions = await db.workflowExecution.findMany({
        where: { workflowId },
        orderBy: { startTime: 'desc' },
        take: limit,
      });

      const workflow = await db.workflow.findUnique({ where: { id: workflowId } });
      const enriched = executions.map((exec) => ({ ...exec, workflow }));

      logger.info(`Retrieved ${executions.length} executions for workflow ${workflowId}`);
      return enriched;
    } catch (error: any) {
      logger.error(`Error listing workflow executions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Record a step execution
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
      const step = await db.workflowStepExecution.create({
        data: {
          id: uuidv4(),
          executionId,
          stepIndex,
          stepId,
          inputs,
          outputs,
          error,
          endTime: new Date(),
          status: error ? 'failed' : 'completed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info(
        `Recorded step execution: ${step.id} (Workflow: ${executionId}, Step: ${stepIndex})`
      );
      return step;
    } catch (error: any) {
      logger.error(`Error recording step execution: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get step executions for a workflow execution
   */
  async getStepExecutions(executionId: string): Promise<any[]> {
    try {
      const steps = await db.workflowStepExecution.findMany({
        where: { executionId },
        orderBy: { stepIndex: 'asc' },
      });

      logger.info(`Retrieved ${steps.length} step executions for workflow ${executionId}`);
      return steps;
    } catch (error: any) {
      logger.error(`Error getting step executions: ${error.message}`);
      throw error;
    }
  }
}
