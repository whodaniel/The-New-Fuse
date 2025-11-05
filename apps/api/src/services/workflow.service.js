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
var _a, _b, _c;
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { WorkflowEngine, WorkflowExecutor } from '@the-new-fuse/core';
let WorkflowService = WorkflowService_1 = class WorkflowService {
    prisma;
    workflowEngine;
    workflowExecutor;
    logger = new Logger(WorkflowService_1.name);
    constructor(prisma, workflowEngine, workflowExecutor) {
        this.prisma = prisma;
        this.workflowEngine = workflowEngine;
        this.workflowExecutor = workflowExecutor;
    }
    async createWorkflow(data) {
        try {
            this.logger.log(`Creating workflow: ${data.name}`);
            // Use the workflow engine for validation and creation
            const workflowDefinition = {
                ...data,
                id: undefined, // Let the engine generate the ID
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
    async getWorkflows(options) {
        try {
            const { page = 1, limit = 20, status, search } = options || {};
            const skip = (page - 1) * limit;
            const where = {};
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
                workflows: workflows,
                total
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
                status: execution.status,
                input: execution.input,
                output: execution.output,
                error: execution.error || undefined,
                startedAt: execution.startedAt,
                completedAt: execution.completedAt || undefined,
                createdAt: execution.createdAt,
                updatedAt: execution.updatedAt,
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
            const skip = (page - 1) * limit;
            const where = {};
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
                status: execution.status,
                input: execution.input,
                output: execution.output,
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
            // This would use the workflow validator from the engine
            // For now, return a simple validation
            const errors = [];
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
        }
        catch (error) {
            this.logger.error('Failed to validate workflow:', error);
            throw error;
        }
    }
};
WorkflowService = WorkflowService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object, typeof (_b = typeof WorkflowEngine !== "undefined" && WorkflowEngine) === "function" ? _b : Object, typeof (_c = typeof WorkflowExecutor !== "undefined" && WorkflowExecutor) === "function" ? _c : Object])
], WorkflowService);
export { WorkflowService };
//# sourceMappingURL=workflow.service.js.map