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
exports.AgentResolver = void 0;
// @ts-nocheck
/**
 * Agent Resolver - Migrated to Drizzle ORM
 * GraphQL resolver for Agent type queries and mutations
 */
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const database_1 = require("@the-new-fuse/database");
const gql_auth_guard_1 = require("../guards/gql-auth.guard");
const user_loader_1 = require("../loaders/user.loader");
const agent_type_1 = require("../types/agent.type");
const input_types_1 = require("../types/input.types");
const user_type_1 = require("../types/user.type");
const auth_policy_1 = require("../../auth/auth-policy");
let AgentResolver = class AgentResolver {
    constructor(db, userLoader) {
        this.db = db;
        this.userLoader = userLoader;
    }
    async agent(id, context) {
        const userId = context.req.user?.id;
        return this.db.agents.findById(id, userId);
    }
    async agents(userIdArg, context) {
        const currentUser = context?.req?.user;
        const userId = userIdArg || currentUser?.id;
        if (userId) {
            if (userIdArg && userIdArg !== currentUser?.id && !(0, auth_policy_1.isPrivilegedUser)(currentUser || {})) {
                throw new common_1.ForbiddenException('Not authorized to query agents for another user');
            }
            return this.db.agents.findByUserId(userId);
        }
        // If no userId provided and no user in context, we still need a userId for findAll
        // but this case should be guarded by GqlAuthGuard
        return this.db.agents.findAll(userId, 100);
    }
    async createAgent(input, context) {
        const userId = context.req.user?.id;
        const owner = await this.db.users.findById(userId);
        if (!owner) {
            throw new Error('User not found');
        }
        const agentData = {
            name: input.name,
            type: input.type,
            description: input.description,
            capabilities: input.capabilities || [],
            config: input.config ? JSON.parse(input.config) : {},
            userId: owner.id,
        };
        return this.db.agents.create(agentData);
    }
    async updateAgent(input, context) {
        const userId = context.req.user?.id;
        const agent = await this.db.agents.findById(input.id, userId);
        if (!agent) {
            throw new Error('Agent not found');
        }
        const updates = {};
        if (input.name !== undefined)
            updates.name = input.name;
        if (input.description !== undefined)
            updates.description = input.description;
        if (input.capabilities !== undefined)
            updates.capabilities = input.capabilities;
        const updated = await this.db.agents.update(input.id, userId, updates);
        if (!updated) {
            throw new Error('Failed to update agent');
        }
        return updated;
    }
    async owner(agent) {
        if (agent.userId) {
            return this.userLoader.load(agent.userId);
        }
        return null;
    }
    status(agent) {
        // Check agent status field if available, otherwise use defaults
        const agentStatus = agent.status;
        if (agentStatus === 'INACTIVE' || agentStatus === 'OFFLINE') {
            return agent_type_1.AgentStatus.INACTIVE;
        }
        // Use updatedAt as a proxy for last activity if lastActiveAt doesn't exist
        const lastActive = agent.lastActiveAt || agent.updatedAt;
        if (!lastActive)
            return agent_type_1.AgentStatus.ACTIVE;
        const minutesSinceActive = (Date.now() - new Date(lastActive).getTime()) / 1000 / 60;
        if (minutesSinceActive > 30)
            return agent_type_1.AgentStatus.INACTIVE;
        return agent_type_1.AgentStatus.ACTIVE;
    }
    config(agent) {
        return agent.config ? JSON.stringify(agent.config) : null;
    }
    metadata(agent) {
        // Use a type assertion since metadata may not exist in the minimal Agent type
        const agentMetadata = agent.metadata;
        return agentMetadata ? JSON.stringify(agentMetadata) : null;
    }
};
exports.AgentResolver = AgentResolver;
__decorate([
    (0, graphql_1.Query)(() => agent_type_1.AgentType, { nullable: true }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentResolver.prototype, "agent", null);
__decorate([
    (0, graphql_1.Query)(() => [agent_type_1.AgentType]),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, graphql_1.Args)('userId', { type: () => graphql_1.ID, nullable: true })),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentResolver.prototype, "agents", null);
__decorate([
    (0, graphql_1.Mutation)(() => agent_type_1.AgentType),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [input_types_1.CreateAgentInput, Object]),
    __metadata("design:returntype", Promise)
], AgentResolver.prototype, "createAgent", null);
__decorate([
    (0, graphql_1.Mutation)(() => agent_type_1.AgentType),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [input_types_1.UpdateAgentInput, Object]),
    __metadata("design:returntype", Promise)
], AgentResolver.prototype, "updateAgent", null);
__decorate([
    (0, graphql_1.ResolveField)(() => user_type_1.UserType),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentResolver.prototype, "owner", null);
__decorate([
    (0, graphql_1.ResolveField)(() => agent_type_1.AgentStatus),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", String)
], AgentResolver.prototype, "status", null);
__decorate([
    (0, graphql_1.ResolveField)(() => String, { nullable: true }),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], AgentResolver.prototype, "config", null);
__decorate([
    (0, graphql_1.ResolveField)(() => String, { nullable: true }),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], AgentResolver.prototype, "metadata", null);
exports.AgentResolver = AgentResolver = __decorate([
    (0, graphql_1.Resolver)(() => agent_type_1.AgentType),
    __metadata("design:paramtypes", [database_1.DatabaseService,
        user_loader_1.UserLoader])
], AgentResolver);
//# sourceMappingURL=agent.resolver.js.map