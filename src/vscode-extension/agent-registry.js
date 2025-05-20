"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRegistry = void 0;
class AgentRegistry {
    constructor() {
        this.agents = new Map();
    }
    registerAgent(agent) {
        this.agents.set(agent.id, agent);
    }
    unregisterAgent(agentId) {
        this.agents.delete(agentId);
    }
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    getAgentsByCapability(capability) {
        return this.getAllAgents().filter(agent => agent.capabilities.includes(capability) && agent.status === 'active');
    }
}
exports.AgentRegistry = AgentRegistry;
//# sourceMappingURL=agent-registry.js.map