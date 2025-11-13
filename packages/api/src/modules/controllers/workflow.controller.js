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
var _a;
import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { WorkflowService } from '../services/workflow.service';
import { BaseController } from './base.controller';
import { CurrentUser } from '../decorators/current-user.decorator';
// Swagger imports removed for build compatibility
let WorkflowController = WorkflowController_1 = class WorkflowController extends BaseController {
    workflowService;
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
        return this.handleAsync(() => this.workflowService.getWorkflows(user?.id || 'default-user'), 'Failed to get workflows');
    }
    /**
     * Get workflow by ID
     * @param id Workflow ID
     * @param user Current user
     * @returns Workflow
     */
    async getWorkflow(id, user) {
        return this.handleAsync(() => this.workflowService.getWorkflowById(id, user?.id || 'default-user'), 'Failed to get workflow');
    }
    /**
     * Create a new workflow
     * @param data Workflow creation data
     * @param user Current user
     * @returns Created workflow
     */
    async createWorkflow(data, user) {
        return this.handleAsync(() => this.workflowService.createWorkflow(data, user?.id || 'default-user'), 'Failed to create workflow');
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
        return this.handleAsync(() => this.workflowService.executeWorkflow(id, user?.id || 'default-user', inputs), 'Failed to execute workflow');
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
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getWorkflows", null);
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getWorkflow", null);
__decorate([
    Post(),
    HttpCode(HttpStatus.CREATED),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "createWorkflow", null);
__decorate([
    Put(':id'),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "updateWorkflow", null);
__decorate([
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "deleteWorkflow", null);
__decorate([
    Post(':id/execute'),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "executeWorkflow", null);
__decorate([
    Get(':id/executions'),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getWorkflowExecutions", null);
__decorate([
    Get(':id/executions/:executionId'),
    __param(0, Param('id')),
    __param(1, Param('executionId')),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getExecution", null);
WorkflowController = WorkflowController_1 = __decorate([
    Controller('workflows')
    // @UseGuards(JwtAuthGuard) // Temporarily disabled for development
    ,
    __metadata("design:paramtypes", [typeof (_a = typeof WorkflowService !== "undefined" && WorkflowService) === "function" ? _a : Object])
], WorkflowController);
export { WorkflowController };
//# sourceMappingURL=workflow.controller.js.map