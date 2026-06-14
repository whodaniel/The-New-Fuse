"use strict";
/**
 * Agent Registry Adapter
 *
 * Bridges the MasterAgentRegistry to the interface expected by WorkflowEngineFactory
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRegistryAdapter = void 0;
class AgentRegistryAdapter {
    constructor(masterRegistry) {
        this.legacyAgents = new Map();
        this.masterRegistry = masterRegistry;
    }
    get agents() {
        return this.legacyAgents;
    }
    getAgent(agentId) {
        const profile = this.masterRegistry.getAgentProfile(agentId);
        if (!profile)
            return undefined;
        return this.convertToLegacyAgent(profile);
    }
    getAgentCount() {
        return this.masterRegistry.getAllAgents().length;
    }
    registerAgent(agent) {
        // This is handled by MasterAgentRegistry.registerAgent()
        // For compatibility, we'll store in legacy map
        this.legacyAgents.set(agent.id, agent);
    }
    unregisterAgent(agentId) {
        this.legacyAgents.delete(agentId);
        // MasterAgentRegistry doesn't have unregister, so we'll just return true
        return true;
    }
    getAllAgents() {
        return this.masterRegistry.getAllAgents().map(profile => this.convertToLegacyAgent(profile));
    }
    async addAgentTodo(agentId, taskData) {
        return this.masterRegistry.addAgentTodo(agentId, taskData);
    }
    convertToLegacyAgent(profile) {
        return {
            id: profile.id,
            name: profile.name,
            type: profile.type,
            status: profile.status,
            capabilities: Object.entries(profile.capabilities || {})
                .filter(([_, enabled]) => enabled)
                .map(([cap, _]) => cap),
            registeredAt: profile.registeredAt,
            lastSeen: profile.lastSeen,
            metadata: profile.metadata
        };
    }
}
exports.AgentRegistryAdapter = AgentRegistryAdapter;
//# sourceMappingURL=agent-registry-adapter.js.map