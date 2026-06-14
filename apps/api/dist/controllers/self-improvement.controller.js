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
var SelfImprovementController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfImprovementController = void 0;
const common_1 = require("@nestjs/common");
const coordinator_service_1 = require("../agents/coordinator.service");
const analyzer_service_1 = require("../agents/analyzer.service");
const architect_service_1 = require("../agents/architect.service");
const implementer_service_1 = require("../agents/implementer.service");
const reviewer_service_1 = require("../agents/reviewer.service");
let SelfImprovementController = SelfImprovementController_1 = class SelfImprovementController {
    constructor(coordinator, analyzer, architect, implementer, reviewer) {
        this.coordinator = coordinator;
        this.analyzer = analyzer;
        this.architect = architect;
        this.implementer = implementer;
        this.reviewer = reviewer;
        this.logger = new common_1.Logger(SelfImprovementController_1.name);
    }
    async startCycle() {
        this.logger.log('Starting self-improvement cycle via API...');
        const cycle = await this.coordinator.startSelfImprovementCycle();
        return {
            success: true,
            cycleId: cycle.id,
            status: cycle.status,
            message: 'Self-improvement cycle started',
        };
    }
    async getCycleStatus() {
        const cycle = await this.coordinator.getCurrentCycle();
        if (!cycle) {
            return {
                active: false,
                message: 'No active cycle',
            };
        }
        const progress = await this.coordinator.trackProgress();
        return {
            active: true,
            cycleId: cycle.id,
            status: cycle.status,
            phase: cycle.phase,
            progress,
            metrics: cycle.metrics,
        };
    }
    async getCycleReport() {
        try {
            const report = await this.coordinator.getCycleReport();
            return {
                success: true,
                report,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async getChatHistory() {
        const chatHistory = await this.coordinator.getChatHistory();
        return {
            success: true,
            messages: chatHistory,
            count: chatHistory.length,
        };
    }
    async runAnalysis() {
        this.logger.log('Running codebase analysis...');
        const report = await this.analyzer.scanCodebase();
        return {
            success: true,
            analysis: {
                totalIssues: report.issues.length,
                criticalIssues: report.metrics.criticalIssues,
                highIssues: report.metrics.highIssues,
                technicalDebtScore: report.metrics.technicalDebtScore,
                topIssues: report.prioritizedIssues.slice(0, 5),
            },
        };
    }
    async reviewArchitecture() {
        this.logger.log('Running architecture review...');
        const review = await this.architect.reviewArchitecture();
        return {
            success: true,
            review: {
                decisions: review.decisions.length,
                missingFeatures: review.missingFeatures,
                topDecisions: review.decisions.slice(0, 5),
                capabilities: review.capabilities,
            },
        };
    }
    async implement(body) {
        this.logger.log('Implementing improvement...');
        const result = await this.implementer.implementQuickFix(body.issue);
        return {
            success: result.success,
            implementation: result,
        };
    }
    async review(body) {
        this.logger.log('Reviewing implementation...');
        const review = await this.reviewer.reviewImplementation(body.implementation);
        return {
            success: true,
            review: {
                approved: review.approved,
                score: review.score,
                decision: review.decision,
                feedback: review.feedback,
                criticalIssues: review.securityIssues.filter(s => s.severity === 'critical').length,
            },
        };
    }
    async getAgentsStatus() {
        return {
            success: true,
            agents: [
                {
                    name: 'Analyzer',
                    status: 'active',
                    description: 'Scans codebase for issues and generates improvement suggestions',
                },
                {
                    name: 'Architect',
                    status: 'active',
                    description: 'Reviews architecture and suggests refactoring opportunities',
                },
                {
                    name: 'Implementer',
                    status: 'active',
                    description: 'Implements approved improvements and creates tests',
                },
                {
                    name: 'Reviewer',
                    status: 'active',
                    description: 'Reviews code for bugs, security issues, and quality',
                },
                {
                    name: 'Coordinator',
                    status: 'active',
                    description: 'Orchestrates the entire self-improvement workflow',
                },
            ],
        };
    }
};
exports.SelfImprovementController = SelfImprovementController;
__decorate([
    (0, common_1.Post)('cycle/start'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SelfImprovementController.prototype, "startCycle", null);
__decorate([
    (0, common_1.Get)('cycle/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SelfImprovementController.prototype, "getCycleStatus", null);
__decorate([
    (0, common_1.Get)('cycle/report'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SelfImprovementController.prototype, "getCycleReport", null);
__decorate([
    (0, common_1.Get)('chat'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SelfImprovementController.prototype, "getChatHistory", null);
__decorate([
    (0, common_1.Post)('analyze'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SelfImprovementController.prototype, "runAnalysis", null);
__decorate([
    (0, common_1.Post)('architecture'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SelfImprovementController.prototype, "reviewArchitecture", null);
__decorate([
    (0, common_1.Post)('implement'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SelfImprovementController.prototype, "implement", null);
__decorate([
    (0, common_1.Post)('review'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SelfImprovementController.prototype, "review", null);
__decorate([
    (0, common_1.Get)('agents/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SelfImprovementController.prototype, "getAgentsStatus", null);
exports.SelfImprovementController = SelfImprovementController = SelfImprovementController_1 = __decorate([
    (0, common_1.Controller)('self-improvement'),
    __metadata("design:paramtypes", [coordinator_service_1.CoordinatorAgentService,
        analyzer_service_1.AnalyzerAgentService,
        architect_service_1.ArchitectAgentService,
        implementer_service_1.ImplementerAgentService,
        reviewer_service_1.ReviewerAgentService])
], SelfImprovementController);
//# sourceMappingURL=self-improvement.controller.js.map