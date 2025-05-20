/**
 * Agent controller implementation
 * Provides standardized REST API endpoints for agent operations
 */

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
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { AgentService } from '../services/agent.service.js';
import { BaseController } from './base.controller.js';
// import { JwtAuthGuard } from '../guards/jwt-auth.guard.js'; // Replaced by ServiceOrUserAuthGuard
import { ServiceOrUserAuthGuard } from '../auth/guards/service-or-user-auth.guard.js'; // Import the new guard
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { Agent, AgentStatus, ApiResponse } from '@the-new-fuse/types';
import { CreateAgentDto } from './dto/create-agent.dto.js';
import { UpdateAgentDto } from './dto/update-agent.dto.js';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';

@Controller('agents')
@UseGuards(ServiceOrUserAuthGuard) // Use the new combined guard
@ApiTags('Agents')
export class AgentController extends BaseController {
  constructor(private readonly agentService: AgentService) {
    super(AgentController.name);
  }

  /**
   * Create a new agent
   * @param data Agent creation data
   * @param user Current user
   * @returns Created agent
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiBody({ type: CreateAgentDto })
  @SwaggerApiResponse({ status: 201, description: 'Agent created', type: Agent })
  async createAgent(
    @Body() data: CreateAgentDto,
    @CurrentUser() user?: any // Mark user as potentially undefined
  ): Promise<ApiResponse<Agent>> {
    // Service calls (API Key) won't have a user.id.
    // We need a way to represent the owner or context for service-created agents.
    // Option 1: Allow null/undefined userId for service calls (requires service changes)
    // Option 2: Define a system user ID for service calls
    // Option 3: Disallow agent creation via API key for now?
    // For now, let's assume the service needs adjustment or we throw if no user.
    if (!user?.id && !data.ownerId) { // Check if ownerId is provided in DTO as alternative
        this.logger.error('Agent creation requires a user context or an explicit ownerId for service calls.');
        throw new Error('Cannot create agent without user context or ownerId.');
    }
    const ownerId = user?.id || data.ownerId; // Prefer user.id, fallback to DTO field if needed
    return this.handleAsync(
      () => this.agentService.createAgent(data, ownerId), // Pass resolved ownerId
      'Failed to create agent'
    );
  }

  /**
   * Get all agents for the current user
   * @param user Current user
   * @param capability Optional capability filter
   * @returns Array of agents
   */
  @Get()
  @ApiOperation({ summary: 'Get all agents for the current user' })
  @SwaggerApiResponse({ status: 200, description: 'List of agents', type: [Agent] })
  @ApiQuery({ name: 'capability', required: false, type: String, description: 'Optional capability filter' })
  async getAgents(
    @CurrentUser() user?: any, // Mark user as potentially undefined
    @Query('capability') capability?: string,
    @Query('status') status?: AgentStatus, // Allow filtering by status (useful for services)
    @Query('type') type?: string, // Allow filtering by type
    @Query('name') name?: string // Allow filtering by name
  ): Promise<ApiResponse<Agent[]>> {
    // Service calls might want to find agents without a specific user context,
    // e.g., find all agents of a certain type or status.
    // We need to decide if GET /agents requires a user context for service calls.
    // Option 1: Allow service calls to list all agents (potentially dangerous)
    // Option 2: Require filters (like type/status) for service calls without user context
    // Option 3: Disallow listing without user context for now.
    // Let's assume for now service calls can list agents but might need filters.
    // The service layer needs to handle the case where userId is undefined.
    const userId = user?.id; // Pass undefined if no user
    const filters = { capability, status, type, name }; // Pass filters to service

    return this.handleAsync(
      () => this.agentService.findAgents(filters, userId), // Modify service method signature if needed
      'Failed to get agents'
    );
  }

  /**
   * Get active agents for the current user
   * @param user Current user
   * @returns Array of active agents
   */
  @Get('active')
  @ApiOperation({ summary: 'Get active agents for the current user' })
  @SwaggerApiResponse({ status: 200, description: 'List of active agents', type: [Agent] })
  // This endpoint seems user-specific, might not make sense for service calls?
  // Or maybe it means active agents the service *owns* or *manages*?
  // Let's keep it user-focused for now and potentially add a different endpoint for services if needed.
  @Get('active')
  @ApiOperation({ summary: 'Get active agents for the current user' })
  @SwaggerApiResponse({ status: 200, description: 'List of active agents', type: [Agent] })
  async getActiveAgents(
    @CurrentUser() user: any // Keep requiring user for this specific endpoint
  ): Promise<ApiResponse<Agent[]>> {
     if (!user?.id) {
        throw new Error('Cannot get active agents without user context.');
    }
    return this.handleAsync(
      () => this.agentService.getActiveAgents(user.id),
      'Failed to get active agents'
    );
  }

  /**
   * Get agent by ID
   * @param id Agent ID
   * @param user Current user
   * @returns Agent
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @SwaggerApiResponse({ status: 200, description: 'Agent details', type: Agent })
  @SwaggerApiResponse({ status: 404, description: 'Agent not found' })
  async getAgentById(
    @Param('id') id: string,
    @CurrentUser() user?: any // Mark user as potentially undefined
  ): Promise<ApiResponse<Agent>> {
    // Service calls should be able to get any agent by ID, regardless of user.
    // The service layer needs to handle the case where userId is undefined.
    const userId = user?.id; // Pass undefined if no user
    return this.handleAsync(
      () => this.agentService.getAgentById(id, userId), // Modify service method signature if needed
      'Failed to get agent'
    );
  }

  /**
   * Update an agent
   * @param id Agent ID
   * @param updates Agent update data
   * @param user Current user
   * @returns Updated agent
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update an agent' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiBody({ type: UpdateAgentDto })
  @SwaggerApiResponse({ status: 200, description: 'Agent updated', type: Agent })
  @SwaggerApiResponse({ status: 404, description: 'Agent not found' })
  async updateAgent(
    @Param('id') id: string,
    @Body() updates: UpdateAgentDto,
    @CurrentUser() user?: any // Mark user as potentially undefined
  ): Promise<ApiResponse<Agent>> {
    // Service calls should be able to update agents they manage.
    // How do we authorize this?
    // Option 1: Allow service calls to update *any* agent (dangerous).
    // Option 2: Service layer checks if the agent is 'owned' by the service (how?).
    // Option 3: Rely on user context for updates for now.
    // Let's assume the service layer needs to handle authorization based on context (user or service).
    const userId = user?.id; // Pass undefined if no user
    return this.handleAsync(
      () => this.agentService.updateAgent(id, updates, userId), // Modify service method signature if needed
      'Failed to update agent'
    );
  }

  /**
   * Update agent status
   * @param id Agent ID
   * @param status New agent status
   * @param user Current user
   * @returns Updated agent
   */
  @Put(':id/status')
  @ApiOperation({ summary: 'Update agent status' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiBody({ schema: { properties: { status: { type: 'string' } }, required: ['status'] } })
  @SwaggerApiResponse({ status: 200, description: 'Agent status updated', type: Agent })
  @SwaggerApiResponse({ status: 404, description: 'Agent not found' })
  async updateAgentStatus(
    @Param('id') id: string,
    @Body('status') status: AgentStatus,
    @CurrentUser() user?: any // Mark user as potentially undefined
  ): Promise<ApiResponse<Agent>> {
    // Service calls (like the agent itself via MCPRegistryService) need to update status.
    // Authorization check might be less strict here, or handled in the service layer.
    const userId = user?.id; // Pass undefined if no user
    return this.handleAsync(
      () => this.agentService.updateAgentStatus(id, status, userId), // Modify service method signature if needed
      'Failed to update agent status'
    );
  }

  /**
   * Delete an agent
   * @param id Agent ID
   * @param user Current user
   * @returns Success/failure response
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an agent' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @SwaggerApiResponse({ status: 204, description: 'Agent deleted' })
  @SwaggerApiResponse({ status: 404, description: 'Agent not found' })
  // Deleting agents via API key seems risky. Let's keep this user-only for now.
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an agent (User only)' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @SwaggerApiResponse({ status: 204, description: 'Agent deleted' })
  @SwaggerApiResponse({ status: 404, description: 'Agent not found' })
  async deleteAgent(
    @Param('id') id: string,
    @CurrentUser() user: any // Keep requiring user for delete
  ): Promise<ApiResponse<void>> {
     if (!user?.id) {
        throw new Error('Cannot delete agent without user context.');
    }
    return this.handleAsync(
      () => this.agentService.deleteAgent(id, user.id),
      'Failed to delete agent'
    );
  }
}
