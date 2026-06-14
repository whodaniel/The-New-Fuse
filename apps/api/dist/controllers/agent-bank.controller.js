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
exports.AgentBankController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const agent_bank_service_1 = require("../services/agent-bank.service");
/**
 * AgentBankController
 *
 * Exposes the library of agent templates (personas) defined in the filesystem.
 * This allows the frontend and other agents to discover and utilize
 * pre-defined agent definitions from the .agent/agents and .claude/agents directories.
 */
let AgentBankController = class AgentBankController {
    constructor(agentBankService) {
        this.agentBankService = agentBankService;
    }
    /**
     * List all agent templates from the banks
     */
    async listTemplates(user, bank = 'all') {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.agentBankService.listTemplates(bank, user.id, user.role);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to list templates', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * Get the content of a specific agent template
     */
    async getTemplate(user, bank, filename) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            const content = await this.agentBankService.getTemplateContent(bank, filename, user.id, user.role);
            return { content };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to get template', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AgentBankController = AgentBankController;
__decorate([
    (0, common_1.Get)('templates'),
    (0, swagger_1.ApiOperation)({
        summary: 'List all agent templates from the filesystem bank',
        description: 'STARTER tier restricts access to the TNF bank only. PRO/ENTERPRISE tiers have full access.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of agent templates' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('bank')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AgentBankController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Get)('template/:bank/:filename'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get the content of a specific agent template',
        description: 'Access to the Claude bank requires a PRO or ENTERPRISE membership.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Template content' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('bank')),
    __param(2, (0, common_1.Param)('filename')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentBankController.prototype, "getTemplate", null);
exports.AgentBankController = AgentBankController = __decorate([
    (0, swagger_1.ApiTags)('Agents'),
    (0, common_1.Controller)('agents/bank'),
    (0, secure_auth_guard_1.JwtAuth)(),
    __metadata("design:paramtypes", [agent_bank_service_1.AgentBankService])
], AgentBankController);
//# sourceMappingURL=agent-bank.controller.js.map