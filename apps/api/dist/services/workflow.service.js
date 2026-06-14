"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WorkflowService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = void 0;
/**
 * WorkflowService - Migrated to Drizzle ORM
 * Handles workflow CRUD and execution operations
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
let WorkflowService = WorkflowService_1 = class WorkflowService {
    constructor(db, workflowEngine, workflowExecutor) {
        this.db = db;
        this.workflowEngine = workflowEngine;
        this.workflowExecutor = workflowExecutor;
        this.logger = new common_1.Logger(WorkflowService_1.name);
    }
    async createWorkflow(data) {
        try {
            this.logger.log(`Creating workflow: ${data.name}`);
            // Use the workflow engine for validation and creation
            const workflowDefinition = {
                ...data,
                id: undefined,
                version: 1,
                status: 'DRAFT',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const workflow = await this.workflowEngine.createWorkflow(workflowDefinition);
            this.logger.log(`Created workflow: ${workflow.name} (${workflow.id})`);
            return workflow;
        }
        catch (error) {
            this.logger.error('Failed to create workflow:', error);
            throw error;
        }
    }
    async getWorkflow(id) {
        try {
            const workflow = await this.workflowEngine.getWorkflow(id);
            return workflow;
        }
        catch (error) {
            this.logger.error(`Failed to get workflow ${id}:`, error);
            throw error;
        }
    }
    async getWorkflows(creatorId, options) {
        try {
            const { page = 1, limit = 20 } = options || {};
            // Get workflows using Drizzle repository
            const workflows = await this.db.workflows.findActiveWorkflows(creatorId);
            // Apply pagination manually
            const start = (page - 1) * limit;
            const paginatedWorkflows = workflows.slice(start, start + limit);
            // Map to Workflow interface
            const mappedWorkflows = paginatedWorkflows.map((workflow) => ({
                id: workflow.id,
                name: workflow.name,
                description: workflow.description || undefined,
                status: workflow.status,
                steps: [],
                createdAt: workflow.createdAt,
                updatedAt: workflow.updatedAt,
                creator: workflow.creatorId || undefined,
            }));
            return {
                workflows: mappedWorkflows,
                total: workflows.length,
            };
        }
        catch (error) {
            this.logger.error('Failed to get workflows:', error);
            throw error;
        }
    }
    async executeWorkflow(workflowId, input = {}) {
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
                status: execution.status,
                input: execution.input,
                output: execution.output,
                error: execution.error,
                startedAt: execution.startedAt,
                completedAt: execution.completedAt,
                createdAt: execution.createdAt || execution.startedAt,
                updatedAt: execution.updatedAt || execution.startedAt,
            };
        }
        catch (error) {
            this.logger.error(`Failed to execute workflow ${workflowId}:`, error);
            throw error;
        }
    }
    async getExecutionStatus(executionId) {
        try {
            const execution = await this.db.workflows.findExecutionById(executionId);
            if (!execution) {
                return null;
            }
            return {
                id: execution.id,
                workflowId: execution.workflowId,
                status: execution.status,
                input: execution.input,
                output: execution.output,
                error: execution.error || undefined,
                startedAt: execution.startedAt,
                completedAt: execution.completedAt || undefined,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get execution status ${executionId}:`, error);
            throw error;
        }
    }
    async getExecutions(workflowId, options) {
        try {
            const { page = 1, limit = 20, status } = options || {};
            let executions;
            if (workflowId) {
                executions = await this.db.workflows.findExecutionsByWorkflowId(workflowId);
            }
            else {
                // Get all executions
                executions = [];
            }
            // Filter by status if provided
            if (status) {
                executions = executions.filter((e) => e.status === status);
            }
            // Apply pagination
            const start = (page - 1) * limit;
            const paginatedExecutions = executions.slice(start, start + limit);
            const formattedExecutions = paginatedExecutions.map((execution) => ({
                id: execution.id,
                workflowId: execution.workflowId,
                status: execution.status,
                input: execution.input,
                output: execution.output,
                error: execution.error || undefined,
                startedAt: execution.startedAt,
                completedAt: execution.completedAt || undefined,
            }));
            return {
                executions: formattedExecutions,
                total: executions.length,
            };
        }
        catch (error) {
            this.logger.error('Failed to get executions:', error);
            throw error;
        }
    }
    async updateWorkflow(id, data) {
        try {
            this.logger.log(`Updating workflow: ${id}`);
            const workflow = await this.workflowEngine.updateWorkflow(id, data);
            if (!workflow) {
                return null;
            }
            this.logger.log(`Updated workflow: ${workflow.name} (${workflow.id})`);
            return workflow;
        }
        catch (error) {
            this.logger.error(`Failed to update workflow ${id}:`, error);
            throw error;
        }
    }
    async deleteWorkflow(id) {
        try {
            this.logger.log(`Deleting workflow: ${id}`);
            const success = await this.workflowEngine.deleteWorkflow(id);
            if (success) {
                this.logger.log(`Deleted workflow: ${id}`);
            }
            return success;
        }
        catch (error) {
            this.logger.error(`Failed to delete workflow ${id}:`, error);
            throw error;
        }
    }
    async cancelExecution(executionId) {
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
                status: execution.status,
                input: execution.input,
                output: execution.output,
                error: execution.error,
                startedAt: execution.startedAt,
                completedAt: execution.completedAt,
                createdAt: execution.createdAt || execution.startedAt,
                updatedAt: execution.updatedAt || execution.startedAt,
            };
        }
        catch (error) {
            this.logger.error(`Failed to cancel execution ${executionId}:`, error);
            throw error;
        }
    }
    async pauseExecution(executionId) {
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
                status: execution.status,
                input: execution.input,
                output: execution.output,
                error: execution.error,
                startedAt: execution.startedAt,
                completedAt: execution.completedAt,
                createdAt: execution.createdAt || execution.startedAt,
                updatedAt: execution.updatedAt || execution.startedAt,
            };
        }
        catch (error) {
            this.logger.error(`Failed to pause execution ${executionId}:`, error);
            throw error;
        }
    }
    async resumeExecution(executionId) {
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
                status: execution.status,
                input: execution.input,
                output: execution.output,
                error: execution.error,
                startedAt: execution.startedAt,
                completedAt: execution.completedAt,
                createdAt: execution.createdAt || execution.startedAt,
                updatedAt: execution.updatedAt || execution.startedAt,
            };
        }
        catch (error) {
            this.logger.error(`Failed to resume execution ${executionId}:`, error);
            throw error;
        }
    }
    async validateWorkflow(workflow) {
        try {
            const errors = [];
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
        }
        catch (error) {
            this.logger.error('Failed to validate workflow:', error);
            throw error;
        }
    }
};
exports.WorkflowService = WorkflowService;
exports.WorkflowService = WorkflowService = WorkflowService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('WorkflowEngine')),
    __param(2, (0, common_1.Inject)('WorkflowExecutor')),
    __metadata("design:paramtypes", [database_1.DatabaseService, Object, Object])
], WorkflowService);
//# sourceMappingURL=workflow.service.js.map