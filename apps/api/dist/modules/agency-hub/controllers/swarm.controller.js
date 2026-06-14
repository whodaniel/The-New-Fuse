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
exports.SwarmController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rxjs_1 = require("rxjs");
const roles_decorator_1 = require("../../../decorators/roles.decorator");
const auth_guard_1 = require("../../../guards/auth.guard");
const roles_guard_1 = require("../../../guards/roles.guard");
const user_types_1 = require("../../../types/user.types");
const agent_swarm_orchestration_service_1 = require("../services/agent-swarm-orchestration.service");
let SwarmController = class SwarmController {
    constructor(swarmOrchestrationService) {
        this.swarmOrchestrationService = swarmOrchestrationService;
    }
    getSwarmCapabilityStatus() {
        return {
            available: {
                createExecution: true,
                listExecutions: true,
                healthCheck: true,
                metrics: true,
            },
            unavailable: {
                getExecution: true,
                updateExecutionStatus: true,
                updateExecutionStep: true,
                sendMessage: true,
                getMessages: true,
                streamExecutionProgress: true,
            },
            reason: 'Detailed execution/message APIs are not implemented in this deployment.',
        };
    }
    async createExecution(agencyId, executionDto) {
        return this.swarmOrchestrationService.submitTask(agencyId, executionDto);
    }
    async getExecutions(agencyId, status, limit = 50, offset = 0) {
        const metrics = await this.swarmOrchestrationService.getExecutionMetrics(agencyId);
        return { metrics };
    }
    async getExecution(executionId) {
        this.notImplemented('Swarm execution details');
    }
    async updateExecutionStatus(executionId, statusDto) {
        this.notImplemented('Updating swarm execution status');
    }
    async updateExecutionStep(executionId, stepId, stepUpdateDto) {
        this.notImplemented('Updating swarm execution step');
    }
    async sendMessage(executionId, messageDto) {
        this.notImplemented('Sending messages in swarm execution');
    }
    async getMessages(executionId, agentId, limit = 100) {
        this.notImplemented('Getting swarm execution messages');
    }
    streamExecutionProgress(executionId) {
        this.notImplemented('Streaming swarm execution progress');
    }
    async performHealthCheck(agencyId) {
        const status = await this.swarmOrchestrationService.getSwarmStatus(agencyId);
        return status;
    }
    async getMetrics(agencyId, timeframe = '24h') {
        const metrics = await this.swarmOrchestrationService.getExecutionMetrics(agencyId);
        return metrics;
    }
    notImplemented(feature) {
        throw new common_1.HttpException(`${feature} is not implemented in this deployment.`, common_1.HttpStatus.NOT_IMPLEMENTED);
    }
};
exports.SwarmController = SwarmController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get swarm API capability status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Swarm endpoint capability matrix' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SwarmController.prototype, "getSwarmCapabilityStatus", null);
__decorate([
    (0, common_1.Post)(':agencyId/executions'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_types_1.UserRole.AGENCY_ADMIN, user_types_1.UserRole.AGENCY_MANAGER, user_types_1.UserRole.AGENT_OPERATOR),
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
    (0, roles_decorator_1.Roles)(user_types_1.UserRole.AGENCY_ADMIN, user_types_1.UserRole.AGENT_OPERATOR),
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
    (0, roles_decorator_1.Roles)(user_types_1.UserRole.AGENT_OPERATOR),
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
    (0, roles_decorator_1.Roles)(user_types_1.UserRole.AGENT_OPERATOR),
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
    (0, roles_decorator_1.Roles)(user_types_1.UserRole.AGENCY_ADMIN),
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
    (0, common_1.Controller)('swarm'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [agent_swarm_orchestration_service_1.AgentSwarmOrchestrationService])
], SwarmController);
//# sourceMappingURL=swarm.controller.js.map