/**
 * Roo Agent Automation Controller
 * 
 * REST API controller for managing Roo Code agents and teams
 * Integrates with The New Fuse platform's NestJS architecture
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
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RooAgentAutomationService } from '../services/RooAgentAutomationService';
import { AgentTemplate, AgentCreationOptions } from '../services/RooAgentAutomationService';

// DTOs for API documentation and validation
export class CreateAgentDto {
  templateKey: string;
  customizations?: Partial<AgentTemplate>;
  isGlobal?: boolean;
  projectPath?: string;
  autoStart?: boolean;
  mcpEnabled?: boolean;
}

export class CreateTeamDto {
  teamType: string;
}

export class UpdateAgentDto {
  name?: string;
  roleDefinition?: string;
  whenToUse?: string;
  customInstructions?: string;
  preferredModel?: string;
  temperature?: number;
  maxTokens?: number;
  categories?: string[];
  tags?: string[];
}

export class BatchCreateAgentsDto {
  requests: Array<{
    templateKey: string;
    customizations?: Partial<AgentTemplate>;
    options?: Omit<AgentCreationOptions, 'templateKey'>;
  }>;
}

@ApiTags('Roo Agent Automation')
@Controller('api/roo-agents')
export class RooAgentAutomationController {
  private readonly logger = new Logger(RooAgentAutomationController.name);

  constructor(private readonly agentService: RooAgentAutomationService) {}

  /**
   * Initialize the agent automation service
   */
  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Initialize the agent automation service',
    description: 'Initialize the service with optional workspace root path'
  })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        workspaceRoot: { type: 'string', description: 'Optional workspace root path' } 
      } 
    } 
  })
  async initialize(@Body() body: { workspaceRoot?: string }) {
    try {
      await this.agentService.initialize(body.workspaceRoot);
      return { 
        success: true, 
        message: 'Agent automation service initialized successfully' 
      };
    } catch (error) {
      this.logger.error('Failed to initialize service', error);
      throw new InternalServerErrorException('Failed to initialize service');
    }
  }

  /**
   * Get all available agent templates
   */
  @Get('templates')
  @ApiOperation({ 
    summary: 'Get available agent templates',
    description: 'Retrieve all pre-defined agent templates with their configurations'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of available agent templates',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          categories: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  })
  getAvailableTemplates() {
    try {
      return this.agentService.getAvailableTemplates();
    } catch (error) {
      this.logger.error('Failed to get templates', error);
      throw new InternalServerErrorException('Failed to retrieve templates');
    }
  }

  /**
   * Get all available team configurations
   */
  @Get('teams')
  @ApiOperation({ 
    summary: 'Get available team configurations',
    description: 'Retrieve all pre-defined team configurations'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of available team configurations'
  })
  getAvailableTeams() {
    try {
      return this.agentService.getAvailableTeams();
    } catch (error) {
      this.logger.error('Failed to get teams', error);
      throw new InternalServerErrorException('Failed to retrieve teams');
    }
  }

  /**
   * Create a new agent
   */
  @Post('agents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new agent',
    description: 'Create a new Roo Code agent from a template with optional customizations'
  })
  @ApiBody({ type: CreateAgentDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Agent created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        agent: { type: 'object' },
        message: { type: 'string' }
      }
    }
  })
  async createAgent(@Body() createAgentDto: CreateAgentDto) {
    try {
      const agent = await this.agentService.createAgent(createAgentDto);
      return {
        success: true,
        agent,
        message: `Agent '${agent.name}' created successfully`
      };
    } catch (error) {
      this.logger.error('Failed to create agent', error);
      if (error.message.includes('not found')) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Failed to create agent');
    }
  }

  /**
   * Create a development team
   */
  @Post('teams')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a development team',
    description: 'Create a complete development team with multiple agents'
  })
  @ApiBody({ type: CreateTeamDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Team created successfully'
  })
  async createTeam(@Body() createTeamDto: CreateTeamDto) {
    try {
      const agents = await this.agentService.createDevelopmentTeam(createTeamDto.teamType as any);
      return {
        success: true,
        team: createTeamDto.teamType,
        agents,
        message: `Team '${createTeamDto.teamType}' created with ${agents.length} agents`
      };
    } catch (error) {
      this.logger.error('Failed to create team', error);
      if (error.message.includes('not found')) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Failed to create team');
    }
  }

  /**
   * Batch create multiple agents
   */
  @Post('agents/batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Batch create multiple agents',
    description: 'Create multiple agents in a single request'
  })
  @ApiBody({ type: BatchCreateAgentsDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Batch operation completed'
  })
  async batchCreateAgents(@Body() batchDto: BatchCreateAgentsDto) {
    try {
      const result = await this.agentService.batchCreateAgents(batchDto.requests);
      return {
        success: true,
        ...result,
        message: `Batch operation completed: ${result.successful.length} successful, ${result.failed.length} failed`
      };
    } catch (error) {
      this.logger.error('Failed to batch create agents', error);
      throw new InternalServerErrorException('Failed to batch create agents');
    }
  }

  /**
   * Get all active agents
   */
  @Get('agents')
  @ApiOperation({ 
    summary: 'Get active agents',
    description: 'Retrieve all currently active agents'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of active agents'
  })
  getActiveAgents() {
    try {
      const activeAgents = this.agentService.getActiveAgents();
      return {
        success: true,
        agents: Array.from(activeAgents.values()),
        count: activeAgents.size
      };
    } catch (error) {
      this.logger.error('Failed to get active agents', error);
      throw new InternalServerErrorException('Failed to retrieve active agents');
    }
  }

  /**
   * Get a specific agent by slug
   */
  @Get('agents/:slug')
  @ApiOperation({ 
    summary: 'Get agent by slug',
    description: 'Retrieve a specific agent by its slug identifier'
  })
  @ApiParam({ name: 'slug', description: 'Agent slug identifier' })
  @ApiResponse({ 
    status: 200, 
    description: 'Agent details'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Agent not found'
  })
  getAgent(@Param('slug') slug: string) {
    try {
      const agent = this.agentService.getAgent(slug);
      if (!agent) {
        throw new NotFoundException(`Agent with slug '${slug}' not found`);
      }
      return {
        success: true,
        agent
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to get agent', error);
      throw new InternalServerErrorException('Failed to retrieve agent');
    }
  }

  /**
   * Update an existing agent
   */
  @Put('agents/:slug')
  @ApiOperation({ 
    summary: 'Update agent',
    description: 'Update an existing agent configuration'
  })
  @ApiParam({ name: 'slug', description: 'Agent slug identifier' })
  @ApiBody({ type: UpdateAgentDto })
  @ApiQuery({ name: 'isGlobal', required: false, type: 'boolean', description: 'Update global configuration' })
  @ApiQuery({ name: 'projectPath', required: false, type: 'string', description: 'Project path for project-specific updates' })
  @ApiResponse({ 
    status: 200, 
    description: 'Agent updated successfully'
  })
  async updateAgent(
    @Param('slug') slug: string,
    @Body() updateDto: UpdateAgentDto,
    @Query('isGlobal') isGlobal?: boolean,
    @Query('projectPath') projectPath?: string
  ) {
    try {
      if (!this.agentService.hasAgent(slug)) {
        throw new NotFoundException(`Agent with slug '${slug}' not found`);
      }

      await this.agentService.updateAgent(slug, updateDto, { isGlobal, projectPath });
      return {
        success: true,
        message: `Agent '${slug}' updated successfully`
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to update agent', error);
      throw new InternalServerErrorException('Failed to update agent');
    }
  }

  /**
   * Delete an agent
   */
  @Delete('agents/:slug')
  @ApiOperation({ 
    summary: 'Delete agent',
    description: 'Delete an existing agent configuration'
  })
  @ApiParam({ name: 'slug', description: 'Agent slug identifier' })
  @ApiQuery({ name: 'isGlobal', required: false, type: 'boolean', description: 'Delete global configuration' })
  @ApiQuery({ name: 'projectPath', required: false, type: 'string', description: 'Project path for project-specific deletion' })
  @ApiResponse({ 
    status: 200, 
    description: 'Agent deleted successfully'
  })
  async deleteAgent(
    @Param('slug') slug: string,
    @Query('isGlobal') isGlobal?: boolean,
    @Query('projectPath') projectPath?: string
  ) {
    try {
      if (!this.agentService.hasAgent(slug)) {
        throw new NotFoundException(`Agent with slug '${slug}' not found`);
      }

      await this.agentService.deleteAgent(slug, { isGlobal, projectPath });
      return {
        success: true,
        message: `Agent '${slug}' deleted successfully`
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to delete agent', error);
      throw new InternalServerErrorException('Failed to delete agent');
    }
  }

  /**
   * Get agent statistics
   */
  @Get('statistics')
  @ApiOperation({ 
    summary: 'Get agent statistics',
    description: 'Retrieve statistics about active agents and usage'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Agent statistics'
  })
  async getStatistics() {
    try {
      const stats = await this.agentService.getAgentStatistics();
      return {
        success: true,
        statistics: stats
      };
    } catch (error) {
      this.logger.error('Failed to get statistics', error);
      throw new InternalServerErrorException('Failed to retrieve statistics');
    }
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({ 
    summary: 'Health check',
    description: 'Check the health status of the agent automation service'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service health status'
  })
  getHealth() {
    try {
      return {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        activeAgents: this.agentService.getActiveAgents().size
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      throw new InternalServerErrorException('Service unhealthy');
    }
  }

  /**
   * Cleanup service resources
   */
  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cleanup service',
    description: 'Cleanup and disconnect the agent automation service'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service cleaned up successfully'
  })
  async cleanup() {
    try {
      await this.agentService.cleanup();
      return {
        success: true,
        message: 'Agent automation service cleaned up successfully'
      };
    } catch (error) {
      this.logger.error('Failed to cleanup service', error);
      throw new InternalServerErrorException('Failed to cleanup service');
    }
  }
}
