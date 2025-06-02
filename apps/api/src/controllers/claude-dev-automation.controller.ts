import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ClaudeDevAutomationService, ClaudeDevAgent, ClaudeDevTask, ClaudeDevStatistics } from '../services/ClaudeDevAutomationService';
import { ClaudeDevTemplateRegistry, ClaudeDevTemplateUtils } from '../services/claude-dev-templates';

// DTOs for API requests and responses
export class CreateAgentDto {
  name?: string;
  description?: string;
  template: string;
  configuration?: any;
  permissions?: any;
  metadata?: Record<string, any>;
}

export class UpdateAgentDto {
  name?: string;
  description?: string;
  configuration?: any;
  permissions?: any;
  metadata?: Record<string, any>;
}

export class ExecuteTaskDto {
  type: 'code_review' | 'project_setup' | 'debug' | 'documentation' | 'test' | 'refactor' | 'deploy' | 'security' | 'analysis' | 'ui_ux';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  parameters?: Record<string, any>;
  metadata?: Record<string, any>;
}

export class CreateAgentBatchDto {
  agents: CreateAgentDto[];
}

export class TemplateCustomizationDto {
  templateId: string;
  configuration?: any;
  permissions?: any;
  metadata?: Record<string, any>;
}

@ApiTags('Claude Dev Automation')
@Controller('api/claude-dev-automation')
@ApiBearerAuth()
export class ClaudeDevAutomationController {
  private readonly logger = new Logger(ClaudeDevAutomationController.name);

  constructor(
    private readonly claudeDevService: ClaudeDevAutomationService,
  ) {}

  // Health and Status Endpoints
  
  @Get('health')
  @ApiOperation({ summary: 'Get service health status' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealthStatus() {
    try {
      const health = await this.claudeDevService.getHealthStatus();
      return {
        success: true,
        data: health,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      throw new HttpException(
        'Health check failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get service statistics' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Filter by tenant ID' })
  @ApiResponse({ status: 200, description: 'Service statistics' })
  async getStatistics(@Query('tenantId') tenantId?: string) {
    try {
      const stats = await this.claudeDevService.getStatistics(tenantId);
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get statistics', error);
      throw new HttpException(
        'Failed to retrieve statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Agent Management Endpoints

  @Post('agents/:tenantId')
  @ApiOperation({ summary: 'Create a new Claude Dev agent' })
  @ApiParam({ name: 'tenantId', description: 'Tenant identifier' })
  @ApiResponse({ status: 201, description: 'Agent created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async createAgent(
    @Param('tenantId') tenantId: string,
    @Body() createAgentDto: CreateAgentDto,
  ) {
    try {
      this.validateTenantId(tenantId);
      this.validateCreateAgentDto(createAgentDto);

      const agent = await this.claudeDevService.createAgent(tenantId, createAgentDto);
      
      return {
        success: true,
        data: agent,
        message: 'Agent created successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to create agent for tenant ${tenantId}`, error);
      
      if (error.message.includes('Template') && error.message.includes('not found')) {
        throw new HttpException(
          `Invalid template: ${error.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      
      throw new HttpException(
        error.message || 'Failed to create agent',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('agents/:tenantId')
  @ApiOperation({ summary: 'Get all agents for a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant identifier' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by agent status' })
  @ApiQuery({ name: 'template', required: false, description: 'Filter by template' })
  @ApiResponse({ status: 200, description: 'List of agents' })
  async getAgentsByTenant(
    @Param('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('template') template?: string,
  ) {
    try {
      this.validateTenantId(tenantId);
      
      let agents = await this.claudeDevService.getAgentsByTenant(tenantId);
      
      // Apply filters
      if (status) {
        agents = agents.filter(agent => agent.status === status);
      }
      if (template) {
        agents = agents.filter(agent => agent.template === template);
      }
      
      return {
        success: true,
        data: agents,
        count: agents.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get agents for tenant ${tenantId}`, error);
      throw new HttpException(
        'Failed to retrieve agents',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('agents/:tenantId/:agentId')
  @ApiOperation({ summary: 'Get a specific agent' })
  @ApiParam({ name: 'tenantId', description: 'Tenant identifier' })
  @ApiParam({ name: 'agentId', description: 'Agent identifier' })
  @ApiResponse({ status: 200, description: 'Agent details' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async getAgent(
    @Param('tenantId') tenantId: string,
    @Param('agentId') agentId: string,
  ) {
    try {
      this.validateTenantId(tenantId);
      this.validateAgentId(agentId);
      
      const agent = await this.claudeDevService.getAgent(agentId, tenantId);
      
      if (!agent) {
        throw new HttpException(
          `Agent ${agentId} not found for tenant ${tenantId}`,
          HttpStatus.NOT_FOUND,
        );
      }
      
      return {
        success: true,
        data: agent,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Failed to get agent ${agentId}`, error);
      throw new HttpException(
        'Failed to retrieve agent',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('agents/:tenantId/:agentId/tasks')
  @ApiOperation({ summary: 'Execute a task with an agent' })
  @ApiParam({ name: 'tenantId', description: 'Tenant identifier' })
  @ApiParam({ name: 'agentId', description: 'Agent identifier' })
  @ApiResponse({ status: 201, description: 'Task created and started' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async executeTask(
    @Param('tenantId') tenantId: string,
    @Param('agentId') agentId: string,
    @Body() executeTaskDto: ExecuteTaskDto,
  ) {
    try {
      this.validateTenantId(tenantId);
      this.validateAgentId(agentId);
      this.validateExecuteTaskDto(executeTaskDto);
      
      const task = await this.claudeDevService.executeTask(agentId, tenantId, executeTaskDto);
      
      return {
        success: true,
        data: task,
        message: 'Task created and started successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to execute task for agent ${agentId}`, error);
      
      if (error.message.includes('not found')) {
        throw new HttpException(
          error.message,
          HttpStatus.NOT_FOUND,
        );
      }
      
      if (error.message.includes('not active')) {
        throw new HttpException(
          error.message,
          HttpStatus.BAD_REQUEST,
        );
      }
      
      throw new HttpException(
        error.message || 'Failed to execute task',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('tasks/:tenantId')
  @ApiOperation({ summary: 'Get all tasks for a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant identifier' })
  @ApiQuery({ name: 'agentId', required: false, description: 'Filter by agent ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by task status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by task type' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results' })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  async getTasksByTenant(
    @Param('tenantId') tenantId: string,
    @Query('agentId') agentId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      this.validateTenantId(tenantId);
      
      let tasks = agentId 
        ? await this.claudeDevService.getTasksByAgent(agentId, tenantId)
        : await this.claudeDevService.getTasksByTenant(tenantId);
      
      // Apply filters
      if (status) {
        tasks = tasks.filter(task => task.status === status);
      }
      if (type) {
        tasks = tasks.filter(task => task.type === type);
      }
      
      // Apply limit
      if (limit) {
        const limitNum = parseInt(limit, 10);
        if (!isNaN(limitNum) && limitNum > 0) {
          tasks = tasks.slice(0, limitNum);
        }
      }
      
      return {
        success: true,
        data: tasks,
        count: tasks.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get tasks for tenant ${tenantId}`, error);
      throw new HttpException(
        'Failed to retrieve tasks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('agents/:tenantId/batch')
  @ApiOperation({ summary: 'Create multiple agents in batch' })
  @ApiParam({ name: 'tenantId', description: 'Tenant identifier' })
  @ApiResponse({ status: 201, description: 'Agents created successfully' })
  @ApiResponse({ status: 207, description: 'Partial success - some agents failed' })
  async createAgentBatch(
    @Param('tenantId') tenantId: string,
    @Body() createAgentBatchDto: CreateAgentBatchDto,
  ) {
    try {
      this.validateTenantId(tenantId);
      
      if (!createAgentBatchDto.agents || createAgentBatchDto.agents.length === 0) {
        throw new HttpException(
          'At least one agent configuration is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      // Validate each agent configuration
      createAgentBatchDto.agents.forEach((agentConfig, index) => {
        try {
          this.validateCreateAgentDto(agentConfig);
        } catch (error) {
          throw new HttpException(
            `Invalid configuration for agent ${index}: ${error.message}`,
            HttpStatus.BAD_REQUEST,
          );
        }
      });
      
      const createdAgents = await this.claudeDevService.createAgentBatch(
        tenantId,
        createAgentBatchDto.agents,
      );
      
      const hasFailures = createdAgents.length < createAgentBatchDto.agents.length;
      
      return {
        success: !hasFailures,
        data: createdAgents,
        message: hasFailures 
          ? `Created ${createdAgents.length} of ${createAgentBatchDto.agents.length} agents`
          : 'All agents created successfully',
        requested: createAgentBatchDto.agents.length,
        created: createdAgents.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Failed to create agent batch for tenant ${tenantId}`, error);
      throw new HttpException(
        'Failed to create agent batch',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Template Management Endpoints

  @Get('templates')
  @ApiOperation({ summary: 'Get all available templates' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'tag', required: false, description: 'Filter by tag' })
  @ApiResponse({ status: 200, description: 'List of available templates' })
  async getTemplates(
    @Query('category') category?: string,
    @Query('tag') tag?: string,
  ) {
    try {
      let templates = ClaudeDevTemplateRegistry.getAllTemplates();
      
      if (category) {
        templates = ClaudeDevTemplateRegistry.getTemplatesByCategory(category);
      }
      
      if (tag) {
        templates = ClaudeDevTemplateRegistry.getTemplatesByTag(tag);
      }
      
      // Return template summaries (without full prompts for brevity)
      const templateSummaries = templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        version: template.version,
        author: template.author,
        tags: template.tags,
        capabilities: template.capabilities,
        integrations: template.integrations,
      }));
      
      return {
        success: true,
        data: templateSummaries,
        count: templateSummaries.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get templates', error);
      throw new HttpException(
        'Failed to retrieve templates',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('templates/:templateId')
  @ApiOperation({ summary: 'Get detailed template information' })
  @ApiParam({ name: 'templateId', description: 'Template identifier' })
  @ApiResponse({ status: 200, description: 'Template details' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplate(@Param('templateId') templateId: string) {
    try {
      const template = ClaudeDevTemplateRegistry.getTemplate(templateId);
      
      if (!template) {
        throw new HttpException(
          `Template ${templateId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      
      return {
        success: true,
        data: template,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Failed to get template ${templateId}`, error);
      throw new HttpException(
        'Failed to retrieve template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('templates/:templateId/customize')
  @ApiOperation({ summary: 'Create agent configuration from template' })
  @ApiParam({ name: 'templateId', description: 'Template identifier' })
  @ApiResponse({ status: 200, description: 'Customized agent configuration' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async customizeTemplate(
    @Param('templateId') templateId: string,
    @Body() customization: TemplateCustomizationDto,
  ) {
    try {
      const agentConfig = ClaudeDevTemplateUtils.createAgentFromTemplate(
        templateId,
        {
          configuration: customization.configuration,
          permissions: customization.permissions,
          metadata: customization.metadata,
        },
      );
      
      return {
        success: true,
        data: agentConfig,
        message: 'Agent configuration created from template',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to customize template ${templateId}`, error);
      
      if (error.message.includes('not found')) {
        throw new HttpException(
          error.message,
          HttpStatus.NOT_FOUND,
        );
      }
      
      throw new HttpException(
        error.message || 'Failed to customize template',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('analytics/usage/:tenantId')
  @ApiOperation({ summary: 'Get usage analytics for tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant identifier' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period (24h, 7d, 30d)' })
  @ApiResponse({ status: 200, description: 'Usage analytics' })
  async getUsageAnalytics(
    @Param('tenantId') tenantId: string,
    @Query('period') period: string = '7d',
  ) {
    try {
      this.validateTenantId(tenantId);
      
      const stats = await this.claudeDevService.getStatistics(tenantId);
      const agents = await this.claudeDevService.getAgentsByTenant(tenantId);
      
      // Calculate usage analytics
      const analytics = {
        period,
        summary: {
          totalAgents: stats.totalAgents,
          activeAgents: stats.activeAgents,
          totalTasks: stats.totalTasks,
          successRate: stats.successRate,
          averageTaskDuration: stats.averageTaskDuration,
        },
        agentDistribution: {
          byTemplate: this.groupAgentsByTemplate(agents),
          byStatus: this.groupAgentsByStatus(agents),
        },
        performance: {
          resourceUsage: stats.resourceUsage,
          efficiency: this.calculateEfficiencyMetrics(stats),
        },
        trends: {
          // Mock trend data - in real implementation, this would come from historical data
          taskVolumeGrowth: '+15%',
          successRateTrend: '+2.3%',
          avgDurationTrend: '-8%',
        },
      };
      
      return {
        success: true,
        data: analytics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get usage analytics for tenant ${tenantId}`, error);
      throw new HttpException(
        'Failed to retrieve usage analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Private helper methods

  private validateTenantId(tenantId: string): void {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new HttpException('Valid tenant ID is required', HttpStatus.BAD_REQUEST);
    }
  }

  private validateAgentId(agentId: string): void {
    if (!agentId || agentId.trim().length === 0) {
      throw new HttpException('Valid agent ID is required', HttpStatus.BAD_REQUEST);
    }
  }

  private validateCreateAgentDto(dto: CreateAgentDto): void {
    if (!dto.template) {
      throw new HttpException('Template is required', HttpStatus.BAD_REQUEST);
    }

    // Validate template exists
    const template = ClaudeDevTemplateRegistry.getTemplate(dto.template);
    if (!template) {
      throw new HttpException(`Template '${dto.template}' not found`, HttpStatus.BAD_REQUEST);
    }

    // Validate name if provided
    if (dto.name && dto.name.trim().length === 0) {
      throw new HttpException('Agent name cannot be empty', HttpStatus.BAD_REQUEST);
    }
  }

  private validateExecuteTaskDto(dto: ExecuteTaskDto): void {
    const validTaskTypes = [
      'code_review', 'project_setup', 'debug', 'documentation', 
      'test', 'refactor', 'deploy', 'security', 'analysis', 'ui_ux'
    ];
    
    if (!dto.type || !validTaskTypes.includes(dto.type)) {
      throw new HttpException(
        `Invalid task type. Must be one of: ${validTaskTypes.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.priority) {
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(dto.priority)) {
        throw new HttpException(
          `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  private groupAgentsByTemplate(agents: ClaudeDevAgent[]): Record<string, number> {
    return agents.reduce((acc, agent) => {
      acc[agent.template] = (acc[agent.template] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupAgentsByStatus(agents: ClaudeDevAgent[]): Record<string, number> {
    return agents.reduce((acc, agent) => {
      acc[agent.status] = (acc[agent.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateEfficiencyMetrics(stats: ClaudeDevStatistics): any {
    return {
      taskThroughput: stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0,
      avgTaskDurationMinutes: Math.round(stats.averageTaskDuration / 60000), // Convert to minutes
      resourceEfficiency: {
        cpu: 100 - stats.resourceUsage.cpuUsage,
        memory: 100 - stats.resourceUsage.memoryUsage,
        overall: 100 - ((stats.resourceUsage.cpuUsage + stats.resourceUsage.memoryUsage) / 2),
      },
      qualityScore: stats.successRate,
    };
  }
}
