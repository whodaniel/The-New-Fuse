import { 
    Controller, 
    Get, 
    Post, 
    Put, 
    Delete, 
    Body, 
    Param, 
    Query, 
    UseGuards,
    HttpException,
    HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AgentService } from '../services/agent/AgentService.js';
import { 
    Agent, 
    CreateAgentDto, 
    UpdateAgentDto, 
    AgentStatus 
} from '@the-new-fuse/types';
import { User } from '@the-new-fuse/database/client';

@ApiTags('Agents')
@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentController {
    constructor(private readonly agentService: AgentService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new agent' })
    @ApiResponse({ status: HttpStatus.CREATED, type: Agent })
    async createAgent(
        @Body() data: CreateAgentDto,
        @CurrentUser() user: User
    ): Promise<Agent> {
        try {
            return await this.agentService.createAgent(data, user.id);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to create agent',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get all agents' })
    @ApiResponse({ status: HttpStatus.OK, type: [Agent] })
    async getAgents(
        @CurrentUser() user: User,
        @Query('capability') capability?: string,
        @Query('status') status?: AgentStatus
    ): Promise<Agent[]> {
        try {
            if (capability) {
                return this.agentService.getAgentsByCapability(capability, user.id);
            }
            if (status) {
                return this.agentService.getAgentsByStatus(status, user.id);
            }
            return this.agentService.getAgents(user.id);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to fetch agents',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get agent by ID' })
    @ApiResponse({ status: HttpStatus.OK, type: Agent })
    async getAgentById(
        @Param('id') id: string,
        @CurrentUser() user: User
    ): Promise<Agent> {
        try {
            const agent = await this.agentService.getAgentById(id, user.id);
            if (!agent) {
                throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
            }
            return agent;
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to fetch agent',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update agent' })
    @ApiResponse({ status: HttpStatus.OK, type: Agent })
    async updateAgent(
        @Param('id') id: string,
        @Body() updates: UpdateAgentDto,
        @CurrentUser() user: User
    ): Promise<Agent> {
        try {
            return await this.agentService.updateAgent(id, updates, user.id);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to update agent',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete agent' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT })
    async deleteAgent(
        @Param('id') id: string,
        @CurrentUser() user: User
    ): Promise<void> {
        try {
            await this.agentService.deleteAgent(id, user.id);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to delete agent',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
