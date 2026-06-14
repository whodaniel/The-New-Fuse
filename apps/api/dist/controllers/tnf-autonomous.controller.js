"use strict";
/**
 * TNF Autonomous System Controller
 *
 * REST API endpoints for managing the autonomous system:
 * - Director status and control
 * - BMAD cycle execution
 * - Agent swarm management
 * - System health and metrics
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
var TNFAutonomousController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TNFAutonomousController = void 0;
const common_1 = require("@nestjs/common");
const agent_swarm_service_1 = require("../modules/director/agent-swarm.service");
const bmad_service_1 = require("../modules/director/bmad.service");
const director_service_1 = require("../modules/director/director.service");
let TNFAutonomousController = TNFAutonomousController_1 = class TNFAutonomousController {
    constructor(director, bmad, swarm) {
        this.director = director;
        this.bmad = bmad;
        this.swarm = swarm;
        this.logger = new common_1.Logger(TNFAutonomousController_1.name);
    }
    // ============================================================
    // SYSTEM STATUS
    // ============================================================
    /**
     * Get overall autonomous system status
     */
    async getSystemStatus() {
        return {
            success: true,
            data: {
                director: this.director.getStatus(),
                bmad: this.bmad.getStatistics(),
                swarm: this.swarm.getStatistics(),
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            },
        };
    }
    /**
     * Get system health
     */
    async getHealth() {
        const directorStatus = this.director.getStatus();
        const swarmStats = this.swarm.getStatistics();
        const isHealthy = directorStatus.isRunning && swarmStats.totalAgents >= 0;
        return {
            status: isHealthy ? 'healthy' : 'degraded',
            checks: {
                director: directorStatus.isRunning ? 'running' : 'stopped',
                swarm: swarmStats.onlineAgents > 0 ? 'agents_online' : 'no_agents',
            },
            timestamp: new Date().toISOString(),
        };
    }
    // ============================================================
    // DIRECTOR CONTROL
    // ============================================================
    /**
     * Get director status
     */
    async getDirectorStatus() {
        return {
            success: true,
            data: this.director.getStatus(),
        };
    }
    /**
     * Start the director loop
     */
    async startDirector() {
        await this.director.start();
        this.logger.log('Director started via API');
        return {
            success: true,
            message: 'Director loop started',
            data: this.director.getStatus(),
        };
    }
    /**
     * Stop the director loop
     */
    async stopDirector() {
        await this.director.stop();
        this.logger.log('Director stopped via API');
        return {
            success: true,
            message: 'Director loop stopped',
            data: this.director.getStatus(),
        };
    }
    // ============================================================
    // BMAD ORCHESTRATION
    // ============================================================
    /**
     * Get BMAD statistics
     */
    async getBMADStats() {
        return {
            success: true,
            data: this.bmad.getStatistics(),
        };
    }
    /**
     * Execute a BMAD cycle
     */
    async executeBMADCycle(dto) {
        this.logger.log(`Executing BMAD cycle: ${dto.contextPurpose}`);
        const result = await this.bmad.executeBMADCycle({
            skillIds: dto.skillIds,
            contextPurpose: dto.contextPurpose,
            templateId: dto.templateId,
            variables: dto.variables,
        });
        return {
            success: true,
            message: 'BMAD cycle executed',
            data: result,
        };
    }
    /**
     * Register a new skill
     */
    async registerSkill(body) {
        this.bmad.registerSkill(body.id, body.skill);
        return {
            success: true,
            message: `Skill ${body.id} registered`,
            data: this.bmad.getStatistics(),
        };
    }
    // ============================================================
    // AGENT SWARM
    // ============================================================
    /**
     * Get swarm statistics
     */
    async getSwarmStats() {
        return {
            success: true,
            data: this.swarm.getStatistics(),
        };
    }
    /**
     * Get real-time swarm activity logs
     */
    async getSwarmLogs() {
        const logs = await this.director.getSwarmLogs();
        return {
            success: true,
            data: logs,
        };
    }
    /**
     * Register a new agent
     */
    async registerAgent(dto) {
        this.swarm.registerAgent({
            id: dto.id,
            name: dto.name,
            capabilities: dto.capabilities,
        });
        this.logger.log(`Agent registered: ${dto.name}`);
        return {
            success: true,
            message: `Agent ${dto.name} registered`,
            data: {
                agent: dto,
                swarmStats: this.swarm.getStatistics(),
            },
        };
    }
    /**
     * Unregister an agent
     */
    async unregisterAgent(id) {
        this.swarm.unregisterAgent(id);
        this.logger.log(`Agent unregistered: ${id}`);
        return {
            success: true,
            message: `Agent ${id} unregistered`,
            data: this.swarm.getStatistics(),
        };
    }
    /**
     * Record agent heartbeat
     */
    async recordHeartbeat(id) {
        this.swarm.recordHeartbeat(id);
        return {
            success: true,
            message: `Heartbeat recorded for agent ${id}`,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Find agents by capability
     */
    async findAgentsByCapability(capability) {
        const agents = this.swarm.findAgentsByCapability(capability);
        return {
            success: true,
            data: {
                capability,
                agents,
                count: agents.length,
            },
        };
    }
};
exports.TNFAutonomousController = TNFAutonomousController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TNFAutonomousController.prototype, "getSystemStatus", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TNFAutonomousController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('director/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TNFAutonomousController.prototype, "getDirectorStatus", null);
__decorate([
    (0, common_1.Post)('director/start'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TNFAutonomousController.prototype, "startDirector", null);
__decorate([
    (0, common_1.Post)('director/stop'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TNFAutonomousController.prototype, "stopDirector", null);
__decorate([
    (0, common_1.Get)('bmad/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TNFAutonomousController.prototype, "getBMADStats", null);
__decorate([
    (0, common_1.Post)('bmad/execute'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TNFAutonomousController.prototype, "executeBMADCycle", null);
__decorate([
    (0, common_1.Post)('bmad/skills'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TNFAutonomousController.prototype, "registerSkill", null);
__decorate([
    (0, common_1.Get)('swarm/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TNFAutonomousController.prototype, "getSwarmStats", null);
__decorate([
    (0, common_1.Get)('swarm/logs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TNFAutonomousController.prototype, "getSwarmLogs", null);
__decorate([
    (0, common_1.Post)('swarm/agents'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TNFAutonomousController.prototype, "registerAgent", null);
__decorate([
    (0, common_1.Delete)('swarm/agents/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TNFAutonomousController.prototype, "unregisterAgent", null);
__decorate([
    (0, common_1.Post)('swarm/agents/:id/heartbeat'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TNFAutonomousController.prototype, "recordHeartbeat", null);
__decorate([
    (0, common_1.Get)('swarm/agents/capability/:capability'),
    __param(0, (0, common_1.Param)('capability')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TNFAutonomousController.prototype, "findAgentsByCapability", null);
exports.TNFAutonomousController = TNFAutonomousController = TNFAutonomousController_1 = __decorate([
    (0, common_1.Controller)('autonomous'),
    __metadata("design:paramtypes", [director_service_1.DirectorService,
        bmad_service_1.BMADService,
        agent_swarm_service_1.AgentSwarmService])
], TNFAutonomousController);
exports.default = TNFAutonomousController;
//# sourceMappingURL=tnf-autonomous.controller.js.map