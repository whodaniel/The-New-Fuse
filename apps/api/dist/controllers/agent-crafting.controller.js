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
var AgentCraftingController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCraftingController = exports.TEMPERAMENTS = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const database_1 = require("@the-new-fuse/database");
const auth_policy_1 = require("../auth/auth-policy");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
// Mirroring the constants from apps/casin8-games/swarm/agent-strategy/index.mjs
exports.TEMPERAMENTS = {
    TIGHT_AGGRESSIVE: 'tight_aggressive',
    LOOSE_AGGRESSIVE: 'loose_aggressive',
    TIGHT_PASSIVE: 'tight_passive',
    BALANCED: 'balanced',
};
let AgentCraftingController = AgentCraftingController_1 = class AgentCraftingController {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(AgentCraftingController_1.name);
    }
    async getTemplates(user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            // In a real scenario, we would filter based on user membership levels
            return [
                {
                    id: exports.TEMPERAMENTS.BALANCED,
                    name: 'Balanced (GTO)',
                    description: 'A solid, reliable strategy that avoids major mistakes.',
                    minLevel: 'FREE',
                },
                {
                    id: exports.TEMPERAMENTS.TIGHT_AGGRESSIVE,
                    name: 'Tight Aggressive (TAG)',
                    description: 'Plays few hands but plays them strongly.',
                    minLevel: 'PREMIUM',
                },
                {
                    id: exports.TEMPERAMENTS.LOOSE_AGGRESSIVE,
                    name: 'Loose Aggressive (LAG)',
                    description: 'High variance, high pressure strategy.',
                    minLevel: 'WHALE',
                },
            ];
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to get templates', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async craftAgent(workspaceId, body, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            await this.assertWorkspaceAccess(workspaceId, user);
            const temperament = body.temperament || exports.TEMPERAMENTS.BALANCED;
            // Create the agent using the standard agent repository
            const agent = await this.db.agents.create({
                name: body.name,
                description: body.description || `Poker Agent (${temperament})`,
                type: 'poker',
                userId: user.id,
                config: {
                    poker: {
                        temperament,
                        nurtureStage: 'bootstrap',
                        maxRiskBps: 800,
                    },
                },
                status: 'INACTIVE',
            });
            // Explicitly link to workspace via metadata JSONB field
            await this.db.agents.upsertMetadata(agent.id, {
                metadata: {
                    workspaceId,
                    tenantId: user.tenantId,
                    craftedAt: new Date().toISOString(),
                    craftedBy: user.id,
                },
            });
            return agent;
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to craft agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async initializeNurture(agentId, body, user) {
        if (!user || !user.id) {
            throw new common_1.HttpException('Authentication required', common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            await this.assertWorkspaceAccess(body.workspaceId, user);
            const agent = await this.db.agents.findById(agentId);
            if (!agent)
                throw new common_1.NotFoundException('Agent not found');
            // Update agent config with nurture program defaults
            const updatedConfig = {
                ...agent.config,
                poker: {
                    ...agent.config?.poker,
                    nurtureProgram: {
                        targetBbps: 2.0,
                        episodes: 0,
                        startedAt: new Date().toISOString(),
                    },
                },
            };
            return await this.db.agents.update(agentId, { config: updatedConfig });
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Failed to initialize nurture', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async assertWorkspaceAccess(workspaceId, user) {
        const privileged = (0, auth_policy_1.isPrivilegedUser)(user || {});
        const workspace = await this.db.workspaces.findByIdWithOwner(workspaceId);
        if (!workspace) {
            throw new common_1.NotFoundException('Workspace not found');
        }
        if (!privileged && workspace.ownerId !== user?.id) {
            const membership = await this.db.workspaceMembers.findMembership(workspaceId, user.id);
            if (!membership) {
                throw new common_1.ForbiddenException('Workspace access denied');
            }
        }
    }
};
exports.AgentCraftingController = AgentCraftingController;
__decorate([
    (0, common_1.Get)('templates'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available agent strategy templates' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentCraftingController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Post)('craft/:workspaceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Craft a new poker agent within a workspace' }),
    __param(0, (0, common_1.Param)('workspaceId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentCraftingController.prototype, "craftAgent", null);
__decorate([
    (0, common_1.Post)('nurture/:agentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Initialize or update a nurture program for an agent' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgentCraftingController.prototype, "initializeNurture", null);
exports.AgentCraftingController = AgentCraftingController = AgentCraftingController_1 = __decorate([
    (0, swagger_1.ApiTags)('agent-crafting'),
    (0, common_1.Controller)('agent-crafting'),
    (0, secure_auth_guard_1.JwtAuth)(),
    (0, secure_auth_guard_1.SetRateLimitTier)(secure_auth_guard_1.RateLimitTier.API),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], AgentCraftingController);
//# sourceMappingURL=agent-crafting.controller.js.map