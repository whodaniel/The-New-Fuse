"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentDiscoveryManager = void 0;
const events_1 = require("events");
const logging_1 = require("../core/logging");
const shared_1 = require("../types/shared");
class AgentDiscoveryManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.agents = new Map();
        this.capabilities = new Map();
        this.agentStatus = new Map();
        this.logger = logging_1.Logger.getInstance();
    }
    static getInstance() {
        if (!AgentDiscoveryManager.instance) {
            AgentDiscoveryManager.instance = new AgentDiscoveryManager();
        }
        return AgentDiscoveryManager.instance;
    }
    async registerAgent(agent) {
        try {
            // Update or add agent
            this.agents.set(agent.id, {
                ...agent,
                lastSeen: Date.now()
            });
            this.agentStatus.set(agent.id, shared_1.ConnectionStatus.CONNECTED);
            this.emit('agentRegistered', agent);
            this.logger.info(`Agent registered: ${agent.name} (${agent.id})`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to register agent:', error);
            return false;
        }
    }
    async unregisterAgent(agentId) {
        try {
            const agent = this.agents.get(agentId);
            if (agent) {
                this.agents.delete(agentId);
                this.capabilities.delete(agentId);
                this.agentStatus.delete(agentId);
                this.emit('agentUnregistered', agent);
                this.logger.info(`Agent unregistered: ${agent.name} (${agent.id})`);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error('Failed to unregister agent:', error);
            return false;
        }
    }
    async registerCapability(agentId, capability) {
        try {
            if (!this.capabilities.has(agentId)) {
                this.capabilities.set(agentId, new Set());
            }
            this.capabilities.get(agentId)?.add(capability);
            this.emit('capabilityRegistered', { agentId, capability });
            this.logger.info(`Capability registered for agent ${agentId}: ${capability.name}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to register capability:', error);
            return false;
        }
    }
    async updateAgentStatus(agentId, status) {
        const oldStatus = this.agentStatus.get(agentId);
        if (oldStatus !== status) {
            this.agentStatus.set(agentId, status);
            this.emit('agentStatusChanged', { agentId, status });
            this.logger.info(`Agent ${agentId} status changed to: ${status}`);
        }
    }
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    getAgentCapabilities(agentId) {
        return Array.from(this.capabilities.get(agentId) || []);
    }
    getAgentStatus(agentId) {
        return this.agentStatus.get(agentId) || shared_1.ConnectionStatus.DISCONNECTED;
    }
    getConnectedAgents() {
        return this.getAllAgents().filter(agent => this.getAgentStatus(agent.id) === shared_1.ConnectionStatus.CONNECTED);
    }
    findAgentsByCapability(capabilityId) {
        return this.getAllAgents().filter(agent => {
            const agentCapabilities = this.getAgentCapabilities(agent.id);
            return agentCapabilities.some(cap => cap.id === capabilityId);
        });
    }
    async checkAgentHealth() {
        const now = Date.now();
        const timeout = 30000; // 30 seconds timeout
        for (const [agentId, agent] of this.agents) {
            if (now - agent.lastSeen > timeout) {
                await this.updateAgentStatus(agentId, shared_1.ConnectionStatus.DISCONNECTED);
            }
        }
    }
    dispose() {
        this.removeAllListeners();
        this.agents.clear();
        this.capabilities.clear();
        this.agentStatus.clear();
    }
}
exports.AgentDiscoveryManager = AgentDiscoveryManager;
//# sourceMappingURL=agent-discovery.js.map