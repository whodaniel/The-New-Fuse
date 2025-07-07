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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const WorkflowService_1 = require("../services/workflow/WorkflowService");
let WorkflowController = class WorkflowController {
    workflowService;
    constructor(workflowService) {
        this.workflowService = workflowService;
    }
    async createWorkflow(data, user) {
        try {
            return await this.workflowService.createWorkflow(data, user.id);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to create workflow', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async executeWorkflow(id, user) {
        try {
            await this.workflowService.executeWorkflow(id, user.id);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to execute workflow', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getWorkflowStatus(id, user) {
        try {
            return await this.workflowService.getWorkflowStatus(id, user.id);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get workflow status', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getWorkflowResults(id, user) {
        try {
            return await this.workflowService.getWorkflowResults(id, user.id);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get workflow results', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateWorkflow(id, updates, user) {
        try {
            return await this.workflowService.updateWorkflow(id, updates, user.id);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to update workflow', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async deleteWorkflow(id, user) {
        try {
            await this.workflowService.deleteWorkflow(id, user.id);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to delete workflow', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.WorkflowController = WorkflowController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new workflow' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, type: types_1.Workflow }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "createWorkflow", null);
__decorate([
    (0, common_1.Post)(':id/execute'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute a workflow' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "executeWorkflow", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workflow execution status' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: String }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getWorkflowStatus", null);
__decorate([
    (0, common_1.Get)(':id/results'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workflow execution results' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getWorkflowResults", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update workflow' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: types_1.Workflow }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "updateWorkflow", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete workflow' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "deleteWorkflow", null);
exports.WorkflowController = WorkflowController = __decorate([
    (0, swagger_1.ApiTags)('Workflows'),
    (0, common_1.Controller)('workflows'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [WorkflowService_1.WorkflowService])
], WorkflowController);
