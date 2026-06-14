var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AgentInitializationService_1;
import { Injectable, Logger } from '@nestjs/common';
export const createInitializationMessage = (source, options = {}) => ({
    type: 'initialization',
    source,
    target: options.target || 'broadcast',
    timestamp: new Date().toISOString(),
    payload: {
        action: 'agent_ready',
        capabilities: options.capabilities || [
            'code_analysis',
            'pair_programming',
            'code_review',
            'architecture_design',
            'type_safety',
            'documentation',
        ],
        workspace: options.workspace || 'vscode',
        status: 'active',
    },
    priority: options.priority || 'medium',
});
export const createShutdownMessage = (source) => ({
    type: 'initialization',
    source,
    target: 'broadcast',
    timestamp: new Date().toISOString(),
    payload: {
        action: 'agent_shutdown',
        capabilities: [],
        workspace: '',
        status: 'inactive',
    },
    priority: 'medium',
});
let AgentInitializationService = class AgentInitializationService {
    static { AgentInitializationService_1 = this; }
    static { this.logger = new Logger(AgentInitializationService_1.name); }
    static { this.initialized = new Set(); }
    static { this.agents = new Map(); }
    static async initializeAgent(agentId, options = {}) {
        try {
            if (this.initialized.has(agentId)) {
                this.logger.warn(`Agent ${agentId} is already initialized`);
                return false;
            }
            const initMessage = createInitializationMessage(agentId, options);
            this.logger.log('Broadcasting initialization message', initMessage);
            // Store agent information
            this.agents.set(agentId, initMessage);
            // Mock broadcast - in real implementation would use message bus
            await this.broadcastMessage(initMessage);
            this.initialized.add(agentId);
            this.logger.log(`Agent ${agentId} initialized successfully`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to initialize agent ${agentId}`, error);
            return false;
        }
    }
    static isInitialized(agentId) {
        return this.initialized.has(agentId);
    }
    static getInitializedAgents() {
        return Array.from(this.initialized);
    }
    static getAgentInfo(agentId) {
        return this.agents.get(agentId);
    }
    static getAllAgentsInfo() {
        return Array.from(this.agents.entries()).map(([id, info]) => ({ id, info }));
    }
    static getAgentsByCapability(capability) {
        const agents = [];
        for (const [agentId, message] of this.agents.entries()) {
            if (message.payload.capabilities.includes(capability)) {
                agents.push(agentId);
            }
        }
        return agents;
    }
    static updateAgentCapabilities(agentId, capabilities) {
        const agentInfo = this.agents.get(agentId);
        if (!agentInfo || !this.initialized.has(agentId)) {
            return false;
        }
        agentInfo.payload.capabilities = capabilities;
        agentInfo.timestamp = new Date().toISOString();
        this.logger.log(`Updated capabilities for agent ${agentId}`, { capabilities });
        return true;
    }
    static updateAgentStatus(agentId, status) {
        const agentInfo = this.agents.get(agentId);
        if (!agentInfo || !this.initialized.has(agentId)) {
            return false;
        }
        agentInfo.payload.status = status;
        agentInfo.timestamp = new Date().toISOString();
        this.logger.log(`Updated status for agent ${agentId}`, { status });
        return true;
    }
    static async broadcastMessage(message) {
        // Mock implementation - would integrate with actual message bus
        this.logger.log(`Broadcasting to ${message.target}`, message);
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    static async shutdown(agentId) {
        try {
            if (!this.initialized.has(agentId)) {
                this.logger.warn(`Agent ${agentId} is not initialized`);
                return false;
            }
            // Create and broadcast shutdown message
            const shutdownMessage = createShutdownMessage(agentId);
            await this.broadcastMessage(shutdownMessage);
            // Remove from initialized set and agents map
            const removed = this.initialized.delete(agentId);
            this.agents.delete(agentId);
            if (removed) {
                this.logger.log(`Agent ${agentId} shutdown successfully`);
            }
            return removed;
        }
        catch (error) {
            this.logger.error(`Failed to shutdown agent ${agentId}`, error);
            return false;
        }
    }
    static async shutdownAll() {
        const agents = Array.from(this.initialized);
        let shutdownCount = 0;
        for (const agentId of agents) {
            if (await this.shutdown(agentId)) {
                shutdownCount++;
            }
        }
        this.logger.log(`Shutdown ${shutdownCount} agents`);
        return shutdownCount;
    }
    static getStats() {
        const stats = {
            totalAgents: this.agents.size,
            activeAgents: Array.from(this.agents.values()).filter((agent) => agent.payload.status === 'active').length,
            capabilitiesDistribution: {},
        };
        // Calculate capability distribution
        for (const agent of this.agents.values()) {
            for (const capability of agent.payload.capabilities) {
                stats.capabilitiesDistribution[capability] =
                    (stats.capabilitiesDistribution[capability] || 0) + 1;
            }
        }
        return stats;
    }
    static validateInitializationMessage(message) {
        return !!(message &&
            typeof message === 'object' &&
            message.type === 'initialization' &&
            typeof message.source === 'string' &&
            typeof message.target === 'string' &&
            typeof message.timestamp === 'string' &&
            message.payload &&
            typeof message.payload.action === 'string' &&
            Array.isArray(message.payload.capabilities) &&
            typeof message.payload.workspace === 'string' &&
            typeof message.payload.status === 'string' &&
            ['low', 'medium', 'high'].includes(message.priority));
    }
};
AgentInitializationService = AgentInitializationService_1 = __decorate([
    Injectable()
], AgentInitializationService);
export { AgentInitializationService };
//# sourceMappingURL=initialization.js.map