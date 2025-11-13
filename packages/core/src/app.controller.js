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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const AgentManager_1 = require("./agents/AgentManager");
const agent_orchestrator_1 = require("./agents/agent-orchestrator");
const simple_cognitive_agent_1 = require("./agents/cognitive_system/simple_cognitive_agent");
let AppController = class AppController {
    appService;
    agentManager;
    agentOrchestrator;
    cognitiveAgent;
    constructor(appService, agentManager, agentOrchestrator, cognitiveAgent) {
        this.appService = appService;
        this.agentManager = agentManager;
        this.agentOrchestrator = agentOrchestrator;
        this.cognitiveAgent = cognitiveAgent;
    }
    getHello() {
        return this.appService.getHello();
    }
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'Fuse Core API'
        };
    }
    getAgentStatus() {
        const overview = this.agentManager.getSystemOverview();
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            ...overview
        };
    }
    getWorkflowStatus() {
        const stats = this.agentOrchestrator.getWorkflowStats();
        const workflows = this.agentOrchestrator.getAllWorkflows();
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            stats,
            recentWorkflows: workflows.slice(-5) // Last 5 workflows
        };
    }
    getCognitiveStatus() {
        const stats = this.cognitiveAgent.getCognitiveStats();
        const completed = this.cognitiveAgent.getCompletedTasks();
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            cognitive_stats: stats,
            recent_tasks: completed.slice(-5)
        };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AppController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('agents/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AppController.prototype, "getAgentStatus", null);
__decorate([
    (0, common_1.Get)('workflows/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AppController.prototype, "getWorkflowStatus", null);
__decorate([
    (0, common_1.Get)('cognitive/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AppController.prototype, "getCognitiveStatus", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService,
        AgentManager_1.AgentManager,
        agent_orchestrator_1.AgentOrchestrator,
        simple_cognitive_agent_1.SimpleCognitiveAgent])
], AppController);
//# sourceMappingURL=app.controller.js.map