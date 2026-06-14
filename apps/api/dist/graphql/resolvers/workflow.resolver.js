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
exports.WorkflowResolver = void 0;
// @ts-nocheck
/**
 * Workflow Resolver - Migrated to Drizzle ORM
 * GraphQL resolver for Workflow type queries and mutations
 */
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const database_1 = require("@the-new-fuse/database");
const gql_auth_guard_1 = require("../guards/gql-auth.guard");
const user_loader_1 = require("../loaders/user.loader");
const workflow_loader_1 = require("../loaders/workflow.loader");
const input_types_1 = require("../types/input.types");
const user_type_1 = require("../types/user.type");
const workflow_step_type_1 = require("../types/workflow-step.type");
const workflow_type_1 = require("../types/workflow.type");
let WorkflowResolver = class WorkflowResolver {
    constructor(db, userLoader, workflowLoader) {
        this.db = db;
        this.userLoader = userLoader;
        this.workflowLoader = workflowLoader;
    }
    async workflow(id) {
        return this.db.workflows.findWorkflowById(id);
    }
    async workflows(userIdArg, context) {
        const userId = userIdArg || context?.req?.user?.id;
        if (userId) {
            return this.db.workflows.findWorkflowsByCreatorId(userId);
        }
        // Use findActiveWorkflows as a fallback for finding all workflows
        // Passing undefined userId will fail if it's strictly required
        return this.db.workflows.findActiveWorkflows(userId);
    }
    async createWorkflow(input, context) {
        const userId = context.req.user?.id;
        const creator = await this.db.users.findById(userId);
        if (!creator) {
            throw new Error('User not found');
        }
        const workflowData = {
            name: input.name,
            description: input.description,
            variables: input.variables ? JSON.parse(input.variables) : {},
            triggers: input.triggers ? JSON.parse(input.triggers) : [],
            creatorId: creator.id,
            isActive: true,
            executionCount: 0,
        };
        return this.db.workflows.createWorkflow(workflowData);
    }
    async executeWorkflow(input, context) {
        const workflow = await this.db.workflows.findWorkflowById(input.workflowId);
        if (!workflow) {
            throw new Error('Workflow not found');
        }
        // Increment execution count
        await this.db.workflows.incrementExecutionCount(input.workflowId);
        // Update workflow with new execution status
        const updatedWorkflow = await this.db.workflows.updateWorkflow(input.workflowId, {
            statistics: {
                ...(workflow.statistics || {}),
                lastExecutionStatus: 'started',
            },
        });
        // In a real implementation, you would:
        // 1. Queue the workflow for execution
        // 2. Execute steps in order
        // 3. Update statistics upon completion
        return updatedWorkflow || workflow;
    }
    async creator(workflow) {
        if (workflow.creatorId) {
            return this.userLoader.load(workflow.creatorId);
        }
        return null;
    }
    async steps(workflow) {
        return this.workflowLoader.loadStepsByWorkflowId(workflow.id);
    }
    status(workflow) {
        const statistics = workflow.statistics;
        const lastStatus = statistics?.lastExecutionStatus;
        if (!lastStatus)
            return workflow_type_1.WorkflowStatus.IDLE;
        if (lastStatus === 'running')
            return workflow_type_1.WorkflowStatus.RUNNING;
        if (lastStatus === 'completed')
            return workflow_type_1.WorkflowStatus.COMPLETED;
        if (lastStatus === 'failed')
            return workflow_type_1.WorkflowStatus.FAILED;
        if (lastStatus === 'paused')
            return workflow_type_1.WorkflowStatus.PAUSED;
        return workflow_type_1.WorkflowStatus.IDLE;
    }
    variables(workflow) {
        return workflow.variables ? JSON.stringify(workflow.variables) : null;
    }
    triggers(workflow) {
        return workflow.triggers ? JSON.stringify(workflow.triggers) : null;
    }
    metadata(workflow) {
        return workflow.metadata ? JSON.stringify(workflow.metadata) : null;
    }
};
exports.WorkflowResolver = WorkflowResolver;
__decorate([
    (0, graphql_1.Query)(() => workflow_type_1.WorkflowType, { nullable: true }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkflowResolver.prototype, "workflow", null);
__decorate([
    (0, graphql_1.Query)(() => [workflow_type_1.WorkflowType]),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, graphql_1.Args)('userId', { type: () => graphql_1.ID, nullable: true })),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowResolver.prototype, "workflows", null);
__decorate([
    (0, graphql_1.Mutation)(() => workflow_type_1.WorkflowType),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [input_types_1.CreateWorkflowInput, Object]),
    __metadata("design:returntype", Promise)
], WorkflowResolver.prototype, "createWorkflow", null);
__decorate([
    (0, graphql_1.Mutation)(() => workflow_type_1.WorkflowType),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [input_types_1.ExecuteWorkflowInput, Object]),
    __metadata("design:returntype", Promise)
], WorkflowResolver.prototype, "executeWorkflow", null);
__decorate([
    (0, graphql_1.ResolveField)(() => user_type_1.UserType),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowResolver.prototype, "creator", null);
__decorate([
    (0, graphql_1.ResolveField)(() => [workflow_step_type_1.WorkflowStepType]),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowResolver.prototype, "steps", null);
__decorate([
    (0, graphql_1.ResolveField)(() => workflow_type_1.WorkflowStatus),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", String)
], WorkflowResolver.prototype, "status", null);
__decorate([
    (0, graphql_1.ResolveField)(() => String, { nullable: true }),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], WorkflowResolver.prototype, "variables", null);
__decorate([
    (0, graphql_1.ResolveField)(() => String, { nullable: true }),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], WorkflowResolver.prototype, "triggers", null);
__decorate([
    (0, graphql_1.ResolveField)(() => String, { nullable: true }),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], WorkflowResolver.prototype, "metadata", null);
exports.WorkflowResolver = WorkflowResolver = __decorate([
    (0, graphql_1.Resolver)(() => workflow_type_1.WorkflowType),
    __metadata("design:paramtypes", [database_1.DatabaseService,
        user_loader_1.UserLoader,
        workflow_loader_1.WorkflowLoader])
], WorkflowResolver);
//# sourceMappingURL=workflow.resolver.js.map