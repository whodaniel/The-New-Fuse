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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MassOptimizationConfig } from '@the-new-fuse/types';
import { MassOrchestrationService } from './mass-orchestration.service';
import { PromptOptimizerService } from './prompt-optimizer.service';
import { TopologyOptimizerService } from './topology-optimizer.service';
import { WorkflowPromptOptimizerService } from './workflow-prompt-optimizer.service';
// import { AggregateService } from './building-blocks/aggregate.service';
// import { ReflectService } from './building-blocks/reflect.service';
// import { DebateService } from './building-blocks/debate.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
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
        return this.aggregateService.execute(request.agentIds.join(','), request.input, {
            aggregationMethod: request.aggregationStrategy,
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
__decorate([
    Post('optimize/agent/:agentId'),
    __param(0, Param('agentId')),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_h = typeof MassOptimizationConfig !== "undefined" && MassOptimizationConfig) === "function" ? _h : Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "optimizeAgentPrompt", null);
__decorate([
    Post('optimize/topology'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "optimizeTopology", null);
__decorate([
    Post('optimize/workflow/:topologyId'),
    __param(0, Param('topologyId')),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_j = typeof MassOptimizationConfig !== "undefined" && MassOptimizationConfig) === "function" ? _j : Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "optimizeWorkflowPrompts", null);
__decorate([
    Post('optimize/full'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "runFullOptimization", null);
__decorate([
    Post('agents/:agentId/create-optimized'),
    __param(0, Param('agentId')),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_k = typeof MassOptimizationConfig !== "undefined" && MassOptimizationConfig) === "function" ? _k : Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "createOptimizedAgent", null);
__decorate([
    Get('jobs/:jobId'),
    __param(0, Param('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "getOptimizationJob", null);
__decorate([
    Get('jobs'),
    __param(0, CurrentUser()),
    __param(1, Query('status')),
    __param(2, Query('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "getUserOptimizationJobs", null);
__decorate([
    Get('agents/:agentId/history'),
    __param(0, Param('agentId')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "getAgentOptimizationHistory", null);
__decorate([
    Post('execute/aggregate'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "executeAggregate", null);
__decorate([
    Post('execute/reflect'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "executeReflect", null);
__decorate([
    Post('execute/debate'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "executeDebate", null);
__decorate([
    Post('validate/dataset'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "createValidationDataset", null);
__decorate([
    Get('validate/datasets'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "getUserValidationDatasets", null);
__decorate([
    Get('analytics/performance/:agentId'),
    __param(0, Param('agentId')),
    __param(1, CurrentUser()),
    __param(2, Query('timeRange')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "getAgentPerformanceAnalytics", null);
__decorate([
    Get('analytics/topology/:topologyId'),
    __param(0, Param('topologyId')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "getTopologyPerformanceAnalytics", null);
__decorate([
    Get('export/agent/:agentId'),
    __param(0, Param('agentId')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "exportOptimizedAgent", null);
__decorate([
    Post('import/agent'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "importOptimizedAgent", null);
__decorate([
    Get('export/topology/:topologyId'),
    __param(0, Param('topologyId')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "exportOptimizedTopology", null);
__decorate([
    Post('import/topology'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MassController.prototype, "importOptimizedTopology", null);
MassController = __decorate([
    Controller('mass'),
    UseGuards(AuthGuard('jwt')),
    __metadata("design:paramtypes", [typeof (_a = typeof MassOrchestrationService !== "undefined" && MassOrchestrationService) === "function" ? _a : Object, typeof (_b = typeof PromptOptimizerService !== "undefined" && PromptOptimizerService) === "function" ? _b : Object, typeof (_c = typeof TopologyOptimizerService !== "undefined" && TopologyOptimizerService) === "function" ? _c : Object, typeof (_d = typeof WorkflowPromptOptimizerService !== "undefined" && WorkflowPromptOptimizerService) === "function" ? _d : Object, typeof (_e = typeof AggregateService !== "undefined" && AggregateService) === "function" ? _e : Object, typeof (_f = typeof ReflectService !== "undefined" && ReflectService) === "function" ? _f : Object, typeof (_g = typeof DebateService !== "undefined" && DebateService) === "function" ? _g : Object])
], MassController);
export { MassController };
//# sourceMappingURL=mass.controller.js.map