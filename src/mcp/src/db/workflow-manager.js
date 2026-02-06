"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowManager = void 0;
const db_client_1 = require("./db-client");
const uuid_1 = require("uuid");
const logger_1 = require("./logger");

/**
 * WorkflowManager handles database operations for workflows and workflow executions
 */
class WorkflowManager {
  async createWorkflow(name, description, steps, createdBy) {
    try {
      const workflow = await db_client_1.db.workflow.create({
        data: {
          id: (0, uuid_1.v4)(),
          name,
          description,
          steps,
          createdBy,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      logger_1.logger.info(`Created workflow: ${name} (${workflow.id})`);
      return workflow;
    } catch (error) {
      logger_1.logger.error(`Error creating workflow: ${error.message}`);
      throw error;
    }
  }

  async getWorkflowById(workflowId) {
    try {
      const workflow = await db_client_1.db.workflow.findUnique({ where: { id: workflowId } });
      if (!workflow) {
        throw new Error(`Workflow with ID ${workflowId} not found`);
      }
      return workflow;
    } catch (error) {
      logger_1.logger.error(`Error getting workflow: ${error.message}`);
      throw error;
    }
  }

  async updateWorkflow(workflowId, name, description, steps) {
    try {
      const data = {};
      if (name !== undefined) data.name = name;
      if (description !== undefined) data.description = description;
      if (steps !== undefined) data.steps = steps;
      data.updatedAt = new Date();
      const workflow = await db_client_1.db.workflow.update({
        where: { id: workflowId },
        data,
      });
      logger_1.logger.info(`Updated workflow: ${workflow.id}`);
      return workflow;
    } catch (error) {
      logger_1.logger.error(`Error updating workflow: ${error.message}`);
      throw error;
    }
  }

  async listWorkflows(createdBy) {
    try {
      const filter = {};
      if (createdBy) {
        filter.createdBy = createdBy;
      }
      const workflows = await db_client_1.db.workflow.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' },
      });
      logger_1.logger.info(`Retrieved ${workflows.length} workflows`);
      return workflows;
    } catch (error) {
      logger_1.logger.error(`Error listing workflows: ${error.message}`);
      throw error;
    }
  }

  async deleteWorkflow(workflowId) {
    try {
      await db_client_1.db.workflow.delete({ where: { id: workflowId } });
      logger_1.logger.info(`Deleted workflow ${workflowId}`);
    } catch (error) {
      logger_1.logger.error(`Error deleting workflow: ${error.message}`);
      throw error;
    }
  }

  async startExecution(workflowId, initiatedBy, inputs = {}) {
    try {
      const workflow = await this.getWorkflowById(workflowId);
      const execution = await db_client_1.db.workflowExecution.create({
        data: {
          id: (0, uuid_1.v4)(),
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
      logger_1.logger.info(`Started workflow execution: ${execution.id}`);
      return { ...execution, workflow };
    } catch (error) {
      logger_1.logger.error(`Error starting workflow execution: ${error.message}`);
      throw error;
    }
  }

  async updateExecutionStatus(executionId, status, currentStepIndex, outputs, error) {
    try {
      const data = { status, updatedAt: new Date() };
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
      const execution = await db_client_1.db.workflowExecution.update({
        where: { id: executionId },
        data,
      });
      const workflow = await db_client_1.db.workflow.findUnique({ where: { id: execution.workflowId } });
      logger_1.logger.info(`Updated workflow execution status: ${executionId} -> ${status}`);
      return { ...execution, workflow };
    } catch (error) {
      logger_1.logger.error(`Error updating workflow execution: ${error.message}`);
      throw error;
    }
  }

  async getExecutionById(executionId) {
    try {
      const execution = await db_client_1.db.workflowExecution.findUnique({ where: { id: executionId } });
      if (!execution) {
        throw new Error(`Workflow execution with ID ${executionId} not found`);
      }
      const workflow = await db_client_1.db.workflow.findUnique({ where: { id: execution.workflowId } });
      return { ...execution, workflow };
    } catch (error) {
      logger_1.logger.error(`Error getting workflow execution: ${error.message}`);
      throw error;
    }
  }

  async listExecutions(workflowId, limit = 10) {
    try {
      const executions = await db_client_1.db.workflowExecution.findMany({
        where: { workflowId },
        orderBy: { startTime: 'desc' },
        take: limit,
      });
      const workflow = await db_client_1.db.workflow.findUnique({ where: { id: workflowId } });
      const enriched = executions.map((exec) => ({ ...exec, workflow }));
      logger_1.logger.info(`Retrieved ${executions.length} executions for workflow ${workflowId}`);
      return enriched;
    } catch (error) {
      logger_1.logger.error(`Error listing workflow executions: ${error.message}`);
      throw error;
    }
  }

  async recordStepExecution(executionId, stepIndex, stepId, inputs, outputs, error) {
    try {
      const step = await db_client_1.db.workflowStepExecution.create({
        data: {
          id: (0, uuid_1.v4)(),
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
      logger_1.logger.info(`Recorded step execution: ${step.id} (Workflow: ${executionId}, Step: ${stepIndex})`);
      return step;
    } catch (error) {
      logger_1.logger.error(`Error recording step execution: ${error.message}`);
      throw error;
    }
  }

  async getStepExecutions(executionId) {
    try {
      const steps = await db_client_1.db.workflowStepExecution.findMany({
        where: { executionId },
        orderBy: { stepIndex: 'asc' },
      });
      logger_1.logger.info(`Retrieved ${steps.length} step executions for workflow ${executionId}`);
      return steps;
    } catch (error) {
      logger_1.logger.error(`Error getting step executions: ${error.message}`);
      throw error;
    }
  }
}
exports.WorkflowManager = WorkflowManager;
