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
import { AgentService } from '../services/agent.service';
import { toError } from '../utils/error';
import { UseGuards, Get, Post, Put, Delete, Param, Body, Controller } from '@nestjs/common';
import { JwtAuthGuard } from '../modules/guards/jwt-auth.guard';
let AgentController = class AgentController {
    agentService;
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
            const { createdAt, updatedAt, ...agentData } = createAgentDto;
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
            const { createdAt, updatedAt, ...agentData } = updateAgentDto;
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAllAgents", null);
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentById", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "createAgent", null);
__decorate([
    Put(':id'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateAgent", null);
__decorate([
    Delete(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "deleteAgent", null);
AgentController = __decorate([
    Controller('agents'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof AgentService !== "undefined" && AgentService) === "function" ? _a : Object])
], AgentController);
export { AgentController };
//# sourceMappingURL=AgentController.js.map