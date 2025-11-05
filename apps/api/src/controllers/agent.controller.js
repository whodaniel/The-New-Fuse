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
var _a, _b, _c, _d, _e, _f, _g;
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AgentService } from '../services/agent.service';
import { CreateAgentDto, UpdateAgentDto, AgentResponseDto, AgentStatus, AgentType } from '@the-new-fuse/types';
import { User } from '@the-new-fuse/database';
let AgentController = class AgentController {
    agentService;
    constructor(agentService) {
        this.agentService = agentService;
    }
    async createAgent(createAgentDto, user) {
        try {
            // Add userId from authenticated user
            const agentData = {
                ...createAgentDto,
                userId: user.id
            };
            return await this.agentService.createAgent(agentData, user.id);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to create agent', HttpStatus.BAD_REQUEST);
        }
    }
    async getAgents(user, type, status, search) {
        try {
            if (type) {
                return this.agentService.findAgentsByType(type);
            }
            if (status) {
                return this.agentService.findAgentsByStatus(status);
            }
            if (search) {
                return this.agentService.searchAgents(user.id, search);
            }
            return this.agentService.findAgentsByUserId(user.id);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to fetch agents', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getActiveAgents() {
        try {
            return this.agentService.getActiveAgents();
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to fetch active agents', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAgentTypeCounts() {
        try {
            return this.agentService.getAgentTypeCounts();
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to fetch agent type counts', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAgentById(id) {
        try {
            return await this.agentService.findAgentById(id);
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(error.message || 'Failed to fetch agent', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAgentStats(id) {
        try {
            return await this.agentService.getAgentStats(id);
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(error.message || 'Failed to fetch agent stats', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateAgent(id, updateAgentDto) {
        try {
            return await this.agentService.updateAgent(id, updateAgentDto);
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(error.message || 'Failed to update agent', HttpStatus.BAD_REQUEST);
        }
    }
    async activateAgent(id) {
        try {
            return await this.agentService.activateAgent(id);
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(error.message || 'Failed to activate agent', HttpStatus.BAD_REQUEST);
        }
    }
    async deactivateAgent(id) {
        try {
            return await this.agentService.deactivateAgent(id);
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(error.message || 'Failed to deactivate agent', HttpStatus.BAD_REQUEST);
        }
    }
    async pauseAgent(id) {
        try {
            return await this.agentService.pauseAgent(id);
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(error.message || 'Failed to pause agent', HttpStatus.BAD_REQUEST);
        }
    }
    async markAgentBusy(id) {
        try {
            return await this.agentService.markAgentBusy(id);
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(error.message || 'Failed to mark agent as busy', HttpStatus.BAD_REQUEST);
        }
    }
    async markAgentError(id) {
        try {
            return await this.agentService.markAgentError(id);
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(error.message || 'Failed to mark agent as error', HttpStatus.BAD_REQUEST);
        }
    }
    async deleteAgent(id) {
        try {
            await this.agentService.deleteAgent(id);
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(error.message || 'Failed to delete agent', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
__decorate([
    Post(),
    ApiOperation({ summary: 'Create a new agent' }),
    ApiResponse({ status: HttpStatus.CREATED, type: AgentResponseDto }),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof CreateAgentDto !== "undefined" && CreateAgentDto) === "function" ? _b : Object, typeof (_c = typeof User !== "undefined" && User) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "createAgent", null);
__decorate([
    Get(),
    ApiOperation({ summary: 'Get all agents' }),
    ApiResponse({ status: HttpStatus.OK, type: [AgentResponseDto] }),
    __param(0, CurrentUser()),
    __param(1, Query('type')),
    __param(2, Query('status')),
    __param(3, Query('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof User !== "undefined" && User) === "function" ? _d : Object, typeof (_e = typeof AgentType !== "undefined" && AgentType) === "function" ? _e : Object, typeof (_f = typeof AgentStatus !== "undefined" && AgentStatus) === "function" ? _f : Object, String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgents", null);
__decorate([
    Get('active'),
    ApiOperation({ summary: 'Get active agents' }),
    ApiResponse({ status: HttpStatus.OK, type: [AgentResponseDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getActiveAgents", null);
__decorate([
    Get('stats/types'),
    ApiOperation({ summary: 'Get agent count by type' }),
    ApiResponse({ status: HttpStatus.OK }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentTypeCounts", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get agent by ID' }),
    ApiResponse({ status: HttpStatus.OK, type: AgentResponseDto }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentById", null);
__decorate([
    Get(':id/stats'),
    ApiOperation({ summary: 'Get agent statistics' }),
    ApiResponse({ status: HttpStatus.OK }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentStats", null);
__decorate([
    Put(':id'),
    ApiOperation({ summary: 'Update agent' }),
    ApiResponse({ status: HttpStatus.OK, type: AgentResponseDto }),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_g = typeof UpdateAgentDto !== "undefined" && UpdateAgentDto) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateAgent", null);
__decorate([
    Put(':id/activate'),
    ApiOperation({ summary: 'Activate agent' }),
    ApiResponse({ status: HttpStatus.OK, type: AgentResponseDto }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "activateAgent", null);
__decorate([
    Put(':id/deactivate'),
    ApiOperation({ summary: 'Deactivate agent' }),
    ApiResponse({ status: HttpStatus.OK, type: AgentResponseDto }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "deactivateAgent", null);
__decorate([
    Put(':id/pause'),
    ApiOperation({ summary: 'Pause agent' }),
    ApiResponse({ status: HttpStatus.OK, type: AgentResponseDto }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "pauseAgent", null);
__decorate([
    Put(':id/busy'),
    ApiOperation({ summary: 'Mark agent as busy' }),
    ApiResponse({ status: HttpStatus.OK, type: AgentResponseDto }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "markAgentBusy", null);
__decorate([
    Put(':id/error'),
    ApiOperation({ summary: 'Mark agent as error' }),
    ApiResponse({ status: HttpStatus.OK, type: AgentResponseDto }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "markAgentError", null);
__decorate([
    Delete(':id'),
    ApiOperation({ summary: 'Delete agent' }),
    ApiResponse({ status: HttpStatus.NO_CONTENT }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "deleteAgent", null);
AgentController = __decorate([
    ApiTags('Agents'),
    Controller('agents'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof AgentService !== "undefined" && AgentService) === "function" ? _a : Object])
], AgentController);
export { AgentController };
//# sourceMappingURL=agent.controller.js.map