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
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const types_1 = require("@the-new-fuse/types");
let AgentService = class AgentService {
    agentRepository;
    constructor(agentRepository) {
        this.agentRepository = agentRepository;
    }
    async createAgent(createAgentDto) {
        try {
            const agentData = {
                ...createAgentDto,
                status: types_1.AgentStatus.INACTIVE,
                // Ensure userId is provided
                userId: createAgentDto.userId || '', // This should come from authenticated user context
            };
            const agent = await this.agentRepository.create(agentData);
            return new types_1.AgentResponseDto(agent);
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to create agent: ${error.message}`);
        }
    }
    async findAllAgents(userId, filters) {
        try {
            const whereClause = {
                ...filters,
                ...(userId && { userId })
            };
            const agents = await this.agentRepository.findMany(whereClause);
            return agents.map(agent => new types_1.AgentResponseDto({
                ...agent,
                lastActive: agent.metadata?.lastActive
            }));
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to fetch agents: ${error.message}`);
        }
    }
    async findAgentById(id) {
        try {
            const agent = await this.agentRepository.findById(id);
            if (!agent) {
                throw new common_1.NotFoundException(`Agent with ID ${id} not found`);
            }
            return new types_1.AgentResponseDto({
                ...agent,
                lastActive: agent.metadata?.lastActive
            });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to fetch agent: ${error.message}`);
        }
    }
    async updateAgent(id, updateAgentDto) {
        try {
            const existingAgent = await this.agentRepository.findById(id);
            if (!existingAgent) {
                throw new common_1.NotFoundException(`Agent with ID ${id} not found`);
            }
            const agent = await this.agentRepository.update(id, updateAgentDto);
            return new types_1.AgentResponseDto({
                ...agent,
                lastActive: agent.metadata?.lastActive
            });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to update agent: ${error.message}`);
        }
    }
    async deleteAgent(id) {
        try {
            const existingAgent = await this.agentRepository.findById(id);
            if (!existingAgent) {
                throw new common_1.NotFoundException(`Agent with ID ${id} not found`);
            }
            await this.agentRepository.delete(id);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to delete agent: ${error.message}`);
        }
    }
    async findAgentsByType(type) {
        try {
            const agents = await this.agentRepository.findByType(type);
            return agents.map(agent => new types_1.AgentResponseDto({
                ...agent,
                lastActive: agent.metadata?.lastActive
            }));
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to fetch agents by type: ${error.message}`);
        }
    }
    async findAgentsByStatus(status) {
        try {
            const agents = await this.agentRepository.findByStatus(status);
            return agents.map(agent => new types_1.AgentResponseDto({
                ...agent,
                lastActive: agent.metadata?.lastActive
            }));
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to fetch agents by status: ${error.message}`);
        }
    }
    async findAgentsByUserId(userId) {
        try {
            const agents = await this.agentRepository.findByUserId(userId);
            return agents.map(agent => new types_1.AgentResponseDto({
                ...agent,
                lastActive: agent.metadata?.lastActive
            }));
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to fetch user agents: ${error.message}`);
        }
    }
    async updateAgentStatus(id, status) {
        try {
            const existingAgent = await this.agentRepository.findById(id);
            if (!existingAgent) {
                throw new common_1.NotFoundException(`Agent with ID ${id} not found`);
            }
            const agent = await this.agentRepository.updateStatus(id, status);
            return new types_1.AgentResponseDto({
                ...agent,
                lastActive: agent.metadata?.lastActive
            });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to update agent status: ${error.message}`);
        }
    }
    async getActiveAgents() {
        return this.findAgentsByStatus(types_1.AgentStatus.ACTIVE);
    }
    async getAgentStats(id) {
        try {
            const stats = await this.agentRepository.getAgentStats(id);
            if (!stats) {
                throw new common_1.NotFoundException(`Agent with ID ${id} not found`);
            }
            return stats;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to fetch agent stats: ${error.message}`);
        }
    }
    async getAgentTypeCounts() {
        try {
            return await this.agentRepository.countByType();
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to fetch agent type counts: ${error.message}`);
        }
    }
    async activateAgent(id) {
        return this.updateAgentStatus(id, types_1.AgentStatus.ACTIVE);
    }
    async deactivateAgent(id) {
        return this.updateAgentStatus(id, types_1.AgentStatus.INACTIVE);
    }
    async pauseAgent(id) {
        return this.updateAgentStatus(id, types_1.AgentStatus.IDLE);
    }
    async markAgentBusy(id) {
        return this.updateAgentStatus(id, types_1.AgentStatus.BUSY);
    }
    async markAgentError(id) {
        return this.updateAgentStatus(id, types_1.AgentStatus.ERROR);
    }
    async searchAgents(userId, query) {
        try {
            const agents = await this.agentRepository.findMany({
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
            });
            return agents.map(agent => new types_1.AgentResponseDto({
                ...agent,
                lastActive: agent.metadata?.lastActive
            }));
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to search agents: ${error.message}`);
        }
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.AgentRepository])
], AgentService);
