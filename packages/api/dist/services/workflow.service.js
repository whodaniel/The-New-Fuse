/**
 * Workflow Service - Drizzle ORM Implementation
 *
 * This service provides business logic for Workflow operations.
 * It uses the Drizzle-based WorkflowRepository for data access.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WorkflowService_1;
var _a, _b;
import { Injectable, Logger } from '@nestjs/common';
import { WorkflowRepository, WorkflowExecutionRepository, } from '../repositories/workflow.repository';
import { toError } from '../utils/error.js';
let WorkflowService = WorkflowService_1 = class WorkflowService {
    constructor(workflowRepository, executionRepository) {
        this.workflowRepository = workflowRepository;
        this.executionRepository = executionRepository;
        this.logger = new Logger(WorkflowService_1.name);
    }
    /**
     * Handle errors consistently
     */
    handleError(error, operation) {
        const err = toError(error);
        this.logger.error(`Error in ${operation}: ${err.message}`, err.stack);
        throw err;
    }
    /**
     * Create a new workflow
     */
    async createWorkflow(data, userId) {
        try {
            // Check for existing workflow with same name
            const existingWorkflow = await this.workflowRepository.findOne({
                name: data.name,
                creatorId: userId,
            });
            if (existingWorkflow) {
                throw new Error(`Workflow with name "${data.name}" already exists`);
            }
            const workflowData = {
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
        }
        catch (error) {
            return this.handleError(error, 'createWorkflow');
        }
    }
    /**
     * Get all workflows for a user
     */
    async getWorkflows(userId) {
        try {
            return await this.workflowRepository.findByUserId(userId);
        }
        catch (error) {
            return this.handleError(error, 'getWorkflows');
        }
    }
    /**
     * Get workflow by ID
     */
    async getWorkflowById(id, userId) {
        try {
            const workflow = await this.workflowRepository.findOne({ id, creatorId: userId });
            if (!workflow) {
                throw new Error(`Workflow with ID ${id} not found`);
            }
            return workflow;
        }
        catch (error) {
            return this.handleError(error, `getWorkflowById(${id})`);
        }
    }
    /**
     * Update a workflow
     */
    async updateWorkflow(id, updates, userId) {
        try {
            // Verify ownership
            await this.getWorkflowById(id, userId);
            const workflow = await this.workflowRepository.update(id, updates);
            if (!workflow) {
                throw new Error(`Failed to update workflow ${id}`);
            }
            this.logger.log(`Updated workflow: ${id}`);
            return workflow;
        }
        catch (error) {
            return this.handleError(error, `updateWorkflow(${id})`);
        }
    }
    /**
     * Delete a workflow
     */
    async deleteWorkflow(id, userId) {
        try {
            // Verify ownership
            await this.getWorkflowById(id, userId);
            await this.workflowRepository.delete(id);
            this.logger.log(`Deleted workflow: ${id}`);
        }
        catch (error) {
            this.handleError(error, `deleteWorkflow(${id})`);
        }
    }
    /**
     * Execute a workflow
     */
    async executeWorkflow(id, userId, inputs = {}) {
        try {
            // Verify ownership
            const workflow = await this.getWorkflowById(id, userId);
            // Create execution record
            const executionData = {
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
        }
        catch (error) {
            return this.handleError(error, `executeWorkflow(${id})`);
        }
    }
    /**
     * Get workflow executions
     */
    async getWorkflowExecutions(workflowId, userId) {
        try {
            // Verify ownership
            await this.getWorkflowById(workflowId, userId);
            return await this.executionRepository.findByWorkflowId(workflowId);
        }
        catch (error) {
            return this.handleError(error, `getWorkflowExecutions(${workflowId})`);
        }
    }
    /**
     * Get workflow execution by ID
     */
    async getExecutionById(id, userId) {
        try {
            const execution = await this.executionRepository.findById(id);
            if (!execution) {
                throw new Error(`Workflow execution with ID ${id} not found`);
            }
            // Verify ownership via workflow
            await this.getWorkflowById(execution.workflowId, userId);
            return execution;
        }
        catch (error) {
            return this.handleError(error, `getExecutionById(${id})`);
        }
    }
};
WorkflowService = WorkflowService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof WorkflowRepository !== "undefined" && WorkflowRepository) === "function" ? _a : Object, typeof (_b = typeof WorkflowExecutionRepository !== "undefined" && WorkflowExecutionRepository) === "function" ? _b : Object])
], WorkflowService);
export { WorkflowService };
//# sourceMappingURL=workflow.service.js.map