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
exports.OrchestratorController = void 0;
const common_1 = require("@nestjs/common");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const agent_swarm_service_1 = require("../modules/director/agent-swarm.service");
const director_service_1 = require("../modules/director/director.service");
let OrchestratorController = class OrchestratorController {
    constructor(director, swarm) {
        this.director = director;
        this.swarm = swarm;
    }
    async getHealth() {
        const directorStatus = this.director.getStatus();
        const swarmStats = this.swarm.getStatistics();
        const isHealthy = Boolean(directorStatus?.isRunning);
        return {
            status: isHealthy ? 'healthy' : 'degraded',
            checks: {
                director: directorStatus?.isRunning ? 'running' : 'stopped',
                swarm: swarmStats.onlineAgents > 0 ? 'agents_online' : 'no_agents',
            },
            metrics: {
                totalAgents: Number(swarmStats.totalAgents || 0),
                activeAgents: Number(swarmStats.onlineAgents || 0),
                offlineAgents: Number(swarmStats.offlineAgents || 0),
                cycleCount: Number(directorStatus?.cycleCount || 0),
                isRunning: Boolean(directorStatus?.isRunning),
            },
            timestamp: new Date().toISOString(),
        };
    }
    async getAgents() {
        const agents = this.swarm.getAgents().map((agent) => ({
            agentId: agent.id,
            id: agent.id,
            name: agent.name,
            status: agent.status,
            capabilities: agent.capabilities,
            lastHeartbeat: agent.lastHeartbeat instanceof Date
                ? agent.lastHeartbeat.toISOString()
                : String(agent.lastHeartbeat || ''),
        }));
        return {
            agents,
            count: agents.length,
            timestamp: new Date().toISOString(),
        };
    }
};
exports.OrchestratorController = OrchestratorController;
__decorate([
    (0, common_1.Get)('health'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.PUBLIC),
    (0, secure_auth_guard_1.SetRateLimitTier)(secure_auth_guard_1.RateLimitTier.HEALTH),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('agents'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.PUBLIC),
    (0, secure_auth_guard_1.SetRateLimitTier)(secure_auth_guard_1.RateLimitTier.HEALTH),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "getAgents", null);
exports.OrchestratorController = OrchestratorController = __decorate([
    (0, common_1.Controller)('orchestrator'),
    __metadata("design:paramtypes", [director_service_1.DirectorService,
        agent_swarm_service_1.AgentSwarmService])
], OrchestratorController);
//# sourceMappingURL=orchestrator.controller.js.map