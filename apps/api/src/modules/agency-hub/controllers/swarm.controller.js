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
import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, HttpStatus, HttpException, Sse, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { AgentSwarmOrchestrationService } from '@the-new-fuse/core/services/agent-swarm-orchestration.service';
import { AuthGuard } from '../../../guards/auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { EnhancedUserRole } from '@prisma/client';
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
            throw new HttpException(error.message || 'Failed to create execution', HttpStatus.BAD_REQUEST);
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
            throw new HttpException(error.message || 'Failed to get executions', HttpStatus.NOT_FOUND);
        }
    }
    async getExecution(executionId) {
        try {
            return await this.swarmOrchestrationService.getExecutionDetails(executionId);
        }
        catch (error) {
            throw new HttpException(error.message || 'Execution not found', HttpStatus.NOT_FOUND);
        }
    }
    async updateExecutionStatus(executionId, statusDto) {
        try {
            return await this.swarmOrchestrationService.updateExecutionStatus(executionId, statusDto.status, statusDto.reason);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to update status', HttpStatus.BAD_REQUEST);
        }
    }
    async updateExecutionStep(executionId, stepId, stepUpdateDto) {
        try {
            return await this.swarmOrchestrationService.updateExecutionStep(executionId, stepId, stepUpdateDto);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to update step', HttpStatus.BAD_REQUEST);
        }
    }
    async sendMessage(executionId, messageDto) {
        try {
            return await this.swarmOrchestrationService.sendMessage(executionId, messageDto.fromAgentId, messageDto.toAgentId, messageDto.type, messageDto.content, messageDto.priority);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to send message', HttpStatus.BAD_REQUEST);
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
            throw new HttpException(error.message || 'Failed to get messages', HttpStatus.NOT_FOUND);
        }
    }
    streamExecutionProgress(executionId) {
        return this.swarmOrchestrationService.streamExecutionProgress(executionId)
            .pipe(map(data => ({
            data: JSON.stringify(data),
            type: 'execution-progress'
        })));
    }
    async performHealthCheck(agencyId) {
        try {
            return await this.swarmOrchestrationService.performHealthCheck(agencyId);
        }
        catch (error) {
            throw new HttpException(error.message || 'Health check failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getMetrics(agencyId, timeframe = '24h') {
        try {
            return await this.swarmOrchestrationService.getPerformanceMetrics(agencyId, timeframe);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get metrics', HttpStatus.NOT_FOUND);
        }
    }
};
__decorate([
    Post(':agencyId/executions'),
    UseGuards(RolesGuard),
    Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENCY_MANAGER, EnhancedUserRole.AGENT_OPERATOR),
    ApiOperation({ summary: 'Create new swarm execution' }),
    ApiResponse({ status: 201, description: 'Swarm execution created' }),
    __param(0, Param('agencyId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "createExecution", null);
__decorate([
    Get(':agencyId/executions'),
    ApiOperation({ summary: 'Get agency swarm executions' }),
    ApiResponse({ status: 200, description: 'Executions retrieved' }),
    __param(0, Param('agencyId')),
    __param(1, Query('status')),
    __param(2, Query('limit')),
    __param(3, Query('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "getExecutions", null);
__decorate([
    Get('executions/:executionId'),
    ApiOperation({ summary: 'Get specific execution details' }),
    ApiResponse({ status: 200, description: 'Execution details retrieved' }),
    __param(0, Param('executionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "getExecution", null);
__decorate([
    Put('executions/:executionId/status'),
    UseGuards(RolesGuard),
    Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENT_OPERATOR),
    ApiOperation({ summary: 'Update execution status' }),
    ApiResponse({ status: 200, description: 'Status updated successfully' }),
    __param(0, Param('executionId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "updateExecutionStatus", null);
__decorate([
    Post('executions/:executionId/steps/:stepId/update'),
    UseGuards(RolesGuard),
    Roles(EnhancedUserRole.AGENT_OPERATOR),
    ApiOperation({ summary: 'Update execution step progress' }),
    ApiResponse({ status: 200, description: 'Step updated successfully' }),
    __param(0, Param('executionId')),
    __param(1, Param('stepId')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "updateExecutionStep", null);
__decorate([
    Post('executions/:executionId/messages'),
    UseGuards(RolesGuard),
    Roles(EnhancedUserRole.AGENT_OPERATOR),
    ApiOperation({ summary: 'Send message in swarm execution' }),
    ApiResponse({ status: 201, description: 'Message sent successfully' }),
    __param(0, Param('executionId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "sendMessage", null);
__decorate([
    Get('executions/:executionId/messages'),
    ApiOperation({ summary: 'Get execution messages' }),
    ApiResponse({ status: 200, description: 'Messages retrieved' }),
    __param(0, Param('executionId')),
    __param(1, Query('agentId')),
    __param(2, Query('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "getMessages", null);
__decorate([
    Sse('executions/:executionId/progress'),
    ApiOperation({ summary: 'Stream execution progress' }),
    ApiResponse({ status: 200, description: 'Progress stream established' }),
    __param(0, Param('executionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Observable)
], SwarmController.prototype, "streamExecutionProgress", null);
__decorate([
    Post(':agencyId/health-check'),
    UseGuards(RolesGuard),
    Roles(EnhancedUserRole.AGENCY_ADMIN),
    ApiOperation({ summary: 'Perform swarm health check' }),
    ApiResponse({ status: 200, description: 'Health check completed' }),
    __param(0, Param('agencyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "performHealthCheck", null);
__decorate([
    Get(':agencyId/metrics'),
    ApiOperation({ summary: 'Get swarm performance metrics' }),
    ApiResponse({ status: 200, description: 'Metrics retrieved' }),
    __param(0, Param('agencyId')),
    __param(1, Query('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SwarmController.prototype, "getMetrics", null);
SwarmController = __decorate([
    ApiTags('swarm'),
    Controller('api/swarm'),
    UseGuards(AuthGuard),
    ApiBearerAuth(),
    __metadata("design:paramtypes", [typeof (_a = typeof AgentSwarmOrchestrationService !== "undefined" && AgentSwarmOrchestrationService) === "function" ? _a : Object])
], SwarmController);
export { SwarmController };
//# sourceMappingURL=swarm.controller.js.map