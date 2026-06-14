/**
 * Agent Service - Drizzle ORM Implementation
 *
 * This service provides business logic for Agent operations.
 * It uses the Drizzle-based AgentRepository for data access.
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
var AgentService_1;
import { Injectable, Logger } from '@nestjs/common';
import { AgentCapability } from '@the-new-fuse/types';
import { AgentRepository } from '../repositories/agent.repository.js';
import { toError } from '../utils/error.js';
// Mock LocalAIDetectionService to avoid cross-package import issues
export class LocalAIDetectionService {
    async detectAndCreateAgents(_userId) {
        return [];
    }
    async getAvailableProviders() {
        return [];
    }
}
let AgentService = AgentService_1 = class AgentService {
    constructor(agentRepository, localAIDetectionService) {
        this.agentRepository = agentRepository;
        this.localAIDetectionService = localAIDetectionService;
        this.logger = new Logger(AgentService_1.name);
    }
    /**
     * Handle errors consistently
     */
    handleError(error, operation) {
        const err = toError(error);
        this.logger.error(`Error in ${operation}: ${err.message}`, err.stack);
        throw err;
    }
    normalizeStatus(status) {
        if (!status)
            return status;
        const normalized = String(status).toUpperCase();
        const allowed = new Set([
            'ACTIVE',
            'INACTIVE',
            'IDLE',
            'BUSY',
            'ERROR',
            'OFFLINE',
            'INITIALIZING',
            'READY',
            'TERMINATED',
        ]);
        return allowed.has(normalized) ? normalized : undefined;
    }
    extractConfig(data) {
        const direct = data.config;
        const alias = data.configuration;
        if (direct && typeof direct === 'object')
            return direct;
        if (alias && typeof alias === 'object')
            return alias;
        return undefined;
    }
    extractProfile(data) {
        const profile = data.profile;
        if (profile && typeof profile === 'object')
            return profile;
        return undefined;
    }
    /**
     * Get all agents for a user
     */
    async getAgents(userId) {
        try {
            return await this.agentRepository.findByUserId(userId);
        }
        catch (error) {
            return this.handleError(error, 'getAgents');
        }
    }
    /**
     * Get all agents (for admin/monitoring use)
     */
    async findAll() {
        try {
            return await this.agentRepository.findAll();
        }
        catch (error) {
            return this.handleError(error, 'findAll');
        }
    }
    /**
     * Get agent by ID for a specific user
     */
    async getAgentById(id, userId) {
        try {
            return await this.agentRepository.findOne({ id, userId });
        }
        catch (error) {
            return this.handleError(error, `getAgentById(${id})`);
        }
    }
    /**
     * Create a new agent for a user
     */
    async createAgent(data, userId) {
        try {
            const raw = data;
            const extractedConfig = this.extractConfig(raw);
            const extractedProfile = this.extractProfile(raw);
            const normalizedStatus = this.normalizeStatus(raw.status);
            const agentData = {
                name: data.name || 'Untitled Agent',
                type: data.type || 'ASSISTANT',
                userId,
                status: normalizedStatus,
                description: data.description,
                systemPrompt: data.systemPrompt ||
                    extractedConfig?.prompts?.system ||
                    undefined,
                config: extractedConfig,
                profile: extractedProfile,
                capabilities: data.capabilities || [],
                provider: data.provider ||
                    extractedConfig?.llm?.primary?.provider ||
                    'default',
            };
            return await this.agentRepository.create(agentData);
        }
        catch (error) {
            return this.handleError(error, 'createAgent');
        }
    }
    /**
     * Update an agent for a user
     */
    async updateAgent(id, data, userId) {
        try {
            const agent = await this.agentRepository.findOne({ id, userId });
            if (!agent) {
                throw new Error(`Agent with ID ${id} not found for this user`);
            }
            const raw = data;
            const extractedConfig = this.extractConfig(raw);
            const extractedProfile = this.extractProfile(raw);
            const normalizedStatus = this.normalizeStatus(raw.status);
            const updateData = {};
            if (data.name !== undefined)
                updateData.name = data.name;
            if (data.type !== undefined)
                updateData.type = data.type;
            if (data.description !== undefined)
                updateData.description = data.description;
            if (data.capabilities !== undefined)
                updateData.capabilities = data.capabilities;
            const mergedSystemPrompt = data.systemPrompt || extractedConfig?.prompts?.system;
            if (mergedSystemPrompt !== undefined) {
                updateData.systemPrompt = mergedSystemPrompt;
            }
            if (extractedConfig) {
                updateData.config = extractedConfig;
            }
            if (extractedProfile) {
                updateData.profile = extractedProfile;
            }
            const mergedProvider = data.provider || extractedConfig?.llm?.primary?.provider;
            if (mergedProvider !== undefined) {
                updateData.provider = mergedProvider;
            }
            if (normalizedStatus !== undefined) {
                updateData.status = normalizedStatus;
            }
            const updatedAgent = await this.agentRepository.update(id, updateData);
            if (!updatedAgent) {
                throw new Error(`Failed to update agent ${id}`);
            }
            return updatedAgent;
        }
        catch (error) {
            return this.handleError(error, `updateAgent(${id})`);
        }
    }
    /**
     * Delete an agent for a user
     */
    async deleteAgent(id, userId) {
        try {
            const agent = await this.agentRepository.findOne({ id, userId });
            if (!agent) {
                throw new Error(`Agent with ID ${id} not found for this user`);
            }
            return this.agentRepository.delete(id);
        }
        catch (error) {
            const err = toError(error);
            this.logger.error(`Error in deleteAgent(${id}): ${err.message}`, err.stack);
            return false;
        }
    }
    /**
     * Get agents by capability for a user
     */
    async getAgentsByCapability(capability, userId) {
        try {
            const agents = await this.getAgents(userId);
            return agents.filter((agent) => {
                if (!agent.capabilities)
                    return false;
                return agent.capabilities.includes(capability);
            });
        }
        catch (error) {
            return this.handleError(error, 'getAgentsByCapability');
        }
    }
    /**
     * Detect and register local AI providers as agents
     */
    async detectAndRegisterLocalAIs(userId) {
        this.logger.log(`🔍 Detecting local AIs for user: ${userId}`);
        const detectedAgents = await this.localAIDetectionService.detectAndCreateAgents(userId);
        const registeredAgents = [];
        for (const agentDto of detectedAgents) {
            try {
                const existingAgents = await this.agentRepository.findByUserId(userId);
                const exists = existingAgents.some((agent) => agent.config?.provider === agentDto.provider);
                if (!exists) {
                    const agentData = {
                        ...agentDto,
                        capabilities: Array.isArray(agentDto.capabilities)
                            ? agentDto.capabilities.filter((cap) => Object.values(AgentCapability).includes(cap))
                            : [],
                    };
                    const agent = await this.createAgent(agentData, userId);
                    registeredAgents.push(agent);
                    this.logger.log(`✅ Registered local AI agent: ${agentDto.name}`);
                }
                else {
                    this.logger.debug(`⚠️ Local AI agent already exists: ${agentDto.name}`);
                }
            }
            catch (error) {
                this.logger.error(`❌ Failed to register ${agentDto.name}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return registeredAgents;
    }
    /**
     * Get all local AI agents for a user
     */
    async getLocalAIAgents(userId) {
        try {
            const agents = await this.agentRepository.findByUserId(userId);
            return agents.filter((agent) => agent.config?.localAI === true);
        }
        catch (error) {
            return this.handleError(error, 'getLocalAIAgents');
        }
    }
    /**
     * Refresh local AI detection and update agents
     */
    async refreshLocalAIAgents(userId) {
        this.logger.log(`🔄 Refreshing local AI agents for user: ${userId}`);
        try {
            const availableProviders = await this.localAIDetectionService.getAvailableProviders();
            const availableProviderNames = availableProviders.map((p) => p.name);
            const existingAgents = await this.agentRepository.findByUserId(userId);
            const localAIAgents = existingAgents.filter((agent) => agent.config?.localAI === true);
            for (const agent of localAIAgents) {
                if (!availableProviderNames.includes(agent.config?.provider)) {
                    await this.deleteAgent(agent.id, userId);
                    this.logger.log(`🗑️ Removed unavailable AI agent: ${agent.name}`);
                }
            }
            return this.detectAndRegisterLocalAIs(userId);
        }
        catch (error) {
            return this.handleError(error, 'refreshLocalAIAgents');
        }
    }
    /**
     * Create default system agents for all detected local AIs
     */
    async createSystemLocalAIAgents() {
        this.logger.log('🚀 Creating default system agents for local AIs...');
        try {
            const systemAgents = await this.localAIDetectionService.detectAndCreateAgents('system');
            const registeredAgents = [];
            for (const agentDto of systemAgents) {
                const agentData = {
                    ...agentDto,
                    capabilities: Array.isArray(agentDto.capabilities)
                        ? agentDto.capabilities.filter((cap) => Object.values(AgentCapability).includes(cap))
                        : [],
                };
                const agent = await this.createAgent(agentData, 'system');
                registeredAgents.push(agent);
                this.logger.log(`✅ Created system agent: ${agentDto.name}`);
            }
            return registeredAgents;
        }
        catch (error) {
            return this.handleError(error, 'createSystemLocalAIAgents');
        }
    }
    /**
     * Start an agent (Set status to active)
     */
    async startAgent(id, userId) {
        try {
            const agent = await this.agentRepository.findOne({ id, userId });
            if (!agent) {
                throw new Error(`Agent with ID ${id} not found for this user`);
            }
            const updated = await this.agentRepository.update(id, { status: 'ACTIVE' });
            return updated;
        }
        catch (error) {
            return this.handleError(error, `startAgent(${id})`);
        }
    }
    /**
     * Stop an agent (Set status to inactive)
     */
    async stopAgent(id, userId) {
        try {
            const agent = await this.agentRepository.findOne({ id, userId });
            if (!agent) {
                throw new Error(`Agent with ID ${id} not found for this user`);
            }
            const updated = await this.agentRepository.update(id, { status: 'INACTIVE' });
            return updated;
        }
        catch (error) {
            return this.handleError(error, `stopAgent(${id})`);
        }
    }
};
AgentService = AgentService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [AgentRepository,
        LocalAIDetectionService])
], AgentService);
export { AgentService };
//# sourceMappingURL=agent.service.js.map