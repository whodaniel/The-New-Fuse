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
exports.AgentDiscoveryController = void 0;
const common_1 = require("@nestjs/common");
const agent_discovery_service_js_1 = require("../services/agent-discovery.service.js");
const jwt_auth_guard_js_1 = require("../auth/guards/jwt-auth.guard.js");
/**
 * Controller for agent discovery and registration
 */
let AgentDiscoveryController = class AgentDiscoveryController {
    agentDiscoveryService;
    constructor(agentDiscoveryService) {
        this.agentDiscoveryService = agentDiscoveryService;
    }
    /**
     * Register a new agent
     */
    async registerAgent(dto) {
        return this.agentDiscoveryService.registerAgent(dto.name, dto.description, dto.type, dto.userId, dto.capabilities, dto.tools);
    }
    /**
     * Discover all MCP tools
     */
    async discoverTools() {
        return this.agentDiscoveryService.discoverMCPTools();
    }
    /**
     * Discover all registered agents
     */
    async discoverAgents() {
        return this.agentDiscoveryService.discoverAgents();
    }
    /**
     * Update agent tools
     */
    async updateAgentTools(id, tools) {
        return this.agentDiscoveryService.updateAgentTools(id, tools);
    }
};
exports.AgentDiscoveryController = AgentDiscoveryController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentDiscoveryController.prototype, "registerAgent", null);
__decorate([
    (0, common_1.Get)('tools'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentDiscoveryController.prototype, "discoverTools", null);
__decorate([
    (0, common_1.Get)('agents'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentDiscoveryController.prototype, "discoverAgents", null);
__decorate([
    (0, common_1.Post)('agents/:id/tools'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentDiscoveryController.prototype, "updateAgentTools", null);
exports.AgentDiscoveryController = AgentDiscoveryController = __decorate([
    (0, common_1.Controller)('agent-discovery'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __metadata("design:paramtypes", [agent_discovery_service_js_1.AgentDiscoveryService])
], AgentDiscoveryController);
//# sourceMappingURL=agent-discovery.controller.js.map