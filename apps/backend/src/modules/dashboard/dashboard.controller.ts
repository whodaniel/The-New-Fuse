import { Body, Controller, Get, Logger, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { drizzleUserRepository } from '@the-new-fuse/database';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AgentDirectoryService } from '../agent-registry/services/agent-directory.service';
import { AgentRegistrationService } from '../agent-registry/services/agent-registration.service';
import { AgentResponseDto, CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';

@ApiTags('Dashboard')
@Controller('api/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(
    private readonly agentRegistrationService: AgentRegistrationService,
    private readonly agentDirectoryService: AgentDirectoryService
  ) {}

  // ============================================================================
  // AGENT MANAGEMENT ENDPOINTS
  // ============================================================================

  @Get('agents')
  @ApiOperation({
    summary: 'Get all agents for current user',
    description: 'Retrieve all agents registered by the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Agents retrieved successfully',
    type: [AgentResponseDto],
  })
  async getUserAgents(@CurrentUser() user: any): Promise<AgentResponseDto[]> {
    this.logger.log(`Fetching agents for user: ${user.id}`);

    try {
      // Get all agent registrations for the current user
      const registrations = await this.agentRegistrationService.getRegistrationsByUser(user.id);

      // Map to response DTO
      return registrations.map((reg) => ({
        id: reg.agent.id,
        name: reg.agent.name,
        description: reg.agent.description,
        type: reg.agent.type,
        status: reg.agent.status,
        createdAt: reg.agent.createdAt,
        updatedAt: reg.agent.updatedAt,
        capabilities: reg.capabilities.map((cap) => ({
          name: cap.capabilityName,
          type: cap.capabilityType,
          version: cap.version,
          description: cap.description,
        })),
        registrationStatus: reg.verificationStatus,
        onboardingStatus: reg.onboardingStatus,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch agents for user ${user.id}: ${error.message}`);
      throw error;
    }
  }

  @Post('agents')
  @ApiOperation({
    summary: 'Create a new agent',
    description: 'Register a new agent for the current user',
  })
  @ApiResponse({
    status: 201,
    description: 'Agent created successfully',
    type: AgentResponseDto,
  })
  async createAgent(
    @Body() createAgentDto: CreateAgentDto,
    @CurrentUser() user: any
  ): Promise<AgentResponseDto> {
    this.logger.log(`Creating new agent: ${createAgentDto.name} for user: ${user.id}`);

    try {
      // Register the agent
      const registration = await this.agentRegistrationService.registerAgent(
        {
          name: createAgentDto.name,
          description: createAgentDto.description,
          type: createAgentDto.type,
          capabilities: (createAgentDto.capabilities || []).map((cap) => ({
            name: cap,
            type: 'custom',
            version: '1.0.0',
            description: `Capability: ${cap}`,
          })),
          version: createAgentDto.version || '1.0.0',
          author: user.email,
          metadata: createAgentDto.metadata || {},
        },
        user.id
      );

      // Create directory entry
      await this.agentDirectoryService.createDirectoryEntry({
        agentId: registration.agentId,
        displayName: createAgentDto.name,
        description: createAgentDto.description,
        category: this.inferCategory(createAgentDto.capabilities || []),
        tags: this.extractTags(createAgentDto),
        isPublic: false,
        isVerified: false,
        userId: user.id,
      });

      return {
        id: registration.agentId,
        name: createAgentDto.name,
        description: createAgentDto.description,
        type: createAgentDto.type,
        status: 'INITIALIZING',
        createdAt: new Date(),
        updatedAt: new Date(),
        capabilities: createAgentDto.capabilities || [],
        registrationStatus: registration.verificationStatus,
        onboardingStatus: registration.onboardingStatus,
      };
    } catch (error) {
      this.logger.error(`Failed to create agent: ${error.message}`);
      throw error;
    }
  }

  @Get('agents/:id')
  @ApiOperation({
    summary: 'Get agent details',
    description: 'Retrieve detailed information about a specific agent',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent details retrieved successfully',
    type: AgentResponseDto,
  })
  async getAgentDetails(
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<AgentResponseDto> {
    this.logger.log(`Fetching agent details: ${id} for user: ${user.id}`);

    try {
      // Verify the agent belongs to the user
      const registration = await this.agentRegistrationService.getRegistrationByAgentId(id);

      if (registration.agent.userId !== user.id) {
        throw new Error('Agent does not belong to current user');
      }

      return {
        id: registration.agent.id,
        name: registration.agent.name,
        description: registration.agent.description,
        type: registration.agent.type,
        status: registration.agent.status,
        createdAt: registration.agent.createdAt,
        updatedAt: registration.agent.updatedAt,
        capabilities: registration.capabilities.map((cap) => ({
          name: cap.capabilityName,
          type: cap.capabilityType,
          version: cap.version,
          description: cap.description,
        })),
        registrationStatus: registration.verificationStatus,
        onboardingStatus: registration.onboardingStatus,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch agent details: ${error.message}`);
      throw error;
    }
  }

  @Put('agents/:id')
  @ApiOperation({
    summary: 'Update agent',
    description: 'Update agent information and configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent updated successfully',
    type: AgentResponseDto,
  })
  async updateAgent(
    @Param('id') id: string,
    @Body() updateAgentDto: UpdateAgentDto,
    @CurrentUser() user: any
  ): Promise<AgentResponseDto> {
    this.logger.log(`Updating agent: ${id} for user: ${user.id}`);

    try {
      // Verify the agent belongs to the user
      const registration = await this.agentRegistrationService.getRegistrationByAgentId(id);

      if (registration.agent.userId !== user.id) {
        throw new Error('Agent does not belong to current user');
      }

      // Update the agent
      const updatedAgent = await this.agentRegistrationService.updateAgent(id, updateAgentDto);

      // Update directory entry
      await this.agentDirectoryService.updateDirectoryEntry(id, {
        displayName: updateAgentDto.name || registration.agent.name,
        description: updateAgentDto.description || registration.agent.description,
        category: this.inferCategory(
          updateAgentDto.capabilities || registration.capabilities.map((c) => c.capabilityName)
        ),
        tags: this.extractTags(updateAgentDto),
      });

      return {
        id: updatedAgent.id,
        name: updatedAgent.name,
        description: updatedAgent.description,
        type: updatedAgent.type,
        status: updatedAgent.status,
        createdAt: updatedAgent.createdAt,
        updatedAt: updatedAgent.updatedAt,
        capabilities: updatedAgent.capabilities,
        registrationStatus: registration.verificationStatus,
        onboardingStatus: registration.onboardingStatus,
      };
    } catch (error) {
      this.logger.error(`Failed to update agent: ${error.message}`);
      throw error;
    }
  }

  @Post('agents/:id/:action')
  @ApiOperation({
    summary: 'Perform agent action',
    description: 'Start, stop, pause, or delete an agent',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent action executed successfully',
  })
  async performAgentAction(
    @Param('id') id: string,
    @Param('action') action: 'start' | 'stop' | 'pause' | 'delete',
    @CurrentUser() user: any
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Performing action '${action}' on agent: ${id} for user: ${user.id}`);

    try {
      // Verify the agent belongs to the user
      const registration = await this.agentRegistrationService.getRegistrationByAgentId(id);

      if (registration.agent.userId !== user.id) {
        throw new Error('Agent does not belong to current user');
      }

      let result;
      switch (action) {
        case 'start':
          result = await this.agentRegistrationService.startAgent(id);
          break;
        case 'stop':
          result = await this.agentRegistrationService.stopAgent(id);
          break;
        case 'pause':
          result = await this.agentRegistrationService.pauseAgent(id);
          break;
        case 'delete':
          result = await this.agentRegistrationService.deleteAgent(id);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      return {
        success: true,
        message: `Agent ${action}ed successfully`,
      };
    } catch (error) {
      this.logger.error(`Failed to perform action on agent: ${error.message}`);
      throw error;
    }
  }

  // ============================================================================
  // SETTINGS MANAGEMENT ENDPOINTS
  // ============================================================================

  @Get('settings')
  @ApiOperation({
    summary: 'Get user settings',
    description: 'Retrieve all settings for the current user',
  })
  async getUserSettings(@CurrentUser() user: any): Promise<any> {
    this.logger.log(`Fetching settings for user: ${user.id}`);

    try {
      // Get user preferences from database
      const userWithPreferences = await drizzleUserRepository.findById(user.id);

      if (!userWithPreferences) {
        throw new Error('User not found');
      }

      return {
        userId: userWithPreferences.id,
        email: userWithPreferences.email,
        name: userWithPreferences.name,
        preferences: userWithPreferences.preferences || {},
        settings: {}, // Settings column appears to be missing in new schema
      };
    } catch (error) {
      this.logger.error(`Failed to fetch settings: ${error.message}`);
      throw error;
    }
  }

  @Put('settings')
  @ApiOperation({
    summary: 'Update user settings',
    description: 'Update settings and preferences for the current user',
  })
  async updateUserSettings(@CurrentUser() user: any, @Body() settingsData: any): Promise<any> {
    this.logger.log(`Updating settings for user: ${user.id}`);

    try {
      // Update user settings in database
      const updatedUser = await drizzleUserRepository.update(user.id, {
        preferences: settingsData.preferences,
        // settings: settingsData.settings, // Ignoring settings as column missing
      });

      return {
        userId: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        preferences: updatedUser.preferences,
        settings: {},
      };
    } catch (error) {
      this.logger.error(`Failed to update settings: ${error.message}`);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private inferCategory(capabilities: string[]): string {
    const capNames = capabilities.map((c) => c.toLowerCase());

    if (capNames.some((c) => c.includes('code') || c.includes('development'))) {
      return 'development';
    }
    if (capNames.some((c) => c.includes('analytics') || c.includes('analysis'))) {
      return 'analytics';
    }
    if (capNames.some((c) => c.includes('automation') || c.includes('workflow'))) {
      return 'automation';
    }
    if (capNames.some((c) => c.includes('chat') || c.includes('conversation'))) {
      return 'communication';
    }

    return 'general';
  }

  private extractTags(data: any): string[] {
    const tags: string[] = [];

    // Add capability-based tags
    if (data.capabilities) {
      data.capabilities.forEach((cap: any) => {
        tags.push(cap.name);
        if (cap.type) tags.push(cap.type);
      });
    }

    // Add version tag
    if (data.version) {
      tags.push(`v${data.version}`);
    }

    // Remove duplicates and limit to 10 tags
    return [...new Set(tags)].slice(0, 10);
  }
}
