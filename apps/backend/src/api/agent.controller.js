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
// In-memory storage for demo purposes
const agents = new Map();
let AgentController = class AgentController {
    async createAgent(data) {
        const id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const agent = {
            id,
            name: data.name,
            type: data.type,
            status: 'IDLE',
            description: data.description,
            capabilities: data.capabilities || [],
            systemPrompt: data.systemPrompt,
            createdAt: now,
            updatedAt: now
        };
        agents.set(id, agent);
        return agent;
    }
    async getAgents() {
        return Array.from(agents.values());
    }
    async getActiveAgents() {
        return Array.from(agents.values()).filter(agent => agent.status !== 'OFFLINE');
    }
    async getAgentById(id) {
        const agent = agents.get(id);
        if (!agent) {
            throw new common_1.HttpException('Agent not found', common_1.HttpStatus.NOT_FOUND);
        }
        return agent;
    }
    async updateAgent(id, updates) {
        const agent = agents.get(id);
        if (!agent) {
            throw new common_1.HttpException('Agent not found', common_1.HttpStatus.NOT_FOUND);
        }
        const updatedAgent = {
            ...agent,
            ...updates,
            updatedAt: new Date()
        };
        agents.set(id, updatedAgent);
        return updatedAgent;
    }
    async updateAgentStatus(id, status) {
        const agent = agents.get(id);
        if (!agent) {
            throw new common_1.HttpException('Agent not found', common_1.HttpStatus.NOT_FOUND);
        }
        const updatedAgent = {
            ...agent,
            status,
            updatedAt: new Date()
        };
        agents.set(id, updatedAgent);
        return updatedAgent;
    }
    async deleteAgent(id) {
        const deleted = agents.delete(id);
        if (!deleted) {
            throw new common_1.HttpException('Agent not found', common_1.HttpStatus.NOT_FOUND);
        }
        return { message: 'Agent deleted successfully' };
    }
};
exports.AgentController = AgentController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "createAgent", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgents", null);
__decorate([
    (0, common_1.Get)('active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getActiveAgents", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentById", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateAgent", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateAgentStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "deleteAgent", null);
exports.AgentController = AgentController = __decorate([
    (0, common_1.Controller)('api/agents')
], AgentController);
//# sourceMappingURL=agent.controller.js.map