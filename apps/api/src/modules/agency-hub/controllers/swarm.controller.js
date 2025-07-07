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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwarmController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rxjs_1 = require("rxjs");
const agent_swarm_orchestration_service_1 = require("@the-new-fuse/core/services/agent-swarm-orchestration.service");
const auth_guard_1 = require("../../../guards/auth.guard");
const roles_guard_1 = require("../../../guards/roles.guard");
const roles_decorator_1 = require("../../../decorators/roles.decorator");
const client_1 = require("@prisma/client");
let SwarmController = class SwarmController {
    swarmOrchestrationService;
    constructor(swarmOrchestrationService) {
        this.swarmOrchestrationService = swarmOrchestrationService;
    }
    async createExecution(agencyId, executionDto) {
        try {
            return await this.swarmOrchestrationService.createExecution(agencyId, executionDto.serviceRequestId, executionDto.executionPlan, executionDto.configuration);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to create execution', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getExecutions(agencyId, status, limit = 50, offset = 0) {
        try {
            return await this.swarmOrchestrationService.getExecutions(agencyId, {
                status,
                limit,
                offset
            });
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get executions', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getExecution(executionId) {
        try {
            return await this.swarmOrchestrationService.getExecutionDetails(executionId);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Execution not found', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async updateExecutionStatus(executionId, statusDto) {
        try {
            return await this.swarmOrchestrationService.updateExecutionStatus(executionId, statusDto.status, statusDto.reason);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to update status', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async updateExecutionStep(executionId, stepId, stepUpdateDto) {
        try {
            return await this.swarmOrchestrationService.updateExecutionStep(executionId, stepId, stepUpdateDto);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to update step', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async sendMessage(executionId, messageDto) {
        try {
            return await this.swarmOrchestrationService.sendMessage(executionId, messageDto.fromAgentId, messageDto.toAgentId, messageDto.type, messageDto.content, messageDto.priority);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to send message', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getMessages(executionId, agentId, limit = 100) {
        try {
            return await this.swarmOrchestrationService.getMessages(executionId, {
                agentId,
                limit
            });
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get messages', common_1.HttpStatus.NOT_FOUND);
        }
    }
    streamExecutionProgress(executionId) {
        return this.swarmOrchestrationService.streamExecutionProgress(executionId)
            .pipe((0, rxjs_1.map)(data => ({
            data: JSON.stringify(data),
            type: 'execution-progress'
        })));
    }
    async performHealthCheck(agencyId) {
        try {
            return await this.swarmOrchestrationService.performHealthCheck(agencyId);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Health check failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getMetrics(agencyId, timeframe = '24h') {
        try {
            return await this.swarmOrchestrationService.getPerformanceMetrics(agencyId, timeframe);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get metrics', common_1.HttpStatus.NOT_FOUND);
        }
    }
};
exports.SwarmController = SwarmController;
__decorate([
    (0, common_1.Post)(':agencyId/executions'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.AGENCY_ADMIN, client_1.UserRole.AGENCY_MANAGER, client_1.UserRole.AGENT_OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Create new swarm execution' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Swarm execution created' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "createExecution", null);
__decorate([
    (0, common_1.Get)(':agencyId/executions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agency swarm executions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Executions retrieved' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "getExecutions", null);
__decorate([
    (0, common_1.Get)('executions/:executionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific execution details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Execution details retrieved' }),
    __param(0, (0, common_1.Param)('executionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "getExecution", null);
__decorate([
    (0, common_1.Put)('executions/:executionId/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.AGENCY_ADMIN, client_1.UserRole.AGENT_OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Update execution status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status updated successfully' }),
    __param(0, (0, common_1.Param)('executionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "updateExecutionStatus", null);
__decorate([
    (0, common_1.Post)('executions/:executionId/steps/:stepId/update'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.AGENT_OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Update execution step progress' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Step updated successfully' }),
    __param(0, (0, common_1.Param)('executionId')),
    __param(1, (0, common_1.Param)('stepId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "updateExecutionStep", null);
__decorate([
    (0, common_1.Post)('executions/:executionId/messages'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.AGENT_OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Send message in swarm execution' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Message sent successfully' }),
    __param(0, (0, common_1.Param)('executionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('executions/:executionId/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get execution messages' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Messages retrieved' }),
    __param(0, (0, common_1.Param)('executionId')),
    __param(1, (0, common_1.Query)('agentId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Sse)('executions/:executionId/progress'),
    (0, swagger_1.ApiOperation)({ summary: 'Stream execution progress' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Progress stream established' }),
    __param(0, (0, common_1.Param)('executionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", rxjs_1.Observable)
], SwarmController.prototype, "streamExecutionProgress", null);
__decorate([
    (0, common_1.Post)(':agencyId/health-check'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.AGENCY_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Perform swarm health check' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Health check completed' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "performHealthCheck", null);
__decorate([
    (0, common_1.Get)(':agencyId/metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get swarm performance metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Metrics retrieved' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Query)('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "getMetrics", null);
exports.SwarmController = SwarmController = __decorate([
    (0, swagger_1.ApiTags)('swarm'),
    (0, common_1.Controller)('api/swarm'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [typeof (_a = typeof agent_swarm_orchestration_service_1.AgentSwarmOrchestrationService !== "undefined" && agent_swarm_orchestration_service_1.AgentSwarmOrchestrationService) === "function" ? _a : Object])
], SwarmController);
