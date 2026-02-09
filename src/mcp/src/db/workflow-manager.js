"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowManager = void 0;
const prisma_client_1 = require("./prisma-client");
const logger_1 = require("./logger");
/**
 * WorkflowManager handles database operations for workflows and workflow executions
 */
class WorkflowManager {
    /**
     * Create a new workflow
     * @param name Workflow name
     * @param description Workflow description
     * @param steps Workflow steps definition
     * @param createdBy Agent ID that created the workflow
     * @returns The created workflow
     */
    async createWorkflow(name, description, steps, createdBy) {
        try {
            const workflow = await prisma_client_1.prisma.workflow.create({
                data: {
                    name,
                    description,
                    steps,
                    createdBy
                }
            });
            logger_1.logger.info(`Created workflow: ${name} (${workflow.id})`);
            return workflow;
        }
        catch (error) {
            logger_1.logger.error(`Error creating workflow: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get workflow by ID
     * @param workflowId The workflow ID
     * @returns Workflow details
     */
    async getWorkflowById(workflowId) {
        try {
            const workflow = await prisma_client_1.prisma.workflow.findUnique({
                where: { id: workflowId }
            });
            if (!workflow) {
                throw new Error(`Workflow with ID ${workflowId} not found`);
            }
            return workflow;
        }
        catch (error) {
            logger_1.logger.error(`Error getting workflow: ${error.message}`);
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
    async updateWorkflow(workflowId, name, description, steps) {
        try {
            const data = {};
            if (name !== undefined)
                data.name = name;
            if (description !== undefined)
                data.description = description;
            if (steps !== undefined)
                data.steps = steps;
            data.updatedAt = new Date();
            const workflow = await prisma_client_1.prisma.workflow.update({
                where: { id: workflowId },
                data
            });
            logger_1.logger.info(`Updated workflow: ${workflow.id}`);
            return workflow;
        }
        catch (error) {
            logger_1.logger.error(`Error updating workflow: ${error.message}`);
            throw error;
        }
    }
    /**
     * List all workflows, optionally filtered by creator
     * @param createdBy Optional agent ID that created the workflows
     * @returns Array of workflows
     */
    async listWorkflows(createdBy) {
        try {
            const filter = {};
            if (createdBy) {
                filter.createdBy = createdBy;
            }
            const workflows = await prisma_client_1.prisma.workflow.findMany({
                where: filter,
                orderBy: { createdAt: 'desc' }
            });
            logger_1.logger.info(`Retrieved ${workflows.length} workflows`);
            return workflows;
        }
        catch (error) {
            logger_1.logger.error(`Error listing workflows: ${error.message}`);
            throw error;
        }
    }
    /**
     * Delete a workflow
     * @param workflowId The workflow ID to delete
     */
    async deleteWorkflow(workflowId) {
        try {
            await prisma_client_1.prisma.workflow.delete({
                where: { id: workflowId }
            });
            logger_1.logger.info(`Deleted workflow ${workflowId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error deleting workflow: ${error.message}`);
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
    async startExecution(workflowId, initiatedBy, inputs = {}) {
        try {
            // Retrieve the workflow
            const workflow = await this.getWorkflowById(workflowId);
            // Create the execution record
            const execution = await prisma_client_1.prisma.workflowExecution.create({
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
            logger_1.logger.info(`Started workflow execution: ${execution.id}`);
            return execution;
        }
        catch (error) {
            logger_1.logger.error(`Error starting workflow execution: ${error.message}`);
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
    async updateExecutionStatus(executionId, status, currentStepIndex, outputs, error) {
        try {
            const data = { status };
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
            const execution = await prisma_client_1.prisma.workflowExecution.update({
                where: { id: executionId },
                data,
                include: {
                    workflow: true
                }
            });
            logger_1.logger.info(`Updated workflow execution status: ${executionId} -> ${status}`);
            return execution;
        }
        catch (error) {
            logger_1.logger.error(`Error updating workflow execution: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get workflow execution by ID
     * @param executionId The execution ID
     * @returns Execution details
     */
    async getExecutionById(executionId) {
        try {
            const execution = await prisma_client_1.prisma.workflowExecution.findUnique({
                where: { id: executionId },
                include: {
                    workflow: true
                }
            });
            if (!execution) {
                throw new Error(`Workflow execution with ID ${executionId} not found`);
            }
            return execution;
        }
        catch (error) {
            logger_1.logger.error(`Error getting workflow execution: ${error.message}`);
            throw error;
        }
    }
    /**
     * List executions for a workflow
     * @param workflowId Workflow ID
     * @param limit Maximum number of executions to return
     * @returns Array of executions
     */
    async listExecutions(workflowId, limit = 10) {
        try {
            const executions = await prisma_client_1.prisma.workflowExecution.findMany({
                where: { workflowId },
                include: {
                    workflow: true
                },
                orderBy: { startTime: 'desc' },
                take: limit
            });
            logger_1.logger.info(`Retrieved ${executions.length} executions for workflow ${workflowId}`);
            return executions;
        }
        catch (error) {
            logger_1.logger.error(`Error listing workflow executions: ${error.message}`);
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
    async recordStepExecution(executionId, stepIndex, stepId, inputs, outputs, error) {
        try {
            const step = await prisma_client_1.prisma.workflowStepExecution.create({
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
            logger_1.logger.info(`Recorded step execution: ${step.id} (Workflow: ${executionId}, Step: ${stepIndex})`);
            return step;
        }
        catch (error) {
            logger_1.logger.error(`Error recording step execution: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get step executions for a workflow execution
     * @param executionId Execution ID
     * @returns Array of step executions
     */
    async getStepExecutions(executionId) {
        try {
            const steps = await prisma_client_1.prisma.workflowStepExecution.findMany({
                where: { executionId },
                orderBy: { stepIndex: 'asc' }
            });
            logger_1.logger.info(`Retrieved ${steps.length} step executions for workflow ${executionId}`);
            return steps;
        }
        catch (error) {
            logger_1.logger.error(`Error getting step executions: ${error.message}`);
            throw error;
        }
    }
}
exports.WorkflowManager = WorkflowManager;
//# sourceMappingURL=workflow-manager.js.map