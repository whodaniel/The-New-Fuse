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
exports.A2AAuthBrokerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_policy_1 = require("../../../auth/auth-policy");
const secure_auth_guard_1 = require("../../../guards/secure-auth.guard");
const a2a_auth_broker_dto_1 = require("../dto/a2a-auth-broker.dto");
const a2a_auth_broker_service_1 = require("../services/a2a-auth-broker.service");
let A2AAuthBrokerController = class A2AAuthBrokerController {
    constructor(authBrokerService) {
        this.authBrokerService = authBrokerService;
    }
    async requestToken(body, req) {
        return this.authBrokerService.requestToken(body, {
            requesterUserId: req.user?.id,
            ip: this.getClientIp(req),
            runtimeId: body.runtimeId,
        });
    }
    async approve(body, req) {
        this.assertCanApprove(req);
        return this.authBrokerService.approveTokenRequest(body, {
            requesterUserId: req.user?.id,
            ip: this.getClientIp(req),
        });
    }
    async revoke(body, req) {
        this.assertCanManageRevocation(req);
        return this.authBrokerService.revokeTokenOrRequest(body, {
            requesterUserId: req.user?.id,
            ip: this.getClientIp(req),
        });
    }
    async revokeAll(body, req) {
        this.assertCanManageRevocation(req);
        return this.authBrokerService.revokeAllForAgent(body, {
            requesterUserId: req.user?.id,
            ip: this.getClientIp(req),
        });
    }
    async upsertPolicy(agentId, integration, body, req) {
        this.assertCanManagePolicies(req);
        return this.authBrokerService.upsertPolicy(agentId, integration, body, req.user?.id || 'system');
    }
    async getPolicy(agentId, integration) {
        const policy = await this.authBrokerService.getPolicy(agentId, integration);
        return {
            found: Boolean(policy),
            policy,
        };
    }
    async authorizeToken(authorization, body, req) {
        if (!authorization) {
            throw new common_1.ForbiddenException('Authorization header is required');
        }
        return this.authBrokerService.authorizeAgentToken({
            bearerToken: authorization,
            ...body,
        }, {
            ip: this.getClientIp(req),
            runtimeId: body.runtimeId,
        });
    }
    assertCanApprove(req) {
        if ((0, auth_policy_1.isPrivilegedUser)(req.user || {})) {
            return;
        }
        if ((0, auth_policy_1.hasPermission)(req.user || {}, 'auth:approve')) {
            return;
        }
        throw new common_1.ForbiddenException('Approving broker tokens requires elevated privileges');
    }
    assertCanManageRevocation(req) {
        if ((0, auth_policy_1.isPrivilegedUser)(req.user || {})) {
            return;
        }
        if ((0, auth_policy_1.hasPermission)(req.user || {}, 'auth:revoke')) {
            return;
        }
        throw new common_1.ForbiddenException('Revoking broker tokens requires elevated privileges');
    }
    assertCanManagePolicies(req) {
        if ((0, auth_policy_1.isPrivilegedUser)(req.user || {})) {
            return;
        }
        if ((0, auth_policy_1.hasPermission)(req.user || {}, 'auth:policy:write')) {
            return;
        }
        throw new common_1.ForbiddenException('Managing broker policies requires elevated privileges');
    }
    getClientIp(req) {
        return (req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
            req.ip ||
            'unknown');
    }
};
exports.A2AAuthBrokerController = A2AAuthBrokerController;
__decorate([
    (0, common_1.Post)('request-token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create an auth token request for an agent/integration action with scoped access',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Auth token request processed' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [a2a_auth_broker_dto_1.RequestAgentTokenDto, Object]),
    __metadata("design:returntype", Promise)
], A2AAuthBrokerController.prototype, "requestToken", null);
__decorate([
    (0, common_1.Post)('approve'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a pending auth token request (step-up path)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request approved and token issued' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [a2a_auth_broker_dto_1.ApproveAgentTokenRequestDto, Object]),
    __metadata("design:returntype", Promise)
], A2AAuthBrokerController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)('revoke'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke a token by tokenId or requestId' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token revoked' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [a2a_auth_broker_dto_1.RevokeAgentTokenDto, Object]),
    __metadata("design:returntype", Promise)
], A2AAuthBrokerController.prototype, "revoke", null);
__decorate([
    (0, common_1.Post)('revoke-all'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Revoke all active broker tokens for an agent (optionally per integration)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent tokens revoked' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [a2a_auth_broker_dto_1.RevokeAllAgentTokensDto, Object]),
    __metadata("design:returntype", Promise)
], A2AAuthBrokerController.prototype, "revokeAll", null);
__decorate([
    (0, common_1.Put)('policies/:agentId/:integration'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Upsert auth broker policy for agent+integration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Policy saved' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Param)('integration')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, a2a_auth_broker_dto_1.UpsertAuthBrokerPolicyDto, Object]),
    __metadata("design:returntype", Promise)
], A2AAuthBrokerController.prototype, "upsertPolicy", null);
__decorate([
    (0, common_1.Get)('policies/:agentId/:integration'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Get auth broker policy for agent+integration (supports wildcard keys)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Policy returned when found' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Param)('integration')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], A2AAuthBrokerController.prototype, "getPolicy", null);
__decorate([
    (0, common_1.Post)('tokens/authorize'),
    (0, swagger_1.ApiOperation)({ summary: 'Authorize and consume a broker token for an integration action' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token authorized' }),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, a2a_auth_broker_dto_1.AuthorizeAgentTokenDto, Object]),
    __metadata("design:returntype", Promise)
], A2AAuthBrokerController.prototype, "authorizeToken", null);
exports.A2AAuthBrokerController = A2AAuthBrokerController = __decorate([
    (0, swagger_1.ApiTags)('a2a-auth-broker'),
    (0, common_1.Controller)('a2a/auth'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.USER),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [a2a_auth_broker_service_1.A2AAuthBrokerService])
], A2AAuthBrokerController);
//# sourceMappingURL=a2a-auth-broker.controller.js.map