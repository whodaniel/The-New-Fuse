"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
/**
 * Agent Service - Updated for Drizzle ORM compatibility
 * Manages AI agent lifecycle and operations.
 *
 * Note: This service integrates with the 'Agent Swarm' modules in apps/casin8-games/swarm
 * to provide agent crafting (strategy profiles) and nurturing (performance tracking)
 * scoped to the user's Workspace context.
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const types_1 = require("@the-new-fuse/types");
let AgentService = class AgentService {
    constructor(db) {
        this.db = db;
    }
    get agentRepository() {
        return this.db.agents;
    }
    async createAgent(createAgentDto, userId) {
        try {
            if (!userId) {
                throw new common_1.BadRequestException('userId is required to create an agent');
            }
            const metadataInput = this.normalizeMetadataInput(createAgentDto.metadata);
            const agentData = {
                name: createAgentDto.name,
                type: createAgentDto.type,
                description: createAgentDto.description,
                systemPrompt: createAgentDto.systemPrompt,
                capabilities: createAgentDto.capabilities,
                config: createAgentDto.configuration,
                provider: createAgentDto.provider,
                status: types_1.AgentStatus.INACTIVE,
                userId: userId,
            };
            const agent = await this.agentRepository.create(agentData);
            if (metadataInput) {
                await this.agentRepository.upsertMetadata(agent.id, { metadata: metadataInput });
            }
            return this.mapAgentToResponse({ ...agent, metadata: metadataInput });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(`Failed to create agent: ${errorMessage}`);
        }
    }
    async findAllAgents(userId, _filters, page = 1, limit = 50) {
        try {
            let agents;
            if (userId) {
                const result = await this.agentRepository.findWithPagination(userId, page, limit);
                const enriched = await this.attachMetadata(result.data);
                return {
                    data: enriched.map((agent) => this.mapAgentToResponse(agent)),
                    total: result.total,
                    page,
                    limit,
                };
            }
            else {
                // Fallback for system-level or if userId is not provided (should ideally be avoided)
                throw new common_1.BadRequestException('userId is required to fetch agents');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(`Failed to fetch agents: ${errorMessage}`);
        }
    }
    async findAgentById(id, userId) {
        try {
            const agent = await this.agentRepository.findByIdWithMetadata(id, userId);
            if (!agent) {
                throw new common_1.NotFoundException(`Agent with ID ${id} not found`);
            }
            return this.mapAgentToResponse({
                ...agent,
                metadata: this.extractMetadataValue(agent.metadata),
            });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(`Failed to fetch agent: ${errorMessage}`);
        }
    }
    async updateAgent(id, updateAgentDto, userId) {
        try {
            const existingAgent = await this.agentRepository.findByIdWithMetadata(id, userId);
            if (!existingAgent) {
                throw new common_1.NotFoundException(`Agent with ID ${id} not found`);
            }
            const updateData = {};
            if (updateAgentDto.name !== undefined)
                updateData.name = updateAgentDto.name;
            if (updateAgentDto.description !== undefined)
                updateData.description = updateAgentDto.description;
            if (updateAgentDto.systemPrompt !== undefined)
                updateData.systemPrompt = updateAgentDto.systemPrompt;
            if (updateAgentDto.configuration !== undefined)
                updateData.config = updateAgentDto.configuration;
            if (updateAgentDto.type !== undefined)
                updateData.type = updateAgentDto.type;
            if (updateAgentDto.status !== undefined)
                updateData.status = updateAgentDto.status;
            if (updateAgentDto.capabilities !== undefined)
                updateData.capabilities = updateAgentDto.capabilities;
            const agent = await this.agentRepository.update(id, userId, updateData);
            if (!agent) {
                throw new common_1.NotFoundException(`Agent with ID ${id} not found`);
            }
            const metadataInput = this.normalizeMetadataInput(updateAgentDto.metadata);
            const existingMetadata = this.extractMetadataValue(existingAgent.metadata);
            const mergedMetadata = metadataInput
                ? { ...(existingMetadata || {}), ...metadataInput }
                : existingMetadata;
            if (metadataInput) {
                await this.agentRepository.upsertMetadata(id, {
                    metadata: mergedMetadata,
                });
            }
            return this.mapAgentToResponse({ ...agent, metadata: mergedMetadata });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(`Failed to update agent: ${errorMessage}`);
        }
    }
    async deleteAgent(id, userId) {
        try {
            const existingAgent = await this.agentRepository.findById(id, userId);
            if (!existingAgent) {
                throw new common_1.NotFoundException(`Agent with ID ${id} not found`);
            }
            await this.agentRepository.softDelete(id, userId);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(`Failed to delete agent: ${errorMessage}`);
        }
    }
    async findAgentsByType(type, userId, _page = 1, _limit = 50) {
        try {
            // Use search to filter by type since there's no direct findByType
            const agents = await this.agentRepository.findAll(userId, 100);
            const enriched = await this.attachMetadata(agents);
            const filteredAgents = enriched.filter((a) => a.type === type);
            return {
                data: filteredAgents.map((agent) => this.mapAgentToResponse(agent)),
                total: filteredAgents.length,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(`Failed to fetch agents by type: ${errorMessage}`);
        }
    }
    async findAgentsByStatus(status, userId) {
        try {
            // Filter by status from all agents
            const agents = await this.agentRepository.findAll(userId, 100);
            const enriched = await this.attachMetadata(agents);
            const filteredAgents = enriched.filter((a) => a.status === status);
            return filteredAgents.map((agent) => this.mapAgentToResponse(agent));
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(`Failed to fetch agents by status: ${errorMessage}`);
        }
    }
    async findAgentsByUserId(userId, page = 1, limit = 50) {
        try {
            const result = await this.agentRepository.findWithPagination(userId, page, limit);
            const enriched = await this.attachMetadata(result.data);
            return {
                data: enriched.map((agent) => this.mapAgentToResponse(agent)),
                total: result.total,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(`Failed to fetch user agents: ${errorMessage}`);
        }
    }
    async updateAgentStatus(id, status, userId) {
        try {
            const existingAgent = await this.agentRepository.findById(id, userId);
            if (!existingAgent) {
                throw new common_1.NotFoundException(`Agent with ID ${id} not found`);
            }
            const agent = await this.agentRepository.updateStatus(id, status);
            if (!agent) {
                throw new common_1.NotFoundException(`Agent with ID ${id} not found`);
            }
            return this.mapAgentToResponse(agent);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(`Failed to update agent status: ${errorMessage}`);
        }
    }
    async getActiveAgents(userId) {
        const agents = await this.agentRepository.findActive(userId);
        const enriched = await this.attachMetadata(agents);
        return enriched.map((agent) => this.mapAgentToResponse(agent));
    }
    async getAgentStats(id, userId) {
        try {
            const agent = await this.agentRepository.findById(id, userId);
            if (!agent) {
                throw new common_1.NotFoundException(`Agent with ID ${id} not found`);
            }
            // Return basic stats derived from the agent
            return {
                id: agent.id,
                name: agent.name,
                type: agent.type,
                status: agent.status,
                capabilities: agent.capabilities || [],
                createdAt: agent.createdAt,
                updatedAt: agent.updatedAt,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(`Failed to fetch agent stats: ${errorMessage}`);
        }
    }
    async getAgentTypeCounts(_userId) {
        try {
            const statusCounts = await this.agentRepository.countByStatus();
            return statusCounts.reduce((acc, item) => {
                acc[item.status] = item.count;
                return acc;
            }, {});
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(`Failed to fetch agent type counts: ${errorMessage}`);
        }
    }
    async activateAgent(id, userId) {
        return this.updateAgentStatus(id, types_1.AgentStatus.ACTIVE, userId);
    }
    async deactivateAgent(id, userId) {
        return this.updateAgentStatus(id, types_1.AgentStatus.INACTIVE, userId);
    }
    async pauseAgent(id, userId) {
        return this.updateAgentStatus(id, types_1.AgentStatus.IDLE, userId);
    }
    async markAgentBusy(id, userId) {
        return this.updateAgentStatus(id, types_1.AgentStatus.BUSY, userId);
    }
    async markAgentError(id, userId) {
        return this.updateAgentStatus(id, types_1.AgentStatus.ERROR, userId);
    }
    async deployAgent(id, userId, target = 'cloud') {
        const agent = await this.activateAgent(id, userId);
        const orchestrator = target === 'local' ? 'docker' : target === 'hybrid' ? 'hybrid' : 'kubernetes';
        return {
            agent,
            deployment: {
                status: 'deployed',
                target,
                orchestrator,
                deployedAt: new Date().toISOString(),
            },
        };
    }
    async searchAgents(userId, query, _page = 1, _limit = 50) {
        try {
            const agents = await this.agentRepository.search(query, userId);
            const enriched = await this.attachMetadata(agents);
            return {
                data: enriched.map((agent) => this.mapAgentToResponse(agent)),
                total: enriched.length,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(`Failed to search agents: ${errorMessage}`);
        }
    }
    /**
     * Update agent profile (self-identification)
     * Allows agents to update their own profile information
     */
    async updateAgentProfile(id, profileDto, userId) {
        try {
            const existingAgent = await this.agentRepository.findById(id, userId);
            if (!existingAgent) {
                throw new common_1.NotFoundException(`Agent with ID ${id} not found`);
            }
            // Merge existing profile with new profile data
            const currentProfile = existingAgent.profile || {};
            const newProfile = {
                ...currentProfile,
                ...profileDto,
                lastUpdated: new Date().toISOString(),
            };
            const agent = await this.agentRepository.update(id, userId, {
                profile: newProfile,
            });
            if (!agent) {
                throw new common_1.NotFoundException(`Agent with ID ${id} not found`);
            }
            return this.mapAgentToResponse(agent);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(`Failed to update agent profile: ${errorMessage}`);
        }
    }
    mapAgentToResponse(agent) {
        const metadata = this.extractMetadataValue(agent?.metadata);
        return {
            ...agent,
            type: agent.type,
            status: agent.status,
            capabilities: agent.capabilities
                ? agent.capabilities.map((cap) => cap)
                : [],
            lastActive: agent.lastActiveAt || new Date(),
            metadata,
        };
    }
    normalizeMetadataInput(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return null;
        }
        return value;
    }
    extractMetadataValue(value) {
        if (!value)
            return undefined;
        if (typeof value === 'object' && 'metadata' in value) {
            const candidate = value.metadata;
            if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
                return candidate;
            }
        }
        if (typeof value === 'object' && !Array.isArray(value)) {
            return value;
        }
        return undefined;
    }
    async attachMetadata(agents) {
        if (!agents.length)
            return agents;
        const agentIds = agents.map((agent) => agent.id).filter(Boolean);
        if (!agentIds.length)
            return agents;
        const metadataRows = await this.agentRepository.findMetadataByAgentIds(agentIds);
        const metadataById = new Map(metadataRows.map((row) => [row.agentId, row.metadata]));
        return agents.map((agent) => {
            const existing = this.extractMetadataValue(agent?.metadata);
            const metadata = existing ?? metadataById.get(agent.id);
            return {
                ...agent,
                metadata,
            };
        });
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], AgentService);
//# sourceMappingURL=agent.service.js.map