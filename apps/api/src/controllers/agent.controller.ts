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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AgentService } from '../services/agent.service';
import { 
    CreateAgentDto, 
    UpdateAgentDto, 
    AgentResponseDto,
    AgentStatus,
    AgentType
} from '@the-new-fuse/types';
import { User } from '@the-new-fuse/database';

@ApiTags('Agents')
@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentController {
    constructor(private readonly agentService: AgentService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new agent' })
    @ApiResponse({ status: HttpStatus.CREATED, type: AgentResponseDto })
    async createAgent(
        @Body() createAgentDto: CreateAgentDto,
        @CurrentUser() user: User
    ): Promise<AgentResponseDto> {
        try {
            // Add userId from authenticated user
            const agentData = {
                ...createAgentDto,
                userId: user.id
            };
            return await this.agentService.createAgent(agentData, user.id);
        } catch (error) {
            throw new HttpException(
                (error as Error).message || 'Failed to create agent',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get all agents' })
    @ApiResponse({ status: HttpStatus.OK, type: [AgentResponseDto] })
    async getAgents(
        @CurrentUser() user: User,
        @Query('type') type?: AgentType,
        @Query('status') status?: AgentStatus,
        @Query('search') search?: string
    ): Promise<AgentResponseDto[]> {
        try {
            if (type) {
                return this.agentService.findAgentsByType(type);
            }
            if (status) {
                return this.agentService.findAgentsByStatus(status);
            }
            if (search) {
                return this.agentService.searchAgents(user.id, search);
            }
            return this.agentService.findAgentsByUserId(user.id);
        } catch (error) {
            throw new HttpException(
                (error as Error).message || 'Failed to fetch agents',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('active')
    @ApiOperation({ summary: 'Get active agents' })
    @ApiResponse({ status: HttpStatus.OK, type: [AgentResponseDto] })
    async getActiveAgents(): Promise<AgentResponseDto[]> {
        try {
            return this.agentService.getActiveAgents();
        } catch (error) {
            throw new HttpException(
                (error as Error).message || 'Failed to fetch active agents',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('stats/types')
    @ApiOperation({ summary: 'Get agent count by type' })
    @ApiResponse({ status: HttpStatus.OK })
    async getAgentTypeCounts(): Promise<Record<string, number>> {
        try {
            return this.agentService.getAgentTypeCounts();
        } catch (error) {
            throw new HttpException(
                (error as Error).message || 'Failed to fetch agent type counts',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get agent by ID' })
    @ApiResponse({ status: HttpStatus.OK, type: AgentResponseDto })
    async getAgentById(
        @Param('id') id: string
    ): Promise<AgentResponseDto> {
        try {
            return await this.agentService.findAgentById(id);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                (error as Error).message || 'Failed to fetch agent',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get(':id/stats')
    @ApiOperation({ summary: 'Get agent statistics' })
    @ApiResponse({ status: HttpStatus.OK })
    async getAgentStats(
        @Param('id') id: string
    ): Promise<any> {
        try {
            return await this.agentService.getAgentStats(id);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                (error as Error).message || 'Failed to fetch agent stats',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update agent' })
    @ApiResponse({ status: HttpStatus.OK, type: AgentResponseDto })
    async updateAgent(
        @Param('id') id: string,
        @Body() updateAgentDto: UpdateAgentDto
    ): Promise<AgentResponseDto> {
        try {
            return await this.agentService.updateAgent(id, updateAgentDto);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                (error as Error).message || 'Failed to update agent',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Put(':id/activate')
    @ApiOperation({ summary: 'Activate agent' })
    @ApiResponse({ status: HttpStatus.OK, type: AgentResponseDto })
    async activateAgent(
        @Param('id') id: string
    ): Promise<AgentResponseDto> {
        try {
            return await this.agentService.activateAgent(id);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                (error as Error).message || 'Failed to activate agent',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Put(':id/deactivate')
    @ApiOperation({ summary: 'Deactivate agent' })
    @ApiResponse({ status: HttpStatus.OK, type: AgentResponseDto })
    async deactivateAgent(
        @Param('id') id: string
    ): Promise<AgentResponseDto> {
        try {
            return await this.agentService.deactivateAgent(id);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                (error as Error).message || 'Failed to deactivate agent',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Put(':id/pause')
    @ApiOperation({ summary: 'Pause agent' })
    @ApiResponse({ status: HttpStatus.OK, type: AgentResponseDto })
    async pauseAgent(
        @Param('id') id: string
    ): Promise<AgentResponseDto> {
        try {
            return await this.agentService.pauseAgent(id);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                (error as Error).message || 'Failed to pause agent',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Put(':id/busy')
    @ApiOperation({ summary: 'Mark agent as busy' })
    @ApiResponse({ status: HttpStatus.OK, type: AgentResponseDto })
    async markAgentBusy(
        @Param('id') id: string
    ): Promise<AgentResponseDto> {
        try {
            return await this.agentService.markAgentBusy(id);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                (error as Error).message || 'Failed to mark agent as busy',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Put(':id/error')
    @ApiOperation({ summary: 'Mark agent as error' })
    @ApiResponse({ status: HttpStatus.OK, type: AgentResponseDto })
    async markAgentError(
        @Param('id') id: string
    ): Promise<AgentResponseDto> {
        try {
            return await this.agentService.markAgentError(id);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                (error as Error).message || 'Failed to mark agent as error',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete agent' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT })
    async deleteAgent(
        @Param('id') id: string
    ): Promise<void> {
        try {
            await this.agentService.deleteAgent(id);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                (error as Error).message || 'Failed to delete agent',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
