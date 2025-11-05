/**
 * Local AI Controller
 * Handles detection and registration of local AI providers as Agents
 */
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
var LocalAIController_1;
var _a;
import { Controller, Get, Post, Param, Request, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AgentService } from '@the-new-fuse/api-core';
let LocalAIController = LocalAIController_1 = class LocalAIController {
    agentService;
    logger = new Logger(LocalAIController_1.name);
    constructor(agentService) {
        this.agentService = agentService;
    }
    async detectLocalAIs() {
        throw new HttpException('Local AI detection is not currently available', HttpStatus.NOT_IMPLEMENTED);
    }
    async registerLocalAIs(req) {
        throw new HttpException('Local AI registration is not currently available', HttpStatus.NOT_IMPLEMENTED);
    }
    async refreshLocalAIs(req) {
        throw new HttpException('Local AI refresh is not currently available', HttpStatus.NOT_IMPLEMENTED);
    }
    async getLocalAIAgents(req) {
        throw new HttpException('Local AI agents retrieval is not currently available', HttpStatus.NOT_IMPLEMENTED);
    }
    async getLocalAIAgentStatus(agentId, req) {
        throw new HttpException('Local AI agent status check is not currently available', HttpStatus.NOT_IMPLEMENTED);
    }
    async createSystemAgents() {
        throw new HttpException('Creating system local AI agents is not currently available', HttpStatus.NOT_IMPLEMENTED);
    }
};
__decorate([
    Get('detect'),
    ApiOperation({ summary: 'Detect available local AI providers' }),
    ApiResponse({ status: 200, description: 'List of detected local AI providers' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LocalAIController.prototype, "detectLocalAIs", null);
__decorate([
    Post('register'),
    ApiOperation({ summary: 'Register detected local AIs as user agents' }),
    ApiResponse({ status: 201, description: 'Local AI agents registered successfully' }),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocalAIController.prototype, "registerLocalAIs", null);
__decorate([
    Post('refresh'),
    ApiOperation({ summary: 'Refresh local AI agents for current user' }),
    ApiResponse({ status: 200, description: 'Local AI agents refreshed successfully' }),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocalAIController.prototype, "refreshLocalAIs", null);
__decorate([
    Get('agents'),
    ApiOperation({ summary: 'Get all local AI agents for current user' }),
    ApiResponse({ status: 200, description: 'List of local AI agents' }),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocalAIController.prototype, "getLocalAIAgents", null);
__decorate([
    Get('agents/:agentId/status'),
    ApiOperation({ summary: 'Check status of a specific local AI agent' }),
    ApiResponse({ status: 200, description: 'Local AI agent status' }),
    __param(0, Param('agentId')),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LocalAIController.prototype, "getLocalAIAgentStatus", null);
__decorate([
    Post('system/create-defaults'),
    ApiOperation({ summary: 'Create default system agents for all detected local AIs' }),
    ApiResponse({ status: 201, description: 'System local AI agents created successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LocalAIController.prototype, "createSystemAgents", null);
LocalAIController = LocalAIController_1 = __decorate([
    ApiTags('local-ai'),
    Controller('api/local-ai'),
    __metadata("design:paramtypes", [typeof (_a = typeof AgentService !== "undefined" && AgentService) === "function" ? _a : Object])
], LocalAIController);
export { LocalAIController };
//# sourceMappingURL=LocalAIController.js.map