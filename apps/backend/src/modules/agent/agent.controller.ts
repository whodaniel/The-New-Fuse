import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Agent, AgentStatus, CreateAgentDto, UpdateAgentDto } from '@the-new-fuse/types';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { AgentService } from './agent.service.js';
import { SearchAgentDto } from './dto/search-agent.dto.js';

@ApiTags('Agents')
@ApiBearerAuth()
@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiResponse({ status: 201, description: 'The agent has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 409, description: 'Conflict - Agent name already exists.' })
  async createAgent(@Body() data: CreateAgentDto, @CurrentUser() user: any): Promise<Agent> {
    return this.agentService.createAgent(data, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all agents for the current user' })
  @ApiQuery({ name: 'capability', required: false, description: 'Filter by capability' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'A paginated list of agents.' })
  async getAgents(
    @CurrentUser() user: any,
    @Query('capability') capability?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50
  ) {
    if (capability) {
      return this.agentService.getAgentsByCapability(capability, user.id);
    }
    return this.agentService.getAgents(user.id, Number(page), Number(limit));
  }

  @Get('search')
  @ApiOperation({ summary: 'Search for agents' })
  @ApiResponse({ status: 200, description: 'A list of agents matching the search criteria.' })
  async searchAgents(@Query() query: SearchAgentDto, @CurrentUser() user: any) {
    return this.agentService.searchAgents(query, user.id);
  }

  @Get('active')
  @ApiOperation({ summary: 'List all active agents for the current user' })
  @ApiResponse({ status: 200, description: 'A list of active agents.' })
  async getActiveAgents(@CurrentUser() user: any): Promise<Agent[]> {
    return this.agentService.getActiveAgents(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single agent by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the agent' })
  @ApiResponse({ status: 200, description: 'The requested agent.' })
  @ApiResponse({ status: 404, description: 'Agent not found.' })
  async getAgentById(@Param('id') id: string, @CurrentUser() user: any): Promise<Agent> {
    return this.agentService.getAgentById(id, user.id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: "Get an agent's real-time status" })
  @ApiParam({ name: 'id', description: 'The ID of the agent' })
  @ApiResponse({ status: 200, description: 'The agent status.' })
  @ApiResponse({ status: 404, description: 'Agent not found.' })
  async getAgentStatus(
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<{ status: AgentStatus }> {
    return this.agentService.getAgentStatus(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an agent' })
  @ApiParam({ name: 'id', description: 'The ID of the agent' })
  @ApiResponse({ status: 200, description: 'The updated agent.' })
  @ApiResponse({ status: 404, description: 'Agent not found.' })
  @ApiResponse({ status: 409, description: 'Conflict - Agent name already exists.' })
  async updateAgent(
    @Param('id') id: string,
    @Body() updates: UpdateAgentDto,
    @CurrentUser() user: any
  ): Promise<Agent> {
    return this.agentService.updateAgent(id, updates, user.id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start/activate an agent' })
  @ApiParam({ name: 'id', description: 'The ID of the agent' })
  @ApiResponse({ status: 200, description: 'The agent with status set to ACTIVE.' })
  @ApiResponse({ status: 404, description: 'Agent not found.' })
  async startAgent(@Param('id') id: string, @CurrentUser() user: any): Promise<Agent> {
    return this.agentService.startAgent(id, user.id);
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Stop/deactivate an agent' })
  @ApiParam({ name: 'id', description: 'The ID of the agent' })
  @ApiResponse({ status: 200, description: 'The agent with status set to INACTIVE.' })
  @ApiResponse({ status: 404, description: 'Agent not found.' })
  async stopAgent(@Param('id') id: string, @CurrentUser() user: any): Promise<Agent> {
    return this.agentService.stopAgent(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete an agent' })
  @ApiParam({ name: 'id', description: 'The ID of the agent' })
  @ApiResponse({ status: 204, description: 'The agent has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Agent not found.' })
  async deleteAgent(@Param('id') id: string, @CurrentUser() user: any): Promise<void> {
    return this.agentService.deleteAgent(id, user.id);
  }
}
