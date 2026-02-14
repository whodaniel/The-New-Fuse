/**
 * GitHub Copilot Integration Controller
 *
 * REST API controller for managing GitHub Copilot VS Code integration
 * Provides comprehensive endpoints for chat participants, commands, and multi-tenant management
 */

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';

// User roles enum - aligned with Drizzle schema
enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  AGENCY_OWNER = 'AGENCY_OWNER',
  AGENCY_ADMIN = 'AGENCY_ADMIN',
  AGENCY_MANAGER = 'AGENCY_MANAGER',
  AGENT_OPERATOR = 'AGENT_OPERATOR',
  TENANT_ADMIN = 'TENANT_ADMIN',
}

import { Roles } from '@the-new-fuse/core/decorators/roles.decorator';
import { TenantGuard } from '@the-new-fuse/core/guards/tenant.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Tenant } from '../decorators/tenant.decorator';
import { CopilotIntegrationService } from '../services/CopilotIntegrationService';

// DTOs for API documentation and validation
export class CreateChatParticipantDto {
  id: string;
  name: string;
  description?: string;
  fullName?: string;
  iconPath?: string;
  isSticky?: boolean;
  sampleRequest?: string;
  commands?: Array<{
    name: string;
    description: string;
    sampleRequest?: string;
  }>;
  followupProvider?: {
    provideFollowups: boolean;
    supportedCommands?: string[];
  };
}

export class UpdateChatParticipantDto {
  name?: string;
  description?: string;
  fullName?: string;
  iconPath?: string;
  isSticky?: boolean;
  sampleRequest?: string;
  commands?: Array<{
    name: string;
    description: string;
    sampleRequest?: string;
  }>;
  followupProvider?: {
    provideFollowups: boolean;
    supportedCommands?: string[];
  };
}

export class ChatRequestDto {
  participant: string;
  prompt: string;
  command?: string;
  references?: Array<{
    id?: string;
    uri?: string;
    range?: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
  }>;
  location?: {
    uri: string;
    range?: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
  };
  context?: Record<string, any>;
}

export class ChatResponseDto {
  markdown?: string;
  anchor?: any;
  commandFollowups?: Array<{
    commandId: string;
    title: string;
    tooltip?: string;
  }>;
  textFollowups?: Array<{
    text: string;
    tooltip?: string;
  }>;
  progress?: {
    location: any;
    message: string;
  };
}

export class CreateAgentTemplateDto {
  id: string;
  name: string;
  description: string;
  category: string;
  tags?: string[];
  participantConfig: CreateChatParticipantDto;
  capabilities?: string[];
  defaultCommands?: Array<{
    name: string;
    description: string;
    handler: string;
  }>;
  customInstructions?: string;
  modelPreferences?: {
    preferredModel?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export class UpdateAgentTemplateDto {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  participantConfig?: UpdateChatParticipantDto;
  capabilities?: string[];
  defaultCommands?: Array<{
    name: string;
    description: string;
    handler: string;
  }>;
  customInstructions?: string;
  modelPreferences?: {
    preferredModel?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export class BatchOperationDto {
  participantIds?: string[];
  action: 'activate' | 'deactivate' | 'refresh' | 'remove';
  options?: Record<string, any>;
}

export class IntegrationConfigDto {
  autoRegisterParticipants?: boolean;
  defaultParticipantConfig?: Partial<CreateChatParticipantDto>;
  webSocketConfig?: {
    enabled: boolean;
    port?: number;
    heartbeatInterval?: number;
  };
  loggingConfig?: {
    level: 'error' | 'warn' | 'info' | 'debug';
    enableRequestLogging?: boolean;
    enableResponseLogging?: boolean;
  };
  securityConfig?: {
    allowedOrigins?: string[];
    rateLimiting?: {
      enabled: boolean;
      maxRequests?: number;
      windowMs?: number;
    };
  };
}

@ApiTags('Copilot Integration')
@Controller('api/copilot')
@UseGuards(AuthGuard, TenantGuard)
@ApiBearerAuth()
export class CopilotIntegrationController {
  private readonly logger = new Logger(CopilotIntegrationController.name);

  constructor(
    private readonly copilotService: CopilotIntegrationService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Initialize the Copilot integration service
   */
  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Initialize Copilot integration service',
    description: 'Initialize the service with configuration options'
  })
  @ApiBody({ type: IntegrationConfigDto })
  @ApiResponse({
    status: 200,
    description: 'Service initialized successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        serviceStatus: { type: 'object' }
      }
    }
  })
  async initialize(
    @Body() config: IntegrationConfigDto,
    @Tenant() tenantId: string
  ) {
    try {
      await this.copilotService.initialize(config);
      const serviceStatus = await this.copilotService.getServiceStatus(tenantId);

      this.eventEmitter.emit('copilot.service.initialized', {
        tenantId,
        config,
        timestamp: new Date()
      });

      return {
        success: true,
        message: 'Copilot integration service initialized successfully',
        serviceStatus
      };
    } catch (error) {
      this.logger.error('Failed to initialize service', error);
      throw new InternalServerErrorException('Failed to initialize service');
    }
  }

  /**
   * Get service status and health
   */
  @Get('status')
  @ApiOperation({
    summary: 'Get service status',
    description: 'Retrieve current service status, health, and metrics'
  })
  @ApiResponse({
    status: 200,
    description: 'Service status retrieved successfully'
  })
  async getStatus(@Tenant() tenantId: string) {
    try {
      return await this.copilotService.getServiceStatus(tenantId);
    } catch (error) {
      this.logger.error('Failed to get service status', error);
      throw new InternalServerErrorException('Failed to get service status');
    }
  }

  /**
   * Create a new chat participant
   */
  @Post('participants')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Create chat participant',
    description: 'Register a new VS Code chat participant'
  })
  @ApiBody({ type: CreateChatParticipantDto })
  @ApiResponse({
    status: 201,
    description: 'Chat participant created successfully'
  })
  async createChatParticipant(
    @Body() participantDto: CreateChatParticipantDto,
    @Tenant() tenantId: string
  ) {
    try {
      const result = await this.copilotService.registerChatParticipant(
        tenantId,
        participantDto
      );

      this.eventEmitter.emit('copilot.participant.created', {
        tenantId,
        participantId: participantDto.id,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to create chat participant', error);
      throw new BadRequestException('Failed to create chat participant');
    }
  }

  /**
   * Get all chat participants for tenant
   */
  @Get('participants')
  @ApiOperation({
    summary: 'Get chat participants',
    description: 'Retrieve all registered chat participants for the tenant'
  })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Filter by active status'
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category'
  })
  @ApiResponse({
    status: 200,
    description: 'Chat participants retrieved successfully'
  })
  async getChatParticipants(
    @Tenant() tenantId: string,
    @Query('active') active?: boolean,
    @Query('category') category?: string
  ) {
    try {
      return await this.copilotService.getChatParticipants(tenantId, {
        active,
        category
      });
    } catch (error) {
      this.logger.error('Failed to get chat participants', error);
      throw new InternalServerErrorException('Failed to get chat participants');
    }
  }

  /**
   * Get specific chat participant
   */
  @Get('participants/:participantId')
  @ApiOperation({
    summary: 'Get chat participant details',
    description: 'Retrieve detailed information about a specific chat participant'
  })
  @ApiParam({ name: 'participantId', description: 'Chat participant ID' })
  @ApiResponse({
    status: 200,
    description: 'Chat participant details retrieved'
  })
  async getChatParticipant(
    @Param('participantId') participantId: string,
    @Tenant() tenantId: string
  ) {
    try {
      const participant = await this.copilotService.getChatParticipant(
        tenantId,
        participantId
      );

      if (!participant) {
        throw new NotFoundException('Chat participant not found');
      }

      return participant;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to get chat participant', error);
      throw new InternalServerErrorException('Failed to get chat participant');
    }
  }

  /**
   * Update chat participant
   */
  @Put('participants/:participantId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Update chat participant',
    description: 'Update configuration of an existing chat participant'
  })
  @ApiParam({ name: 'participantId', description: 'Chat participant ID' })
  @ApiBody({ type: UpdateChatParticipantDto })
  @ApiResponse({
    status: 200,
    description: 'Chat participant updated successfully'
  })
  async updateChatParticipant(
    @Param('participantId') participantId: string,
    @Body() updateDto: UpdateChatParticipantDto,
    @Tenant() tenantId: string
  ) {
    try {
      const result = await this.copilotService.updateChatParticipant(
        tenantId,
        participantId,
        updateDto
      );

      this.eventEmitter.emit('copilot.participant.updated', {
        tenantId,
        participantId,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to update chat participant', error);
      throw new BadRequestException('Failed to update chat participant');
    }
  }

  /**
   * Delete chat participant
   */
  @Delete('participants/:participantId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Delete chat participant',
    description: 'Remove a chat participant and unregister from VS Code'
  })
  @ApiParam({ name: 'participantId', description: 'Chat participant ID' })
  @ApiResponse({
    status: 200,
    description: 'Chat participant deleted successfully'
  })
  async deleteChatParticipant(
    @Param('participantId') participantId: string,
    @Tenant() tenantId: string
  ) {
    try {
      await this.copilotService.unregisterChatParticipant(tenantId, participantId);

      this.eventEmitter.emit('copilot.participant.deleted', {
        tenantId,
        participantId,
        timestamp: new Date()
      });

      return {
        success: true,
        message: 'Chat participant deleted successfully'
      };
    } catch (error) {
      this.logger.error('Failed to delete chat participant', error);
      throw new BadRequestException('Failed to delete chat participant');
    }
  }

  /**
   * Handle chat request to participant
   */
  @Post('participants/:participantId/chat')
  @ApiOperation({
    summary: 'Send chat request',
    description: 'Send a chat request to a specific participant'
  })
  @ApiParam({ name: 'participantId', description: 'Chat participant ID' })
  @ApiBody({ type: ChatRequestDto })
  @ApiHeader({
    name: 'Accept',
    description: 'Use text/event-stream for streaming responses',
    required: false
  })
  @ApiResponse({
    status: 200,
    description: 'Chat response generated',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ChatResponseDto' }
      },
      'text/event-stream': {
        schema: { type: 'string' }
      }
    }
  })
  async handleChatRequest(
    @Param('participantId') participantId: string,
    @Body() chatRequest: ChatRequestDto,
    @Tenant() tenantId: string,
    @Headers('accept') accept?: string,
    @Res({ passthrough: true }) res?: Response
  ) {
    try {
      const isStreaming = accept?.includes('text/event-stream');

      if (isStreaming) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        return await this.copilotService.handleChatRequestStream(
          tenantId,
          participantId,
          chatRequest,
          res
        );
      } else {
        return await this.copilotService.handleChatRequest(
          tenantId,
          participantId,
          chatRequest
        );
      }
    } catch (error) {
      this.logger.error('Failed to handle chat request', error);
      throw new BadRequestException('Failed to handle chat request');
    }
  }

  /**
   * Get available commands for participant
   */
  @Get('participants/:participantId/commands')
  @ApiOperation({
    summary: 'Get participant commands',
    description: 'Retrieve available commands for a chat participant'
  })
  @ApiParam({ name: 'participantId', description: 'Chat participant ID' })
  @ApiResponse({
    status: 200,
    description: 'Commands retrieved successfully'
  })
  async getParticipantCommands(
    @Param('participantId') participantId: string,
    @Tenant() tenantId: string
  ) {
    try {
      return await this.copilotService.getParticipantCommands(
        tenantId,
        participantId
      );
    } catch (error) {
      this.logger.error('Failed to get participant commands', error);
      throw new InternalServerErrorException('Failed to get participant commands');
    }
  }

  /**
   * Get agent templates
   */
  @Get('templates')
  @ApiOperation({
    summary: 'Get agent templates',
    description: 'Retrieve all available agent templates'
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category'
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: String,
    description: 'Filter by tags (comma-separated)'
  })
  @ApiResponse({
    status: 200,
    description: 'Agent templates retrieved successfully'
  })
  async getAgentTemplates(
    @Query('category') category?: string,
    @Query('tags') tags?: string
  ) {
    try {
      const tagArray = tags ? tags.split(',').map(t => t.trim()) : undefined;
      return await this.copilotService.getAgentTemplates({
        category,
        tags: tagArray
      });
    } catch (error) {
      this.logger.error('Failed to get agent templates', error);
      throw new InternalServerErrorException('Failed to get agent templates');
    }
  }

  /**
   * Create agent template
   */
  @Post('templates')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Create agent template',
    description: 'Create a new reusable agent template'
  })
  @ApiBody({ type: CreateAgentTemplateDto })
  @ApiResponse({
    status: 201,
    description: 'Agent template created successfully'
  })
  async createAgentTemplate(
    @Body() templateDto: CreateAgentTemplateDto,
    @Tenant() tenantId: string
  ) {
    try {
      const result = await this.copilotService.createAgentTemplate(templateDto);

      this.eventEmitter.emit('copilot.template.created', {
        tenantId,
        templateId: templateDto.id,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to create agent template', error);
      throw new BadRequestException('Failed to create agent template');
    }
  }

  /**
   * Update agent template
   */
  @Put('templates/:templateId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Update agent template',
    description: 'Update an existing agent template'
  })
  @ApiParam({ name: 'templateId', description: 'Agent template ID' })
  @ApiBody({ type: UpdateAgentTemplateDto })
  @ApiResponse({
    status: 200,
    description: 'Agent template updated successfully'
  })
  async updateAgentTemplate(
    @Param('templateId') templateId: string,
    @Body() updateDto: UpdateAgentTemplateDto,
    @Tenant() tenantId: string
  ) {
    try {
      const result = await this.copilotService.updateAgentTemplate(
        templateId,
        updateDto
      );

      this.eventEmitter.emit('copilot.template.updated', {
        tenantId,
        templateId,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to update agent template', error);
      throw new BadRequestException('Failed to update agent template');
    }
  }

  /**
   * Create participant from template
   */
  @Post('templates/:templateId/participants')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Create participant from template',
    description: 'Create a new chat participant using an agent template'
  })
  @ApiParam({ name: 'templateId', description: 'Agent template ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        participantId: { type: 'string' },
        customizations: { type: 'object' }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Participant created from template successfully'
  })
  async createParticipantFromTemplate(
    @Param('templateId') templateId: string,
    @Body() body: { participantId: string; customizations?: any },
    @Tenant() tenantId: string
  ) {
    try {
      const result = await this.copilotService.createParticipantFromTemplate(
        tenantId,
        templateId,
        body.participantId,
        body.customizations
      );

      this.eventEmitter.emit('copilot.participant.created.from.template', {
        tenantId,
        templateId,
        participantId: body.participantId,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to create participant from template', error);
      throw new BadRequestException('Failed to create participant from template');
    }
  }

  /**
   * Batch operations on participants
   */
  @Post('participants/batch')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Batch operations on participants',
    description: 'Perform batch operations on multiple chat participants'
  })
  @ApiBody({ type: BatchOperationDto })
  @ApiResponse({
    status: 200,
    description: 'Batch operation completed successfully'
  })
  async batchParticipantOperations(
    @Body() operation: BatchOperationDto,
    @Tenant() tenantId: string
  ) {
    try {
      const results = await this.copilotService.batchParticipantOperations(
        tenantId,
        operation
      );

      this.eventEmitter.emit('copilot.participants.batch.operation', {
        tenantId,
        operation: operation.action,
        participantIds: operation.participantIds,
        timestamp: new Date()
      });

      return results;
    } catch (error) {
      this.logger.error('Failed to perform batch operation', error);
      throw new BadRequestException('Failed to perform batch operation');
    }
  }

  /**
   * Get integration metrics
   */
  @Get('metrics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Get integration metrics',
    description: 'Retrieve usage metrics and analytics for the integration'
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['hour', 'day', 'week', 'month'],
    description: 'Time period for metrics'
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics retrieved successfully'
  })
  async getMetrics(
    @Tenant() tenantId: string,
    @Query('period') period: 'hour' | 'day' | 'week' | 'month' = 'day'
  ) {
    try {
      return await this.copilotService.getIntegrationMetrics(tenantId, period);
    } catch (error) {
      this.logger.error('Failed to get metrics', error);
      throw new InternalServerErrorException('Failed to get metrics');
    }
  }

  /**
   * Export configuration
   */
  @Get('export')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Export configuration',
    description: 'Export tenant configuration as JSON file'
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration exported successfully',
    content: {
      'application/json': {
        schema: { type: 'object' }
      }
    }
  })
  async exportConfiguration(@Tenant() tenantId: string) {
    try {
      const config = await this.copilotService.exportTenantConfiguration(tenantId);
      return new StreamableFile(
        Buffer.from(JSON.stringify(config, null, 2)),
        {
          type: 'application/json',
          disposition: `attachment; filename="copilot-config-${tenantId}.json"`
        }
      );
    } catch (error) {
      this.logger.error('Failed to export configuration', error);
      throw new InternalServerErrorException('Failed to export configuration');
    }
  }

  /**
   * Import configuration
   */
  @Post('import')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Import configuration',
    description: 'Import tenant configuration from JSON data'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        configuration: { type: 'object' },
        mergeMode: {
          type: 'string',
          enum: ['replace', 'merge'],
          default: 'merge'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration imported successfully'
  })
  async importConfiguration(
    @Body() body: { configuration: any; mergeMode?: 'replace' | 'merge' },
    @Tenant() tenantId: string
  ) {
    try {
      const result = await this.copilotService.importTenantConfiguration(
        tenantId,
        body.configuration,
        body.mergeMode || 'merge'
      );

      this.eventEmitter.emit('copilot.configuration.imported', {
        tenantId,
        mergeMode: body.mergeMode,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to import configuration', error);
      throw new BadRequestException('Failed to import configuration');
    }
  }

  /**
   * WebSocket connection info
   */
  @Get('websocket/info')
  @ApiOperation({
    summary: 'Get WebSocket connection info',
    description: 'Retrieve WebSocket connection details for real-time updates'
  })
  @ApiResponse({
    status: 200,
    description: 'WebSocket info retrieved successfully'
  })
  async getWebSocketInfo(@Tenant() tenantId: string) {
    try {
      return await this.copilotService.getWebSocketConnectionInfo(tenantId);
    } catch (error) {
      this.logger.error('Failed to get WebSocket info', error);
      throw new InternalServerErrorException('Failed to get WebSocket info');
    }
  }
}
