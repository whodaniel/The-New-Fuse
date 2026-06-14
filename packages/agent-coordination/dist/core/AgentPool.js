"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentPool = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
const types_js_1 = require("./types.js");
/**
 * Agent pool management
 */
class AgentPool extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.agents = new Map();
        this.heartbeatIntervals = new Map();
        const defaults = {
            minAgents: 1,
            maxAgents: 10,
            scaleUpThreshold: 0.8,
            scaleDownThreshold: 0.2,
            heartbeatInterval: 5000,
            heartbeatTimeout: 15000,
        };
        this.config = { ...defaults, ...config };
    }
    /**
     * Register a new agent
     */
    registerAgent(agent) {
        const agentInfo = {
            id: agent.id || (0, uuid_1.v4)(),
            name: agent.name || `Agent-${Date.now()}`,
            type: agent.type || 'worker',
            capabilities: agent.capabilities || [],
            status: types_js_1.AgentStatus.IDLE,
            currentLoad: 0,
            maxConcurrentTasks: agent.maxConcurrentTasks || 5,
            tags: agent.tags || [],
            metadata: agent.metadata || {},
            createdAt: new Date(),
            lastHeartbeat: new Date(),
        };
        this.agents.set(agentInfo.id, agentInfo);
        this.setupHeartbeatMonitoring(agentInfo.id);
        this.emit('agent:registered', agentInfo);
        return agentInfo;
    }
    /**
     * Unregister an agent
     */
    unregisterAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return false;
        this.clearHeartbeatMonitoring(agentId);
        this.agents.delete(agentId);
        this.emit('agent:unregistered', agent);
        return true;
    }
    /**
     * Get agent by ID
     */
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * Get all agents
     */
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Get agents by status
     */
    getAgentsByStatus(status) {
        return this.getAllAgents().filter((agent) => agent.status === status);
    }
    /**
     * Get available agents (idle or not at capacity)
     */
    getAvailableAgents() {
        return this.getAllAgents().filter((agent) => (agent.status === types_js_1.AgentStatus.IDLE ||
            agent.status === types_js_1.AgentStatus.BUSY) &&
            agent.currentLoad < agent.maxConcurrentTasks);
    }
    /**
     * Update agent status
     */
    updateAgentStatus(agentId, status) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return false;
        agent.status = status;
        agent.lastHeartbeat = new Date();
        this.emit('agent:status:changed', agent);
        return true;
    }
    /**
     * Update agent load
     */
    updateAgentLoad(agentId, load) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return false;
        agent.currentLoad = load;
        agent.lastHeartbeat = new Date();
        // Auto-update status based on load
        if (load === 0) {
            agent.status = types_js_1.AgentStatus.IDLE;
        }
        else if (load < agent.maxConcurrentTasks) {
            agent.status = types_js_1.AgentStatus.BUSY;
        }
        this.emit('agent:load:changed', agent);
        return true;
    }
    /**
     * Increment agent load
     */
    incrementAgentLoad(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return false;
        return this.updateAgentLoad(agentId, agent.currentLoad + 1);
    }
    /**
     * Decrement agent load
     */
    decrementAgentLoad(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return false;
        return this.updateAgentLoad(agentId, Math.max(0, agent.currentLoad - 1));
    }
    /**
     * Update agent heartbeat
     */
    heartbeat(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return false;
        agent.lastHeartbeat = new Date();
        return true;
    }
    /**
     * Setup heartbeat monitoring for an agent
     */
    setupHeartbeatMonitoring(agentId) {
        const interval = setInterval(() => {
            this.checkAgentHeartbeat(agentId);
        }, this.config.heartbeatInterval);
        this.heartbeatIntervals.set(agentId, interval);
    }
    /**
     * Clear heartbeat monitoring for an agent
     */
    clearHeartbeatMonitoring(agentId) {
        const interval = this.heartbeatIntervals.get(agentId);
        if (interval) {
            clearInterval(interval);
            this.heartbeatIntervals.delete(agentId);
        }
    }
    /**
     * Check if agent heartbeat is healthy
     */
    checkAgentHeartbeat(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return;
        const timeSinceLastHeartbeat = Date.now() - agent.lastHeartbeat.getTime();
        if (timeSinceLastHeartbeat > this.config.heartbeatTimeout) {
            this.updateAgentStatus(agentId, types_js_1.AgentStatus.OFFLINE);
            this.emit('agent:heartbeat:timeout', agent);
        }
    }
    /**
     * Get pool statistics
     */
    getStatistics() {
        const agents = this.getAllAgents();
        const totalCapacity = agents.reduce((sum, agent) => sum + agent.maxConcurrentTasks, 0);
        const usedCapacity = agents.reduce((sum, agent) => sum + agent.currentLoad, 0);
        return {
            totalAgents: agents.length,
            idleAgents: this.getAgentsByStatus(types_js_1.AgentStatus.IDLE).length,
            busyAgents: this.getAgentsByStatus(types_js_1.AgentStatus.BUSY).length,
            offlineAgents: this.getAgentsByStatus(types_js_1.AgentStatus.OFFLINE).length,
            totalCapacity,
            usedCapacity,
            utilizationRate: totalCapacity > 0 ? usedCapacity / totalCapacity : 0,
        };
    }
    /**
     * Auto-scale the agent pool based on load
     */
    autoScale() {
        const stats = this.getStatistics();
        // Scale up if utilization is high
        if (stats.utilizationRate >= this.config.scaleUpThreshold &&
            stats.totalAgents < this.config.maxAgents) {
            return {
                action: 'scale-up',
                reason: `Utilization ${(stats.utilizationRate * 100).toFixed(1)}% exceeds threshold ${(this.config.scaleUpThreshold * 100).toFixed(1)}%`,
            };
        }
        // Scale down if utilization is low
        if (stats.utilizationRate <= this.config.scaleDownThreshold &&
            stats.totalAgents > this.config.minAgents) {
            return {
                action: 'scale-down',
                reason: `Utilization ${(stats.utilizationRate * 100).toFixed(1)}% below threshold ${(this.config.scaleDownThreshold * 100).toFixed(1)}%`,
            };
        }
        return {
            action: 'none',
            reason: 'Pool size is optimal',
        };
    }
    /**
     * Close the agent pool
     */
    close() {
        // Clear all heartbeat intervals
        for (const interval of this.heartbeatIntervals.values()) {
            clearInterval(interval);
        }
        this.heartbeatIntervals.clear();
        this.agents.clear();
        this.removeAllListeners();
    }
}
exports.AgentPool = AgentPool;
//# sourceMappingURL=AgentPool.js.map