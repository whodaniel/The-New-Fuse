var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AgentRepository } from '@the-new-fuse/database';
import { AgentResponseDto, AgentStatus } from '@the-new-fuse/types';
let AgentService = class AgentService {
    agentRepository;
    constructor(agentRepository) {
        this.agentRepository = agentRepository;
    }
    async createAgent(createAgentDto, userId) {
        try {
            if (!userId) {
                throw new BadRequestException('userId is required to create an agent');
            }
            const agentData = {
                name: createAgentDto.name,
                type: createAgentDto.type,
                description: createAgentDto.description,
                systemPrompt: createAgentDto.systemPrompt,
                capabilities: createAgentDto.capabilities,
                config: createAgentDto.configuration,
                provider: createAgentDto.provider,
                status: AgentStatus.INACTIVE,
                user: {
                    connect: { id: userId }
                }
            };
            const agent = await this.agentRepository.create(agentData);
            return new AgentResponseDto({
                ...agent,
                type: agent.type,
                status: agent.status,
                capabilities: agent.capabilities ? agent.capabilities.map(cap => cap) : [],
                lastActive: new Date(),
            });
        }
        catch (error) {
            throw new BadRequestException(`Failed to create agent: ${error.message}`);
        }
    }
    async findAllAgents(userId, filters) {
        try {
            const whereClause = {
                ...filters,
                ...(userId && { userId })
            };
            const agents = await this.agentRepository.findMany(whereClause);
            return agents.map(agent => new AgentResponseDto({
                ...agent,
                type: agent.type,
                status: agent.status,
                capabilities: agent.capabilities ? agent.capabilities.map(cap => cap) : [],
                lastActive: new Date(),
            }));
        }
        catch (error) {
            throw new BadRequestException(`Failed to fetch agents: ${error.message}`);
        }
    }
    async findAgentById(id) {
        try {
            const agent = await this.agentRepository.findById(id);
            if (!agent) {
                throw new NotFoundException(`Agent with ID ${id} not found`);
            }
            return new AgentResponseDto({
                ...agent,
                type: agent.type,
                status: agent.status,
                capabilities: agent.capabilities ? agent.capabilities.map(cap => cap) : [],
                lastActive: new Date(),
            });
        }
        catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Failed to fetch agent: ${error.message}`);
        }
    }
    async updateAgent(id, updateAgentDto) {
        try {
            const existingAgent = await this.agentRepository.findById(id);
            if (!existingAgent) {
                throw new NotFoundException(`Agent with ID ${id} not found`);
            }
            const updateData = {
                ...updateAgentDto,
                type: updateAgentDto.type, // This cast is necessary due to type mismatch
                status: updateAgentDto.status, // This cast is necessary due to type mismatch
                capabilities: updateAgentDto.capabilities ? { set: updateAgentDto.capabilities } : undefined,
            };
            const agent = await this.agentRepository.update(id, updateData);
            return new AgentResponseDto({
                ...agent,
                type: agent.type,
                status: agent.status,
                capabilities: agent.capabilities ? agent.capabilities.map(cap => cap) : [],
                lastActive: new Date(),
            });
        }
        catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Failed to update agent: ${error.message}`);
        }
    }
    async deleteAgent(id) {
        try {
            const existingAgent = await this.agentRepository.findById(id);
            if (!existingAgent) {
                throw new NotFoundException(`Agent with ID ${id} not found`);
            }
            await this.agentRepository.delete(id);
        }
        catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Failed to delete agent: ${error.message}`);
        }
    }
    async findAgentsByType(type) {
        try {
            const agents = await this.agentRepository.findByType(type);
            return agents.map(agent => new AgentResponseDto({
                ...agent,
                type: agent.type,
                status: agent.status,
                capabilities: agent.capabilities ? agent.capabilities.map(cap => cap) : [],
                lastActive: new Date(),
            }));
        }
        catch (error) {
            throw new BadRequestException(`Failed to fetch agents by type: ${error.message}`);
        }
    }
    async findAgentsByStatus(status) {
        try {
            const agents = await this.agentRepository.findByStatus(status);
            return agents.map(agent => new AgentResponseDto({
                ...agent,
                type: agent.type,
                status: agent.status,
                capabilities: agent.capabilities ? agent.capabilities.map(cap => cap) : [],
                lastActive: new Date(),
            }));
        }
        catch (error) {
            throw new BadRequestException(`Failed to fetch agents by status: ${error.message}`);
        }
    }
    async findAgentsByUserId(userId) {
        try {
            const agents = await this.agentRepository.findByUserId(userId);
            return agents.map(agent => new AgentResponseDto({
                ...agent,
                type: agent.type,
                status: agent.status,
                capabilities: agent.capabilities ? agent.capabilities.map(cap => cap) : [],
                lastActive: new Date(),
            }));
        }
        catch (error) {
            throw new BadRequestException(`Failed to fetch user agents: ${error.message}`);
        }
    }
    async updateAgentStatus(id, status) {
        try {
            const existingAgent = await this.agentRepository.findById(id);
            if (!existingAgent) {
                throw new NotFoundException(`Agent with ID ${id} not found`);
            }
            const agent = await this.agentRepository.updateStatus(id, status); // This cast is necessary due to type mismatch
            return new AgentResponseDto({
                ...agent,
                type: agent.type,
                status: agent.status,
                capabilities: agent.capabilities ? agent.capabilities.map(cap => cap) : [],
                lastActive: new Date(),
            });
        }
        catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Failed to update agent status: ${error.message}`);
        }
    }
    async getActiveAgents() {
        return this.findAgentsByStatus(AgentStatus.ACTIVE);
    }
    async getAgentStats(id) {
        try {
            const stats = await this.agentRepository.getAgentStats(id);
            if (!stats) {
                throw new NotFoundException(`Agent with ID ${id} not found`);
            }
            return stats;
        }
        catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Failed to fetch agent stats: ${error.message}`);
        }
    }
    async getAgentTypeCounts() {
        try {
            return await this.agentRepository.countByType();
        }
        catch (error) {
            throw new BadRequestException(`Failed to fetch agent type counts: ${error.message}`);
        }
    }
    async activateAgent(id) {
        return this.updateAgentStatus(id, AgentStatus.ACTIVE);
    }
    async deactivateAgent(id) {
        return this.updateAgentStatus(id, AgentStatus.INACTIVE);
    }
    async pauseAgent(id) {
        return this.updateAgentStatus(id, AgentStatus.IDLE);
    }
    async markAgentBusy(id) {
        return this.updateAgentStatus(id, AgentStatus.BUSY);
    }
    async markAgentError(id) {
        return this.updateAgentStatus(id, AgentStatus.ERROR);
    }
    async searchAgents(userId, query) {
        try {
            const whereClause = {
                userId,
                OR: [
                    {
                        name: {
                            contains: query,
                            mode: 'insensitive'
                        }
                    },
                    {
                        description: {
                            contains: query,
                            mode: 'insensitive'
                        }
                    }
                ]
            };
            const agents = await this.agentRepository.findMany(whereClause);
            return agents.map(agent => new AgentResponseDto({
                ...agent,
                type: agent.type,
                status: agent.status,
                capabilities: agent.capabilities ? agent.capabilities.map(cap => cap) : [],
                lastActive: new Date(),
            }));
        }
        catch (error) {
            throw new BadRequestException(`Failed to search agents: ${error.message}`);
        }
    }
};
AgentService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof AgentRepository !== "undefined" && AgentRepository) === "function" ? _a : Object])
], AgentService);
export { AgentService };
//# sourceMappingURL=agent.service.js.map