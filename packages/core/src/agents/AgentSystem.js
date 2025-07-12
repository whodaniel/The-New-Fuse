var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentSystem_1;
import { Injectable, Logger } from '@nestjs/common';
import * as Redis from 'ioredis';
import { AgentManager } from './AgentManager';
import { AgentProcessor } from '../agent/AgentProcessor';
let AgentSystem = AgentSystem_1 = class AgentSystem {
    agentManager;
    agentProcessor;
    logger = new Logger(AgentSystem_1.name);
    redis;
    initialized = false;
    constructor(agentManager, agentProcessor) {
        this.agentManager = agentManager;
        this.agentProcessor = agentProcessor;
        this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
        this.initialize();
    }
    async initialize() {
        try {
            await this.redis.ping();
            this.initialized = true;
            this.logger.log('Agent system initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize agent system', { error });
            throw error;
        }
    }
    async createAgent(config) {
        try {
            if (!this.initialized) {
                throw new Error('Agent system not initialized');
            }
            const agent = await this.agentManager.createAgent(config);
            // Store in Redis for persistence
            await this.redis.hset(`agent:${config.id}`, {
                config: JSON.stringify(config),
                state: JSON.stringify(agent.state),
                created: new Date().toISOString()
            });
            this.logger.log('Agent created and stored', { agentId: config.id });
            return agent;
        }
        catch (error) {
            this.logger.error('Failed to create agent', { error, config });
            throw error;
        }
    }
    async getAgent(agentId) {
        try {
            const agent = await this.agentManager.getAgent(agentId);
            if (agent) {
                return agent;
            }
            // Try to load from Redis
            const redisData = await this.redis.hgetall(`agent:${agentId}`);
            ``;
            if (redisData.config) {
                const config = JSON.parse(redisData.config);
                const restoredAgent = await this.agentManager.createAgent(config);
                return restoredAgent;
            }
            return null;
        }
        catch (error) {
            this.logger.error('Failed to get agent', { error, agentId });
            return null;
        }
    }
    async deleteAgent(agentId) {
        try {
            const deleted = await this.agentManager.deleteAgent(agentId);
            if (deleted) {
                await this.redis.del(`agent:${agentId}`);
                this.logger.log('Agent deleted', { agentId });
            }
            return deleted;
        }
        catch (error) {
            this.logger.error('Failed to delete agent', { error, agentId });
            return false;
        }
    }
    async listAgents() {
        try {
            return await this.agentManager.getAllAgents();
        }
        catch (error) {
            this.logger.error('Failed to list agents', { error });
            return [];
        }
    }
    async processAgent(agentId) {
        try {
            const agent = await this.getAgent(agentId);
            if (!agent) {
                throw new Error(`Agent ${agentId} not found`);
            }
            const result = await this.agentProcessor.processAgent(agent);
            this.logger.log('Agent processed', { agentId, result });
        }
        catch (error) {
            this.logger.error('Failed to process agent', { error, agentId });
            throw error;
        }
    }
    async shutdown() {
        try {
            await this.redis.quit();
            this.initialized = false;
            this.logger.log('Agent system shut down successfully');
        }
        catch (error) {
            this.logger.error('Failed to shutdown agent system', { error });
        }
    }
};
AgentSystem = AgentSystem_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [AgentManager,
        AgentProcessor])
], AgentSystem);
export { AgentSystem };
