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
exports.AgentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const agent_service_1 = require("../services/agent.service");
const types_1 = require("@the-new-fuse/types");
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
            return await this.agentService.createAgent(agentData);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to create agent', common_1.HttpStatus.BAD_REQUEST);
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
            throw new common_1.HttpException(error.message || 'Failed to fetch agents', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getActiveAgents() {
        try {
            return this.agentService.getActiveAgents();
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch active agents', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAgentTypeCounts() {
        try {
            return this.agentService.getAgentTypeCounts();
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch agent type counts', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAgentById(id) {
        try {
            return await this.agentService.findAgentById(id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to fetch agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAgentStats(id) {
        try {
            return await this.agentService.getAgentStats(id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to fetch agent stats', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateAgent(id, updateAgentDto) {
        try {
            return await this.agentService.updateAgent(id, updateAgentDto);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to update agent', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async activateAgent(id) {
        try {
            return await this.agentService.activateAgent(id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to activate agent', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async deactivateAgent(id) {
        try {
            return await this.agentService.deactivateAgent(id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to deactivate agent', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async pauseAgent(id) {
        try {
            return await this.agentService.pauseAgent(id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to pause agent', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async markAgentBusy(id) {
        try {
            return await this.agentService.markAgentBusy(id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to mark agent as busy', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async markAgentError(id) {
        try {
            return await this.agentService.markAgentError(id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to mark agent as error', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async deleteAgent(id) {
        try {
            await this.agentService.deleteAgent(id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to delete agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AgentController = AgentController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new agent' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [types_1.CreateAgentDto, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "createAgent", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all agents' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: [types_1.AgentResponseDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgents", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active agents' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: [types_1.AgentResponseDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getActiveAgents", null);
__decorate([
    (0, common_1.Get)('stats/types'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agent count by type' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentTypeCounts", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agent by ID' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentById", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agent statistics' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentStats", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update agent' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, types_1.UpdateAgentDto]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateAgent", null);
__decorate([
    (0, common_1.Put)(':id/activate'),
    (0, swagger_1.ApiOperation)({ summary: 'Activate agent' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "activateAgent", null);
__decorate([
    (0, common_1.Put)(':id/deactivate'),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate agent' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "deactivateAgent", null);
__decorate([
    (0, common_1.Put)(':id/pause'),
    (0, swagger_1.ApiOperation)({ summary: 'Pause agent' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "pauseAgent", null);
__decorate([
    (0, common_1.Put)(':id/busy'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark agent as busy' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "markAgentBusy", null);
__decorate([
    (0, common_1.Put)(':id/error'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark agent as error' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, type: types_1.AgentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "markAgentError", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete agent' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "deleteAgent", null);
exports.AgentController = AgentController = __decorate([
    (0, swagger_1.ApiTags)('Agents'),
    (0, common_1.Controller)('agents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [agent_service_1.AgentService])
], AgentController);
