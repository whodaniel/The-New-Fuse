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
exports.AgentProxyController = void 0;
const common_1 = require("@nestjs/common");
// @ts-ignore
// @ts-ignore
const swagger_1 = require("@nestjs/swagger");
const agent_api_grants_service_1 = require("../services/agent-api-grants.service");
let AgentProxyController = class AgentProxyController {
    constructor(grantsService) {
        this.grantsService = grantsService;
    }
    async proxy(provider, authorization, body) {
        try {
            const target = typeof body?.target === 'string' ? body.target.trim() : '';
            if (target) {
                const payload = body && typeof body === 'object'
                    ? Object.fromEntries(Object.entries(body).filter(([k]) => k !== 'target'))
                    : body;
                return await this.grantsService.adaptiveProxy(target, authorization, payload);
            }
            return await this.grantsService.proxy(provider, authorization, body);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Proxy request failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async adaptiveProxy(target, authorization, body) {
        try {
            return await this.grantsService.adaptiveProxy(target, authorization, body);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Adaptive proxy request failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async adaptiveConfig(target) {
        try {
            return await this.grantsService.getAdaptiveConfig(target);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to fetch adaptive config', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AgentProxyController = AgentProxyController;
__decorate([
    (0, common_1.Post)(':provider'),
    (0, swagger_1.ApiOperation)({
        summary: 'Proxy LLM requests for agents using scoped grant tokens (provider keys remain server-side)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Provider response (proxied)' }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentProxyController.prototype, "proxy", null);
__decorate([
    (0, common_1.Post)('adaptive/:target'),
    (0, swagger_1.ApiOperation)({
        summary: 'Adaptive middleware proxy: resolve provider/model from centralized routing (global + target override) with automatic fallback',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Provider response (proxied via adaptive routing)' }),
    __param(0, (0, common_1.Param)('target')),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentProxyController.prototype, "adaptiveProxy", null);
__decorate([
    (0, common_1.Get)('adaptive/config/:target'),
    (0, swagger_1.ApiOperation)({
        summary: 'Read-only effective adaptive routing config for a target (no token required): returns primary/fallback provider+model',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Resolved adaptive routing config' }),
    __param(0, (0, common_1.Param)('target')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentProxyController.prototype, "adaptiveConfig", null);
exports.AgentProxyController = AgentProxyController = __decorate([
    (0, swagger_1.ApiTags)('agent-proxy'),
    (0, common_1.Controller)('agent-proxy'),
    __metadata("design:paramtypes", [agent_api_grants_service_1.AgentApiGrantsService])
], AgentProxyController);
//# sourceMappingURL=agent-proxy.controller.js.map