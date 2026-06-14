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
import { Body, Controller, Delete, Get, Param, Post, Put, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AgentDto } from '../modules/controllers/dto/agent.dto.js'; // Updated import path
import { CurrentUser } from '../modules/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../modules/guards/jwt-auth.guard.js';
import { AgentService } from '../services/agent.service.js';
import { toError } from '../utils/error.js';
let AgentController = class AgentController {
    constructor(agentService) {
        this.agentService = agentService;
    }
    async getAllAgents(user, res) {
        try {
            const agents = await this.agentService.getAgents(user.id);
            return res.status(200).json(agents);
        }
        catch (error) {
            const err = toError(error);
            return res.status(500).json({ error: err.message });
        }
    }
    async getAgentById(id, user, res) {
        try {
            const agent = await this.agentService.getAgentById(id, user.id);
            return res.status(200).json(agent);
        }
        catch (error) {
            const err = toError(error);
            if (err.message?.includes('not found')) {
                return res.status(404).json({ error: err.message });
            }
            return res.status(500).json({ error: err.message });
        }
    }
    async createAgent(createAgentDto, user, res) {
        try {
            // Remove timestamp fields that should be set by the service
            const { createdAt: _createdAt, updatedAt: _updatedAt, ...agentData } = createAgentDto;
            const agent = await this.agentService.createAgent(agentData, user.id);
            return res.status(201).json(agent);
        }
        catch (error) {
            const err = toError(error);
            if (err.message?.includes('already exists')) {
                return res.status(409).json({ error: err.message });
            }
            return res.status(400).json({ error: err.message });
        }
    }
    async updateAgent(id, updateAgentDto, user, res) {
        try {
            // Remove timestamp fields that should be managed by the service
            const { createdAt: _createdAt2, updatedAt: _updatedAt2, ...agentData } = updateAgentDto;
            const updatedAgent = await this.agentService.updateAgent(id, agentData, user.id);
            return res.status(200).json(updatedAgent);
        }
        catch (error) {
            const err = toError(error);
            if (err.message?.includes('not found')) {
                return res.status(404).json({ error: err.message });
            }
            return res.status(400).json({ error: err.message });
        }
    }
    async startAgent(id, user, res) {
        try {
            const agent = await this.agentService.startAgent(id, user.id);
            return res.status(200).json(agent);
        }
        catch (error) {
            const err = toError(error);
            if (err.message?.includes('not found')) {
                return res.status(404).json({ error: err.message });
            }
            return res.status(500).json({ error: err.message });
        }
    }
    async stopAgent(id, user, res) {
        try {
            const agent = await this.agentService.stopAgent(id, user.id);
            return res.status(200).json(agent);
        }
        catch (error) {
            const err = toError(error);
            if (err.message?.includes('not found')) {
                return res.status(404).json({ error: err.message });
            }
            return res.status(500).json({ error: err.message });
        }
    }
    async deleteAgent(id, user, res) {
        try {
            const deleted = await this.agentService.deleteAgent(id, user.id);
            if (!deleted) {
                return res.status(404).json({ error: 'Agent not found or could not be deleted' });
            }
            return res.status(204).send();
        }
        catch (error) {
            const err = toError(error);
            if (err.message?.includes('not found')) {
                return res.status(404).json({ error: err.message });
            }
            return res.status(500).json({ error: err.message });
        }
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'Get all agents for authenticated user' }),
    ApiResponse({ status: 200, description: 'List of agents', type: [AgentDto] }),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAllAgents", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get agent by ID' }),
    ApiResponse({ status: 200, description: 'Agent found', type: AgentDto }),
    ApiResponse({ status: 404, description: 'Agent not found' }),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentById", null);
__decorate([
    Post(),
    ApiOperation({ summary: 'Create a new agent' }),
    ApiBody({ type: AgentDto }),
    ApiResponse({ status: 201, description: 'Agent created', type: AgentDto }),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AgentDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "createAgent", null);
__decorate([
    Put(':id'),
    ApiOperation({ summary: 'Update an agent' }),
    ApiBody({ type: AgentDto }),
    ApiResponse({ status: 200, description: 'Agent updated', type: AgentDto }),
    ApiResponse({ status: 404, description: 'Agent not found' }),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AgentDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateAgent", null);
__decorate([
    Post(':id/start'),
    ApiOperation({ summary: 'Start an agent' }),
    ApiResponse({ status: 200, description: 'Agent started', type: AgentDto }),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __param(2, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "startAgent", null);
__decorate([
    Post(':id/stop'),
    ApiOperation({ summary: 'Stop an agent' }),
    ApiResponse({ status: 200, description: 'Agent stopped', type: AgentDto }),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __param(2, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "stopAgent", null);
__decorate([
    Delete(':id'),
    ApiOperation({ summary: 'Delete an agent' }),
    ApiResponse({ status: 200, description: 'Agent deleted' }),
    ApiResponse({ status: 404, description: 'Agent not found' }),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "deleteAgent", null);
AgentController = __decorate([
    ApiTags('agents'),
    Controller('agents'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [AgentService])
], AgentController);
export { AgentController };
//# sourceMappingURL=AgentController.js.map