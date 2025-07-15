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
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, } from "@nestjs/common";
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { CreateAgentDto, UpdateAgentDto } from "@the-new-fuse/types";
import { AgentService } from '../services/agentService.js';
import { PrismaService } from '../lib/prisma.service.tsx';
import { ConfigService } from "@nestjs/config";
let AgentController = class AgentController {
    prismaService;
    configService;
    agentService;
    constructor(prismaService, configService) {
        this.prismaService = prismaService;
        this.configService = configService;
        this.agentService = new AgentService(prismaService, configService);
    }
    async createAgent(data, req) {
        const userId = req.user?.id;
        return this.agentService.createAgent(data, userId);
    }
    async getAgentById(id, req) {
        const userId = req.user?.id;
        return this.agentService.getAgentById(id, userId);
    }
    async updateAgent(id, updates, req) {
        const userId = req.user?.id;
        return this.agentService.updateAgent(id, updates, userId);
    }
    async deleteAgent(id, req) {
        const userId = req.user?.id;
        await this.agentService.deleteAgent(id, userId);
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateAgentDto, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "createAgent", null);
__decorate([
    Get(':id'),
    __param(0, Param("id")),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentById", null);
__decorate([
    Put(':id'),
    __param(0, Param("id")),
    __param(1, Body()),
    __param(2, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateAgentDto, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateAgent", null);
__decorate([
    Delete(':id'),
    __param(0, Param("id")),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "deleteAgent", null);
AgentController = __decorate([
    Controller("agents"),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [PrismaService,
        ConfigService])
], AgentController);
export { AgentController };
