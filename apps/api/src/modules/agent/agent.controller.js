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
var _a, _b, _c, _d;
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AgentService } from './agent.service';
import { CreateAgentDto, UpdateAgentDto, AgentStatus } from '@the-new-fuse/types';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
let AgentController = class AgentController {
    agentService;
    constructor(agentService) {
        this.agentService = agentService;
    }
    async createAgent(data, user) {
        return this.agentService.createAgent(data, user.id);
    }
    async getAgents(user, capability) {
        if (capability) {
            return this.agentService.getAgentsByCapability(capability, user.id);
        }
        return this.agentService.getAgents(user.id);
    }
    async getActiveAgents(user) {
        return this.agentService.getActiveAgents(user.id);
    }
    async getAgentById(id, user) {
        return this.agentService.getAgentById(id, user.id);
    }
    async updateAgent(id, updates, user) {
        return this.agentService.updateAgent(id, updates, user.id);
    }
    async updateAgentStatus(id, status, user) {
        return this.agentService.updateAgentStatus(id, status, user.id);
    }
    async deleteAgent(id, user) {
        return this.agentService.deleteAgent(id, user.id);
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof CreateAgentDto !== "undefined" && CreateAgentDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "createAgent", null);
__decorate([
    Get(),
    __param(0, CurrentUser()),
    __param(1, Query('capability')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgents", null);
__decorate([
    Get('active'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getActiveAgents", null);
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentById", null);
__decorate([
    Put(':id'),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof UpdateAgentDto !== "undefined" && UpdateAgentDto) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateAgent", null);
__decorate([
    Put(':id/status'),
    __param(0, Param('id')),
    __param(1, Body('status')),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof AgentStatus !== "undefined" && AgentStatus) === "function" ? _d : Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateAgentStatus", null);
__decorate([
    Delete(':id'),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "deleteAgent", null);
AgentController = __decorate([
    Controller('agents'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof AgentService !== "undefined" && AgentService) === "function" ? _a : Object])
], AgentController);
export { AgentController };
//# sourceMappingURL=agent.controller.js.map