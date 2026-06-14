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
exports.AgentHandoffController = void 0;
const common_1 = require("@nestjs/common");
// @ts-ignore
// @ts-ignore
const swagger_1 = require("@nestjs/swagger");
const auth_policy_1 = require("../auth/auth-policy");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const agent_handoff_service_1 = require("../services/agent-handoff.service");
let AgentHandoffController = class AgentHandoffController {
    constructor(handoffService) {
        this.handoffService = handoffService;
    }
    async publish(input, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            this.assertCanPublish(user);
            const bodyTenant = this.readTenantFromBody(input);
            const tenantId = this.resolveTenantId(user, bodyTenant);
            return await this.handoffService.publishForTenant(input, tenantId);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to publish handoff', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async listAgentInbox(agentId, user, tenantIdParam, limit, includeAcknowledged) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            this.assertCanReadAgentInbox(user, agentId);
            const tenantId = this.resolveTenantId(user, tenantIdParam);
            const rows = await this.handoffService.listForAgent(agentId, tenantId, {
                limit: limit ?? 20,
                includeAcknowledged: includeAcknowledged === 'true',
            });
            return {
                agentId,
                tenantId,
                count: rows.length,
                items: rows,
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to list agent inbox', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async acknowledge(input, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            this.assertCanAcknowledge(user, input);
            const bodyTenant = this.readTenantFromBody(input);
            const tenantId = this.resolveTenantId(user, bodyTenant);
            return await this.handoffService.acknowledgeForTenant(input, tenantId);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to acknowledge handoff', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async listBySession(sessionKey, user, tenantIdParam, limit) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            this.assertCanReadSession(user);
            const tenantId = this.resolveTenantId(user, tenantIdParam);
            const packets = await this.handoffService.listBySession(sessionKey, tenantId, limit ?? 50);
            return {
                sessionKey,
                tenantId,
                count: packets.length,
                packets,
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to list by session', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPacket(packetId, tenantIdParam, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            this.assertCanReadSession(user);
            const tenantId = this.resolveTenantId(user, tenantIdParam);
            return await this.handoffService.getPacket(packetId, tenantId);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to get packet', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    resolveTenantId(user, requestedTenantId) {
        const userTenantId = typeof user?.tenantId === 'string' && user.tenantId.trim().length > 0
            ? user.tenantId.trim()
            : undefined;
        const paramTenantId = typeof requestedTenantId === 'string' && requestedTenantId.trim().length > 0
            ? requestedTenantId.trim()
            : undefined;
        if (!paramTenantId && !userTenantId) {
            throw new common_1.BadRequestException('tenantId is required');
        }
        if (paramTenantId && userTenantId && paramTenantId !== userTenantId) {
            throw new common_1.BadRequestException('tenantId mismatch with authenticated user tenant scope');
        }
        return paramTenantId || userTenantId;
    }
    readTenantFromBody(input) {
        if (!input || typeof input !== 'object') {
            return undefined;
        }
        const maybeScope = input.scope;
        if (!maybeScope || typeof maybeScope !== 'object') {
            return undefined;
        }
        const tenantId = maybeScope.tenantId;
        return typeof tenantId === 'string' ? tenantId : undefined;
    }
    readAgentIdFromBody(input) {
        if (!input || typeof input !== 'object') {
            return undefined;
        }
        const agentId = input.agentId;
        return typeof agentId === 'string' ? agentId : undefined;
    }
    isPrivileged(user) {
        return (0, auth_policy_1.isPrivilegedUser)(user || {});
    }
    hasPermission(user, permission) {
        return (0, auth_policy_1.hasPermission)(user || {}, permission);
    }
    assertCanPublish(user) {
        if (this.isPrivileged(user) || this.hasPermission(user, 'handoff:publish')) {
            return;
        }
        throw new common_1.ForbiddenException('Publishing handoffs requires admin/system role or handoff:publish');
    }
    assertCanReadAgentInbox(user, agentId) {
        if (this.isPrivileged(user) || this.hasPermission(user, 'handoff:read:any')) {
            return;
        }
        if (user?.id && user.id === agentId) {
            return;
        }
        throw new common_1.ForbiddenException('Reading another agent inbox requires elevated privileges');
    }
    assertCanAcknowledge(user, input) {
        if (this.isPrivileged(user) || this.hasPermission(user, 'handoff:ack:any')) {
            return;
        }
        const requestedAgentId = this.readAgentIdFromBody(input);
        if (requestedAgentId && user?.id && requestedAgentId === user.id) {
            return;
        }
        throw new common_1.ForbiddenException('Acknowledging for another agent requires elevated privileges');
    }
    assertCanReadSession(user) {
        if (this.isPrivileged(user) || this.hasPermission(user, 'handoff:read:any')) {
            return;
        }
        throw new common_1.ForbiddenException('Session-level handoff visibility requires elevated privileges');
    }
};
exports.AgentHandoffController = AgentHandoffController;
__decorate([
    (0, common_1.Post)('publish'),
    (0, swagger_1.ApiOperation)({ summary: 'Publish a targeted handoff packet to one or more agents' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Handoff packet published' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AgentHandoffController.prototype, "publish", null);
__decorate([
    (0, common_1.Get)('agent/:agentId'),
    (0, swagger_1.ApiOperation)({ summary: 'List handoff inbox packets for a specific agent' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent handoff inbox listed' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('tenantId')),
    __param(3, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __param(4, (0, common_1.Query)('includeAcknowledged')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Number, String]),
    __metadata("design:returntype", Promise)
], AgentHandoffController.prototype, "listAgentInbox", null);
__decorate([
    (0, common_1.Post)('ack'),
    (0, swagger_1.ApiOperation)({ summary: 'Acknowledge a handoff packet from a target agent' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Handoff packet acknowledged' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AgentHandoffController.prototype, "acknowledge", null);
__decorate([
    (0, common_1.Get)('session/:sessionKey'),
    (0, swagger_1.ApiOperation)({ summary: 'List handoff packets for a session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session handoff packets listed' }),
    __param(0, (0, common_1.Param)('sessionKey')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('tenantId')),
    __param(3, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Number]),
    __metadata("design:returntype", Promise)
], AgentHandoffController.prototype, "listBySession", null);
__decorate([
    (0, common_1.Get)('packets/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific handoff packet' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Handoff packet retrieved' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('tenantId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AgentHandoffController.prototype, "getPacket", null);
exports.AgentHandoffController = AgentHandoffController = __decorate([
    (0, swagger_1.ApiTags)('agent-handoffs'),
    (0, common_1.Controller)('handoffs'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.USER),
    __metadata("design:paramtypes", [agent_handoff_service_1.AgentHandoffService])
], AgentHandoffController);
//# sourceMappingURL=agent-handoff.controller.js.map