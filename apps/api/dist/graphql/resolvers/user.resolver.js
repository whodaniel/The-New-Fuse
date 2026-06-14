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
exports.UserResolver = void 0;
/**
 * User Resolver - Migrated to Drizzle ORM
 * GraphQL resolver for User type queries and mutations
 */
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const database_1 = require("@the-new-fuse/database");
const gql_auth_guard_1 = require("../guards/gql-auth.guard");
const agent_loader_1 = require("../loaders/agent.loader");
const workflow_loader_1 = require("../loaders/workflow.loader");
const agent_type_1 = require("../types/agent.type");
const user_type_1 = require("../types/user.type");
const workflow_type_1 = require("../types/workflow.type");
let UserResolver = class UserResolver {
    constructor(db, agentLoader, workflowLoader) {
        this.db = db;
        this.agentLoader = agentLoader;
        this.workflowLoader = workflowLoader;
    }
    async user(id) {
        return this.db.users.findById(id);
    }
    async me(context) {
        const userId = context.req.user?.id;
        if (!userId)
            return null;
        return this.db.users.findById(userId);
    }
    async users() {
        return this.db.users.findAll(100);
    }
    async agents(user) {
        return this.agentLoader.loadByUserId(user.id);
    }
    async workflows(user) {
        return this.workflowLoader.loadByUserId(user.id);
    }
    fullName(user) {
        // Drizzle schema uses 'name' field instead of firstName/lastName
        return user.name || null;
    }
    preferences(user) {
        return user.preferences ? JSON.stringify(user.preferences) : null;
    }
    metadata(user) {
        // Use settings if metadata is not available in schema
        const settings = user.settings;
        return settings ? JSON.stringify(settings) : null;
    }
};
exports.UserResolver = UserResolver;
__decorate([
    (0, graphql_1.Query)(() => user_type_1.UserType, { nullable: true }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "user", null);
__decorate([
    (0, graphql_1.Query)(() => user_type_1.UserType, { nullable: true }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "me", null);
__decorate([
    (0, graphql_1.Query)(() => [user_type_1.UserType]),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "users", null);
__decorate([
    (0, graphql_1.ResolveField)(() => [agent_type_1.AgentType]),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "agents", null);
__decorate([
    (0, graphql_1.ResolveField)(() => [workflow_type_1.WorkflowType]),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "workflows", null);
__decorate([
    (0, graphql_1.ResolveField)(() => String, { nullable: true }),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], UserResolver.prototype, "fullName", null);
__decorate([
    (0, graphql_1.ResolveField)(() => String, { nullable: true }),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], UserResolver.prototype, "preferences", null);
__decorate([
    (0, graphql_1.ResolveField)(() => String, { nullable: true }),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], UserResolver.prototype, "metadata", null);
exports.UserResolver = UserResolver = __decorate([
    (0, graphql_1.Resolver)(() => user_type_1.UserType),
    __metadata("design:paramtypes", [database_1.DatabaseService,
        agent_loader_1.AgentLoader,
        workflow_loader_1.WorkflowLoader])
], UserResolver);
//# sourceMappingURL=user.resolver.js.map