"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AgentSwarmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSwarmService = void 0;
const common_1 = require("@nestjs/common");
let AgentSwarmService = AgentSwarmService_1 = class AgentSwarmService {
    constructor() {
        this.logger = new common_1.Logger(AgentSwarmService_1.name);
        this.agents = new Map();
        this.heartbeatInterval = null;
    }
    async onModuleInit() {
        this.logger.log('🐝 Initializing Agent Swarm Orchestration...');
        this.startHeartbeatMonitor();
    }
    onModuleDestroy() {
        this.stopHeartbeatMonitor();
    }
    registerAgent(agent) {
        this.agents.set(agent.id, {
            ...agent,
            status: 'online',
            lastHeartbeat: new Date(),
        });
        this.logger.log(`✅ Agent registered: ${agent.name} (${agent.capabilities.join(', ')})`);
    }
    unregisterAgent(agentId) {
        this.agents.delete(agentId);
        this.logger.log(`🔌 Agent unregistered: ${agentId}`);
    }
    recordHeartbeat(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.lastHeartbeat = new Date();
            agent.status = 'online';
        }
    }
    findAgentsByCapability(capability) {
        return Array.from(this.agents.values()).filter((a) => a.capabilities.includes(capability) && a.status === 'online');
    }
    startHeartbeatMonitor() {
        this.heartbeatInterval = setInterval(() => {
            const now = new Date();
            const timeout = 90000;
            for (const agent of this.agents.values()) {
                const elapsed = now.getTime() - agent.lastHeartbeat.getTime();
                if (elapsed > timeout && agent.status === 'online') {
                    agent.status = 'offline';
                    this.logger.warn(`⚠️ Agent ${agent.name} went offline (no heartbeat)`);
                }
            }
        }, 30000);
    }
    stopHeartbeatMonitor() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    getStatistics() {
        const agents = Array.from(this.agents.values());
        const capabilities = {};
        for (const agent of agents) {
            for (const cap of agent.capabilities) {
                capabilities[cap] = (capabilities[cap] || 0) + 1;
            }
        }
        return {
            totalAgents: agents.length,
            onlineAgents: agents.filter((a) => a.status === 'online').length,
            offlineAgents: agents.filter((a) => a.status === 'offline').length,
            agentsByCapability: capabilities,
        };
    }
    getAgents() {
        return Array.from(this.agents.values()).map((agent) => ({
            id: agent.id,
            name: agent.name,
            capabilities: Array.isArray(agent.capabilities) ? [...agent.capabilities] : [],
            status: agent.status,
            lastHeartbeat: agent.lastHeartbeat,
        }));
    }
};
exports.AgentSwarmService = AgentSwarmService;
exports.AgentSwarmService = AgentSwarmService = AgentSwarmService_1 = __decorate([
    (0, common_1.Injectable)()
], AgentSwarmService);
//# sourceMappingURL=agent-swarm.service.js.map