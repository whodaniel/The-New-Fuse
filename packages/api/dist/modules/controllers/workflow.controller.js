/**
 * Workflow controller implementation
 * Provides standardized REST API endpoints for workflow operations
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WorkflowController_1;
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { WorkflowService } from '../../services/workflow.service.js';
import { BaseController } from './base.controller.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { CreateWorkflowDto } from './dto/create-workflow.dto.js';
import { UpdateWorkflowDto } from './dto/update-workflow.dto.js';
import { WorkflowDto, WorkflowExecutionDto } from './dto/workflow.dto.js'; // Updated import path
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiParam, ApiBody } from '@nestjs/swagger';
let WorkflowController = WorkflowController_1 = class WorkflowController extends BaseController {
    constructor(workflowService) {
        super(WorkflowController_1.name);
        this.workflowService = workflowService;
    }
    /**
     * Get all workflows for the current user
     * @param user Current user
     * @returns Array of workflows
     */
    async getWorkflows(user) {
        return this.handleAsync(() => this.workflowService.getWorkflows(user.id), 'Failed to get workflows');
    }
    /**
     * Get workflow by ID
     * @param id Workflow ID
     * @param user Current user
     * @returns Workflow
     */
    async getWorkflow(id, user) {
        return this.handleAsync(() => this.workflowService.getWorkflowById(id, user.id), 'Failed to get workflow');
    }
    /**
     * Create a new workflow
     * @param data Workflow creation data
     * @param user Current user
     * @returns Created workflow
     */
    async createWorkflow(data, user) {
        return this.handleAsync(() => this.workflowService.createWorkflow(data, user.id), 'Failed to create workflow');
    }
    /**
     * Update a workflow
     * @param id Workflow ID
     * @param updates Workflow update data
     * @param user Current user
     * @returns Updated workflow
     */
    async updateWorkflow(id, updates, user) {
        return this.handleAsync(() => this.workflowService.updateWorkflow(id, updates, user.id), 'Failed to update workflow');
    }
    /**
     * Delete a workflow
     * @param id Workflow ID
     * @param user Current user
     * @returns Success/failure response
     */
    async deleteWorkflow(id, user) {
        return this.handleAsync(() => this.workflowService.deleteWorkflow(id, user.id), 'Failed to delete workflow');
    }
    /**
     * Execute a workflow
     * @param id Workflow ID
     * @param inputs Workflow inputs
     * @param user Current user
     * @returns Workflow execution
     */
    async executeWorkflow(id, inputs = {}, user) {
        return this.handleAsync(() => this.workflowService.executeWorkflow(id, user.id, inputs), 'Failed to execute workflow');
    }
    /**
     * Get workflow executions
     * @param id Workflow ID
     * @param user Current user
     * @returns Array of workflow executions
     */
    async getWorkflowExecutions(id, user) {
        return this.handleAsync(() => this.workflowService.getWorkflowExecutions(id, user.id), 'Failed to get workflow executions');
    }
    /**
     * Get workflow execution by ID
     * @param id Workflow ID
     * @param executionId Execution ID
     * @param user Current user
     * @returns Workflow execution
     */
    async getExecution(id, executionId, user) {
        return this.handleAsync(() => this.workflowService.getExecutionById(executionId, user.id), 'Failed to get workflow execution');
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'Get all workflows for the current user' }),
    SwaggerResponse({ status: 200, description: 'List of workflows', type: [WorkflowDto] }),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getWorkflows", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get workflow by ID' }),
    ApiParam({ name: 'id', description: 'Workflow ID' }),
    SwaggerResponse({ status: 200, description: 'Workflow details', type: WorkflowDto }),
    SwaggerResponse({ status: 404, description: 'Workflow not found' }),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getWorkflow", null);
__decorate([
    Post(),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Create a new workflow' }),
    ApiBody({ type: CreateWorkflowDto }),
    SwaggerResponse({ status: 201, description: 'Workflow created', type: WorkflowDto }),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateWorkflowDto, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "createWorkflow", null);
__decorate([
    Put(':id'),
    ApiOperation({ summary: 'Update a workflow' }),
    ApiParam({ name: 'id', description: 'Workflow ID' }),
    ApiBody({ type: UpdateWorkflowDto }),
    SwaggerResponse({ status: 200, description: 'Workflow updated', type: WorkflowDto }),
    SwaggerResponse({ status: 404, description: 'Workflow not found' }),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateWorkflowDto, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "updateWorkflow", null);
__decorate([
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary: 'Delete a workflow' }),
    ApiParam({ name: 'id', description: 'Workflow ID' }),
    SwaggerResponse({ status: 204, description: 'Workflow deleted' }),
    SwaggerResponse({ status: 404, description: 'Workflow not found' }),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "deleteWorkflow", null);
__decorate([
    Post(':id/execute'),
    ApiOperation({ summary: 'Execute a workflow' }),
    ApiParam({ name: 'id', description: 'Workflow ID' }),
    ApiBody({ schema: { type: 'object', additionalProperties: true } }),
    SwaggerResponse({ status: 200, description: 'Workflow executed', type: WorkflowExecutionDto }),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "executeWorkflow", null);
__decorate([
    Get(':id/executions'),
    ApiOperation({ summary: 'Get workflow executions' }),
    ApiParam({ name: 'id', description: 'Workflow ID' }),
    SwaggerResponse({ status: 200, description: 'List of workflow executions', type: [WorkflowExecutionDto] }),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getWorkflowExecutions", null);
__decorate([
    Get(':id/executions/:executionId'),
    ApiOperation({ summary: 'Get workflow execution by ID' }),
    ApiParam({ name: 'id', description: 'Workflow ID' }),
    ApiParam({ name: 'executionId', description: 'Execution ID' }),
    SwaggerResponse({ status: 200, description: 'Workflow execution details', type: WorkflowExecutionDto }),
    SwaggerResponse({ status: 404, description: 'Execution not found' }),
    __param(0, Param('id')),
    __param(1, Param('executionId')),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getExecution", null);
WorkflowController = WorkflowController_1 = __decorate([
    ApiTags('Workflows'),
    Controller('workflows'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [WorkflowService])
], WorkflowController);
export { WorkflowController };
//# sourceMappingURL=workflow.controller.js.map