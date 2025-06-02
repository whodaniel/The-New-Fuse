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
  Request,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClaudeDevAutomationService, AutomationRequest, AutomationResult, ClaudeDevTemplate } from '../services/ClaudeDevAutomationService';

// DTOs for request/response validation
export class CreateAutomationDto {
  templateId: string;
  parameters: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string; // ISO date string
  context?: {
    projectId?: string;
    workflowId?: string;
    parentTaskId?: string;
  };
}

export class CreateTemplateDto {
  name: string;
  description: string;
  category: 'development' | 'analysis' | 'automation' | 'communication';
  prompt: string;
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    defaultValue?: any;
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      options?: string[];
    };
  }>;
  outputFormat?: 'json' | 'markdown' | 'code' | 'plain';
  estimatedTokens: number;
  tags: string[];
}

// Mock AuthGuard - replace with your actual authentication guard
export class AuthGuard {
  canActivate(): boolean {
    return true; // Mock implementation
  }
}

@ApiTags('Claude Dev Automation')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/claude-dev')
export class ClaudeDevAutomationController {
  private readonly logger = new Logger(ClaudeDevAutomationController.name);

  constructor(
    private readonly claudeDevService: ClaudeDevAutomationService,
  ) {}

  @Get('templates')
  @ApiOperation({ summary: 'List all available automation templates' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by template category' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async listTemplates(
    @Query('category') category?: string,
  ): Promise<{ templates: ClaudeDevTemplate[] }> {
    try {
      const templates = await this.claudeDevService.listTemplates(category);
      return { templates };
    } catch (error) {
      this.logger.error('Failed to list templates:', error);
      throw new HttpException(
        'Failed to retrieve templates',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('templates/:templateId')
  @ApiOperation({ summary: 'Get specific template details' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplate(
    @Param('templateId') templateId: string,
  ): Promise<{ template: ClaudeDevTemplate }> {
    try {
      const template = await this.claudeDevService.getTemplate(templateId);
      
      if (!template) {
        throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
      }

      return { template };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      this.logger.error(`Failed to get template ${templateId}:`, error);
      throw new HttpException(
        'Failed to retrieve template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create a custom automation template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid template data' })
  async createTemplate(
    @Body() createTemplateDto: CreateTemplateDto,
    @Request() req: any,
  ): Promise<{ templateId: string; message: string }> {
    try {
      // Validate template data
      if (!createTemplateDto.name || !createTemplateDto.prompt) {
        throw new HttpException(
          'Template name and prompt are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!createTemplateDto.parameters || !Array.isArray(createTemplateDto.parameters)) {
        throw new HttpException(
          'Template parameters must be an array',
          HttpStatus.BAD_REQUEST,
        );
      }

      const templateId = await this.claudeDevService.createCustomTemplate(createTemplateDto);
      
      this.logger.log(`User ${req.user?.id} created template ${templateId}`);
      
      return {
        templateId,
        message: 'Template created successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      this.logger.error('Failed to create template:', error);
      throw new HttpException(
        'Failed to create template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('templates/:templateId')
  @ApiOperation({ summary: 'Delete a custom template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 403, description: 'Cannot delete built-in templates' })
  async deleteTemplate(
    @Param('templateId') templateId: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    try {
      const deleted = await this.claudeDevService.deleteTemplate(templateId);
      
      if (!deleted) {
        throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
      }

      this.logger.log(`User ${req.user?.id} deleted template ${templateId}`);
      
      return { message: 'Template deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      this.logger.error(`Failed to delete template ${templateId}:`, error);
      throw new HttpException(
        error.message || 'Failed to delete template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('automations')
  @ApiOperation({ summary: 'Execute an automation using a template' })
  @ApiResponse({ status: 201, description: 'Automation started successfully' })
  @ApiResponse({ status: 400, description: 'Invalid automation request' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async executeAutomation(
    @Body() createAutomationDto: CreateAutomationDto,
    @Request() req: any,
  ): Promise<{ automation: AutomationResult }> {
    try {
      // Validate request
      if (!createAutomationDto.templateId) {
        throw new HttpException(
          'Template ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!createAutomationDto.parameters || typeof createAutomationDto.parameters !== 'object') {
        throw new HttpException(
          'Parameters must be an object',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create automation request
      const automationRequest: AutomationRequest = {
        templateId: createAutomationDto.templateId,
        parameters: createAutomationDto.parameters,
        userId: req.user?.id || 'anonymous',
        priority: createAutomationDto.priority || 'medium',
        deadline: createAutomationDto.deadline ? new Date(createAutomationDto.deadline) : undefined,
        context: createAutomationDto.context,
      };

      const automation = await this.claudeDevService.executeAutomation(automationRequest);
      
      this.logger.log(`User ${automationRequest.userId} started automation ${automation.id}`);
      
      return { automation };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      this.logger.error('Failed to execute automation:', error);
      throw new HttpException(
        error.message || 'Failed to execute automation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('automations')
  @ApiOperation({ summary: 'List user automations' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results' })
  @ApiResponse({ status: 200, description: 'Automations retrieved successfully' })
  async listAutomations(
    @Query('limit') limit?: string,
    @Request() req: any,
  ): Promise<{ automations: AutomationResult[] }> {
    try {
      const userId = req.user?.id || 'anonymous';
      const maxResults = limit ? parseInt(limit, 10) : 50;
      
      if (maxResults > 200) {
        throw new HttpException(
          'Limit cannot exceed 200',
          HttpStatus.BAD_REQUEST,
        );
      }

      const automations = await this.claudeDevService.listAutomations(userId, maxResults);
      
      return { automations };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      this.logger.error('Failed to list automations:', error);
      throw new HttpException(
        'Failed to retrieve automations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('automations/:automationId')
  @ApiOperation({ summary: 'Get specific automation result' })
  @ApiResponse({ status: 200, description: 'Automation result retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Automation not found' })
  async getAutomation(
    @Param('automationId') automationId: string,
    @Request() req: any,
  ): Promise<{ automation: AutomationResult }> {
    try {
      const automation = await this.claudeDevService.getAutomationResult(automationId);
      
      if (!automation) {
        throw new HttpException('Automation not found', HttpStatus.NOT_FOUND);
      }

      // Verify user has access to this automation
      const userId = req.user?.id || 'anonymous';
      if (automation.metadata.userId !== userId) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      return { automation };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      this.logger.error(`Failed to get automation ${automationId}:`, error);
      throw new HttpException(
        'Failed to retrieve automation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('automations/:automationId/cancel')
  @ApiOperation({ summary: 'Cancel a running automation' })
  @ApiResponse({ status: 200, description: 'Automation cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Automation not found' })
  @ApiResponse({ status: 400, description: 'Automation cannot be cancelled' })
  async cancelAutomation(
    @Param('automationId') automationId: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    try {
      const userId = req.user?.id || 'anonymous';
      const cancelled = await this.claudeDevService.cancelAutomation(automationId, userId);
      
      if (!cancelled) {
        throw new HttpException(
          'Automation not found or cannot be cancelled',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`User ${userId} cancelled automation ${automationId}`);
      
      return { message: 'Automation cancelled successfully' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      this.logger.error(`Failed to cancel automation ${automationId}:`, error);
      throw new HttpException(
        'Failed to cancel automation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user automation usage statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getUserStats(
    @Request() req: any,
  ): Promise<{
    stats: {
      totalAutomations: number;
      successfulAutomations: number;
      failedAutomations: number;
      totalTokensUsed: number;
      totalCost: number;
      averageExecutionTime: number;
    };
  }> {
    try {
      const userId = req.user?.id || 'anonymous';
      const stats = await this.claudeDevService.getUsageStats(userId);
      
      return { stats };
    } catch (error) {
      this.logger.error('Failed to get user stats:', error);
      throw new HttpException(
        'Failed to retrieve statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for Claude Dev automation service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
