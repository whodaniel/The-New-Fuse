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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentController = void 0;
const common_1 = require("@nestjs/common");
const agent_service_1 = require("./agent.service");
const types_1 = require("@the-new-fuse/types");
const jwt_auth_guard_1 = require("@/auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("@/auth/decorators/current-user.decorator");
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
exports.AgentController = AgentController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof types_1.CreateAgentDto !== "undefined" && types_1.CreateAgentDto) === "function" ? _a : Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "createAgent", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('capability')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgents", null);
__decorate([
    (0, common_1.Get)('active'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getActiveAgents", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentById", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof types_1.UpdateAgentDto !== "undefined" && types_1.UpdateAgentDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateAgent", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof types_1.AgentStatus !== "undefined" && types_1.AgentStatus) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateAgentStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "deleteAgent", null);
exports.AgentController = AgentController = __decorate([
    (0, common_1.Controller)('agents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [agent_service_1.AgentService])
], AgentController);
//# sourceMappingURL=agent.controller.js.map