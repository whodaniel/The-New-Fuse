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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MassController = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("@the-new-fuse/types");
const mass_orchestration_service_1 = require("./mass-orchestration.service");
const prompt_optimizer_service_1 = require("./prompt-optimizer.service");
const topology_optimizer_service_1 = require("./topology-optimizer.service");
const workflow_prompt_optimizer_service_1 = require("./workflow-prompt-optimizer.service");
const aggregate_service_1 = require("./building-blocks/aggregate.service");
const reflect_service_1 = require("./building-blocks/reflect.service");
const debate_service_1 = require("./building-blocks/debate.service");
const passport_1 = require("@nestjs/passport");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let MassController = class MassController {
    massOrchestration;
    promptOptimizer;
    topologyOptimizer;
    workflowOptimizer;
    aggregateService;
    reflectService;
    debateService;
    constructor(massOrchestration, promptOptimizer, topologyOptimizer, workflowOptimizer, aggregateService, reflectService, debateService) {
        this.massOrchestration = massOrchestration;
        this.promptOptimizer = promptOptimizer;
        this.topologyOptimizer = topologyOptimizer;
        this.workflowOptimizer = workflowOptimizer;
        this.aggregateService = aggregateService;
        this.reflectService = reflectService;
        this.debateService = debateService;
    }
    // Stage 1: Block-Level Prompt Optimization
    async optimizeAgentPrompt(agentId, config, user) {
        const optimizationConfig = { ...config, userId: user.id };
        const job = await this.massOrchestration.optimizeAgentPrompt(agentId, optimizationConfig);
        return { job };
    }
    // Stage 2: Topology Optimization
    async optimizeTopology(request, user) {
        const config = { ...request.config, userId: user.id };
        const job = await this.massOrchestration.optimizeWorkflowTopology(request.agentIds, config);
        return { job };
    }
    // Stage 3: Workflow-Level Prompt Optimization
    async optimizeWorkflowPrompts(topologyId, config, user) {
        const optimizationConfig = { ...config, userId: user.id };
        const job = await this.massOrchestration.optimizeWorkflowPrompts(topologyId, optimizationConfig);
        return { job };
    }
    // Full MASS Pipeline
    async runFullOptimization(request, user) {
        const config = { ...request.config, userId: user.id };
        return this.massOrchestration.runFullMassOptimization(request.agentIds, config);
    }
    // Create optimized agent copy
    async createOptimizedAgent(agentId, config, user) {
        const optimizationConfig = { ...config, userId: user.id };
        return this.massOrchestration.createOptimizedAgent(agentId, optimizationConfig);
    }
    // Get optimization job status
    async getOptimizationJob(jobId) {
        return this.massOrchestration.getOptimizationJob(jobId);
    }
    // Get user's optimization jobs
    async getUserOptimizationJobs(user, status, type) {
        const jobs = await this.massOrchestration.getUserOptimizationJobs(user.id, status, type);
        return { jobs };
    }
    // Get agent optimization history
    async getAgentOptimizationHistory(agentId, user) {
        return this.massOrchestration.getAgentOptimizationHistory(agentId, user.id);
    }
    // Execute MASS building blocks
    async executeAggregate(request, user) {
        return this.aggregateService.execute(request.agentIds, request.input, {
            aggregationStrategy: request.aggregationStrategy,
            parallelExecution: request.parallelExecution || true,
            userId: user.id
        });
    }
    async executeReflect(request, user) {
        return this.reflectService.execute(request.predictorAgentId, request.reflectorAgentId, request.input, {
            maxRounds: request.maxRounds || 3,
            userId: user.id
        });
    }
    async executeDebate(request, user) {
        return this.debateService.execute(request.debaterAgentIds, request.input, {
            debateRounds: request.debateRounds || 3,
            votingStrategy: request.votingStrategy || 'majority',
            userId: user.id
        });
    }
    // Validation and testing endpoints
    async createValidationDataset(request, user) {
        // Implementation would create validation dataset
        return { datasetId: 'temp-dataset-id' };
    }
    async getUserValidationDatasets(user) {
        // Implementation would return user's validation datasets
        return { datasets: [] };
    }
    // Performance analytics
    async getAgentPerformanceAnalytics(agentId, user, timeRange) {
        // Implementation would return performance analytics
        return {
            performanceHistory: [],
            improvementTrend: 0,
            averageMetrics: {}
        };
    }
    async getTopologyPerformanceAnalytics(topologyId, user) {
        // Implementation would return topology analytics
        return {
            nodePerformance: {},
            bottlenecks: [],
            optimizationSuggestions: []
        };
    }
    // Export/Import optimized configurations
    async exportOptimizedAgent(agentId, user) {
        // Implementation would export agent configuration
        return { exportData: {} };
    }
    async importOptimizedAgent(importData, user) {
        // Implementation would import agent configuration
        return { importedAgentId: 'temp-agent-id' };
    }
    async exportOptimizedTopology(topologyId, user) {
        // Implementation would export topology configuration
        return { exportData: {} };
    }
    async importOptimizedTopology(importData, user) {
        // Implementation would import topology configuration
        return { importedTopologyId: 'temp-topology-id' };
    }
};
exports.MassController = MassController;
__decorate([
    (0, common_1.Post)('optimize/agent/:agentId'),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof types_1.MassOptimizationConfig !== "undefined" && types_1.MassOptimizationConfig) === "function" ? _d : Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "optimizeAgentPrompt", null);
__decorate([
    (0, common_1.Post)('optimize/topology'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "optimizeTopology", null);
__decorate([
    (0, common_1.Post)('optimize/workflow/:topologyId'),
    __param(0, (0, common_1.Param)('topologyId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_e = typeof types_1.MassOptimizationConfig !== "undefined" && types_1.MassOptimizationConfig) === "function" ? _e : Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "optimizeWorkflowPrompts", null);
__decorate([
    (0, common_1.Post)('optimize/full'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "runFullOptimization", null);
__decorate([
    (0, common_1.Post)('agents/:agentId/create-optimized'),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_f = typeof types_1.MassOptimizationConfig !== "undefined" && types_1.MassOptimizationConfig) === "function" ? _f : Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "createOptimizedAgent", null);
__decorate([
    (0, common_1.Get)('jobs/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "getOptimizationJob", null);
__decorate([
    (0, common_1.Get)('jobs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "getUserOptimizationJobs", null);
__decorate([
    (0, common_1.Get)('agents/:agentId/history'),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "getAgentOptimizationHistory", null);
__decorate([
    (0, common_1.Post)('execute/aggregate'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "executeAggregate", null);
__decorate([
    (0, common_1.Post)('execute/reflect'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "executeReflect", null);
__decorate([
    (0, common_1.Post)('execute/debate'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "executeDebate", null);
__decorate([
    (0, common_1.Post)('validate/dataset'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "createValidationDataset", null);
__decorate([
    (0, common_1.Get)('validate/datasets'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "getUserValidationDatasets", null);
__decorate([
    (0, common_1.Get)('analytics/performance/:agentId'),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('timeRange')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "getAgentPerformanceAnalytics", null);
__decorate([
    (0, common_1.Get)('analytics/topology/:topologyId'),
    __param(0, (0, common_1.Param)('topologyId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "getTopologyPerformanceAnalytics", null);
__decorate([
    (0, common_1.Get)('export/agent/:agentId'),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "exportOptimizedAgent", null);
__decorate([
    (0, common_1.Post)('import/agent'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "importOptimizedAgent", null);
__decorate([
    (0, common_1.Get)('export/topology/:topologyId'),
    __param(0, (0, common_1.Param)('topologyId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "exportOptimizedTopology", null);
__decorate([
    (0, common_1.Post)('import/topology'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "importOptimizedTopology", null);
exports.MassController = MassController = __decorate([
    (0, common_1.Controller)('mass'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [mass_orchestration_service_1.MassOrchestrationService,
        prompt_optimizer_service_1.PromptOptimizerService,
        topology_optimizer_service_1.TopologyOptimizerService,
        workflow_prompt_optimizer_service_1.WorkflowPromptOptimizerService, typeof (_a = typeof aggregate_service_1.AggregateService !== "undefined" && aggregate_service_1.AggregateService) === "function" ? _a : Object, typeof (_b = typeof reflect_service_1.ReflectService !== "undefined" && reflect_service_1.ReflectService) === "function" ? _b : Object, typeof (_c = typeof debate_service_1.DebateService !== "undefined" && debate_service_1.DebateService) === "function" ? _c : Object])
], MassController);
