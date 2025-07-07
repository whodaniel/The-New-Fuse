var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentManager_1;
import { Injectable, Logger } from '@nestjs/common';
import { AgentProcessor } from '../agent/AgentProcessor';
import { AgentCommunicationManager } from './AgentCommunicationManager';
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["INITIALIZING"] = "initializing";
    AgentStatus["READY"] = "ready";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["ERROR"] = "error";
    AgentStatus["STOPPED"] = "stopped";
})(AgentStatus || (AgentStatus = {}));
let AgentManager = AgentManager_1 = class AgentManager {
    constructor(agentProcessor, communicationManager) {
        this.agentProcessor = agentProcessor;
        this.communicationManager = communicationManager;
        this.logger = new Logger(AgentManager_1.name);
        this.agents = new Map();
    }
    async createAgent(config) {
        try {
            const agent = {
                config,
                state: {
                    id: `state_${config.id}`,
                    agentId: config.id,
                    status: 'idle',
                    lastActive: new Date(),
                    metrics: {
                        totalTasks: 0,
                        successfulTasks: 0,
                        failedTasks: 0,
                        averageTaskDuration: 0,
                        messagesProcessed: 0,
                        toolsUsed: 0
                    },
                    messages: [],
                    pendingTasks: [],
                    activeTools: []
                },
                skills: [],
                memory: [],
                tasks: [],
                actions: []
            };
            this.agents.set(config.id, agent);
            this.logger.log('Agent created successfully', { agentId: config.id });
            return agent;
        }
        catch (error) {
            this.logger.error('Failed to create agent', { error, config });
            throw error;
        }
    }
    async getAgent(agentId) {
        return this.agents.get(agentId);
    }
    async getAllAgents() {
        return Array.from(this.agents.values());
    }
    async updateAgent(agentId, updates) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent with id ${agentId} not found`);
        }
        const updatedAgent = { ...agent, ...updates };
        this.agents.set(agentId, updatedAgent);
        this.logger.log('Agent updated', { agentId });
        return updatedAgent;
    }
    async deleteAgent(agentId) {
        const deleted = this.agents.delete(agentId);
        if (deleted) {
            this.logger.log('Agent deleted', { agentId });
        }
        return deleted;
    }
    async startAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent with id ${agentId} not found`);
        }
        agent.state.status = 'busy';
        agent.state.lastActive = new Date();
        this.logger.log('Agent started', { agentId });
    }
    async stopAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent with id ${agentId} not found`);
        }
        agent.state.status = 'idle';
        agent.state.lastActive = new Date();
        this.logger.log('Agent stopped', { agentId });
    }
};
AgentManager = AgentManager_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [AgentProcessor,
        AgentCommunicationManager])
], AgentManager);
export { AgentManager };
