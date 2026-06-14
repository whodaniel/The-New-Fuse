"use strict";
/**
 * Browser Hub Swarm Controller
 *
 * REST API for controlling the Browser Hub Improvement Agent Swarm.
 */
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
var BrowserHubSwarmController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserHubSwarmController = void 0;
const common_1 = require("@nestjs/common");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const browser_hub_swarm_service_1 = require("./browser-hub-swarm.service");
let BrowserHubSwarmController = BrowserHubSwarmController_1 = class BrowserHubSwarmController {
    constructor(swarmService) {
        this.swarmService = swarmService;
        this.logger = new common_1.Logger(BrowserHubSwarmController_1.name);
    }
    /**
     * Get current swarm status
     */
    getStatus() {
        return this.swarmService.getStatus();
    }
    /**
     * Load the Browser Hub codebase for analysis
     */
    async loadCodebase(body) {
        const basePath = body.path || '/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/electron-desktop/src';
        await this.swarmService.loadCodebase(basePath);
        return {
            success: true,
            message: 'Codebase loaded',
            path: basePath,
        };
    }
    /**
     * Run a single iteration of all agents
     */
    async runIteration() {
        this.logger.log('Running single iteration...');
        const status = await this.swarmService.runIteration();
        return status;
    }
    /**
     * Run until target score achieved or max iterations
     */
    async runUntilComplete() {
        this.logger.log('Starting complete improvement campaign...');
        const status = await this.swarmService.runUntilComplete();
        return status;
    }
    /**
     * Get all issues from all agents
     */
    getAllIssues() {
        const issues = this.swarmService.getAllIssues();
        return {
            total: issues.length,
            critical: issues.filter((i) => i.severity === 'critical').length,
            major: issues.filter((i) => i.severity === 'major').length,
            minor: issues.filter((i) => i.severity === 'minor').length,
            issues,
        };
    }
    /**
     * Get all suggestions
     */
    getAllSuggestions() {
        return {
            suggestions: this.swarmService.getAllSuggestions(),
        };
    }
    /**
     * Generate comprehensive improvement plan
     */
    getImprovementPlan() {
        return this.swarmService.generateImprovementPlan();
    }
    /**
     * Run demo analysis of Browser Hub
     */
    async runDemo() {
        this.logger.log('🚀 Starting Browser Hub Swarm Demo...');
        // Load the codebase
        const basePath = '/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/electron-desktop/src';
        await this.swarmService.loadCodebase(basePath);
        // Run one iteration
        const status = await this.swarmService.runIteration();
        // Generate improvement plan
        const plan = this.swarmService.generateImprovementPlan();
        return {
            message: 'Browser Hub Swarm Demo Complete',
            status,
            improvementPlan: plan,
            issues: this.swarmService.getAllIssues(),
            suggestions: this.swarmService.getAllSuggestions(),
        };
    }
};
exports.BrowserHubSwarmController = BrowserHubSwarmController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BrowserHubSwarmController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('load-codebase'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BrowserHubSwarmController.prototype, "loadCodebase", null);
__decorate([
    (0, common_1.Post)('iterate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BrowserHubSwarmController.prototype, "runIteration", null);
__decorate([
    (0, common_1.Post)('run-complete'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BrowserHubSwarmController.prototype, "runUntilComplete", null);
__decorate([
    (0, common_1.Get)('issues'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BrowserHubSwarmController.prototype, "getAllIssues", null);
__decorate([
    (0, common_1.Get)('suggestions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BrowserHubSwarmController.prototype, "getAllSuggestions", null);
__decorate([
    (0, common_1.Get)('improvement-plan'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BrowserHubSwarmController.prototype, "getImprovementPlan", null);
__decorate([
    (0, common_1.Post)('demo'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BrowserHubSwarmController.prototype, "runDemo", null);
exports.BrowserHubSwarmController = BrowserHubSwarmController = BrowserHubSwarmController_1 = __decorate([
    (0, common_1.Controller)('agents/browser-hub-swarm'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.USER),
    __metadata("design:paramtypes", [browser_hub_swarm_service_1.BrowserHubSwarmService])
], BrowserHubSwarmController);
//# sourceMappingURL=browser-hub-swarm.controller.js.map