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
const jwt_auth_guard_js_1 = require("../guards/jwt-auth.guard.js");
const types_1 = require("@the-new-fuse/types");
const agentService_js_1 = require("../services/agentService.js");
const drizzle_service_tsx_1 = require("../lib/drizzle.service.tsx");
const config_1 = require("@nestjs/config");
let AgentController = class AgentController {
    drizzleService;
    configService;
    agentService;
    constructor(drizzleService, configService) {
        this.drizzleService = drizzleService;
        this.configService = configService;
        this.agentService = new agentService_js_1.AgentService(drizzleService, configService);
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
exports.AgentController = AgentController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof types_1.CreateAgentDto !== "undefined" && types_1.CreateAgentDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "createAgent", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getAgentById", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof types_1.UpdateAgentDto !== "undefined" && types_1.UpdateAgentDto) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateAgent", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "deleteAgent", null);
exports.AgentController = AgentController = __decorate([
    (0, common_1.Controller)("agents"),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof drizzle_service_tsx_1.DatabaseService !== "undefined" && drizzle_service_tsx_1.DatabaseService) === "function" ? _a : Object, config_1.ConfigService])
], AgentController);
//# sourceMappingURL=agentController.js.map