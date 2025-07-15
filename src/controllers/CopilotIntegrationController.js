/**
 * GitHub Copilot Integration Controller
 *
 * REST API controller for managing GitHub Copilot VS Code integration
 * Provides comprehensive endpoints for chat participants, commands, and multi-tenant management
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CopilotIntegrationController_1;
import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, Logger, BadRequestException, NotFoundException, InternalServerErrorException, UseGuards, StreamableFile, Headers, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CopilotIntegrationService } from '../services/CopilotIntegrationService';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TenantGuard } from '@the-new-fuse/core/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@the-new-fuse/core/decorators/roles.decorator';
import { Tenant } from '../decorators/tenant.decorator';
import { UserRole } from '@prisma/client';
// DTOs for API documentation and validation
export class CreateChatParticipantDto {
    id;
    name;
    description;
    fullName;
    iconPath;
    isSticky;
    sampleRequest;
    commands;
    followupProvider;
}
export class UpdateChatParticipantDto {
    name;
    description;
    fullName;
    iconPath;
    isSticky;
    sampleRequest;
    commands;
    followupProvider;
}
export class ChatRequestDto {
    participant;
    prompt;
    command;
    references;
    location;
    context;
}
export class ChatResponseDto {
    markdown;
    anchor;
    commandFollowups;
    textFollowups;
    progress;
}
export class CreateAgentTemplateDto {
    id;
    name;
    description;
    category;
    tags;
    participantConfig;
    capabilities;
    defaultCommands;
    customInstructions;
    modelPreferences;
}
export class UpdateAgentTemplateDto {
    name;
    description;
    category;
    tags;
    participantConfig;
    capabilities;
    defaultCommands;
    customInstructions;
    modelPreferences;
}
export class BatchOperationDto {
    participantIds;
    action;
    options;
}
export class IntegrationConfigDto {
    autoRegisterParticipants;
    defaultParticipantConfig;
    webSocketConfig;
    loggingConfig;
    securityConfig;
}
let CopilotIntegrationController = CopilotIntegrationController_1 = class CopilotIntegrationController {
    copilotService;
    eventEmitter;
    logger = new Logger(CopilotIntegrationController_1.name);
    constructor(copilotService, eventEmitter) {
        this.copilotService = copilotService;
        this.eventEmitter = eventEmitter;
    }
    /**
     * Initialize the Copilot integration service
     */
    async initialize(config, tenantId) {
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
        }
        catch (error) {
            this.logger.error('Failed to initialize service', error);
            throw new InternalServerErrorException('Failed to initialize service');
        }
    }
    /**
     * Get service status and health
     */
    async getStatus(tenantId) {
        try {
            return await this.copilotService.getServiceStatus(tenantId);
        }
        catch (error) {
            this.logger.error('Failed to get service status', error);
            throw new InternalServerErrorException('Failed to get service status');
        }
    }
    /**
     * Create a new chat participant
     */
    async createChatParticipant(participantDto, tenantId) {
        try {
            const result = await this.copilotService.registerChatParticipant(tenantId, participantDto);
            this.eventEmitter.emit('copilot.participant.created', {
                tenantId,
                participantId: participantDto.id,
                timestamp: new Date()
            });
            return result;
        }
        catch (error) {
            this.logger.error('Failed to create chat participant', error);
            throw new BadRequestException('Failed to create chat participant');
        }
    }
    /**
     * Get all chat participants for tenant
     */
    async getChatParticipants(tenantId, active, category) {
        try {
            return await this.copilotService.getChatParticipants(tenantId, {
                active,
                category
            });
        }
        catch (error) {
            this.logger.error('Failed to get chat participants', error);
            throw new InternalServerErrorException('Failed to get chat participants');
        }
    }
    /**
     * Get specific chat participant
     */
    async getChatParticipant(participantId, tenantId) {
        try {
            const participant = await this.copilotService.getChatParticipant(tenantId, participantId);
            if (!participant) {
                throw new NotFoundException('Chat participant not found');
            }
            return participant;
        }
        catch (error) {
            if (error instanceof NotFoundException)
                throw error;
            this.logger.error('Failed to get chat participant', error);
            throw new InternalServerErrorException('Failed to get chat participant');
        }
    }
    /**
     * Update chat participant
     */
    async updateChatParticipant(participantId, updateDto, tenantId) {
        try {
            const result = await this.copilotService.updateChatParticipant(tenantId, participantId, updateDto);
            this.eventEmitter.emit('copilot.participant.updated', {
                tenantId,
                participantId,
                timestamp: new Date()
            });
            return result;
        }
        catch (error) {
            this.logger.error('Failed to update chat participant', error);
            throw new BadRequestException('Failed to update chat participant');
        }
    }
    /**
     * Delete chat participant
     */
    async deleteChatParticipant(participantId, tenantId) {
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
        }
        catch (error) {
            this.logger.error('Failed to delete chat participant', error);
            throw new BadRequestException('Failed to delete chat participant');
        }
    }
    /**
     * Handle chat request to participant
     */
    async handleChatRequest(participantId, chatRequest, tenantId, accept, res) {
        try {
            const isStreaming = accept?.includes('text/event-stream');
            if (isStreaming) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                return await this.copilotService.handleChatRequestStream(tenantId, participantId, chatRequest, res);
            }
            else {
                return await this.copilotService.handleChatRequest(tenantId, participantId, chatRequest);
            }
        }
        catch (error) {
            this.logger.error('Failed to handle chat request', error);
            throw new BadRequestException('Failed to handle chat request');
        }
    }
    /**
     * Get available commands for participant
     */
    async getParticipantCommands(participantId, tenantId) {
        try {
            return await this.copilotService.getParticipantCommands(tenantId, participantId);
        }
        catch (error) {
            this.logger.error('Failed to get participant commands', error);
            throw new InternalServerErrorException('Failed to get participant commands');
        }
    }
    /**
     * Get agent templates
     */
    async getAgentTemplates(category, tags) {
        try {
            const tagArray = tags ? tags.split(',').map(t => t.trim()) : undefined;
            return await this.copilotService.getAgentTemplates({
                category,
                tags: tagArray
            });
        }
        catch (error) {
            this.logger.error('Failed to get agent templates', error);
            throw new InternalServerErrorException('Failed to get agent templates');
        }
    }
    /**
     * Create agent template
     */
    async createAgentTemplate(templateDto, tenantId) {
        try {
            const result = await this.copilotService.createAgentTemplate(templateDto);
            this.eventEmitter.emit('copilot.template.created', {
                tenantId,
                templateId: templateDto.id,
                timestamp: new Date()
            });
            return result;
        }
        catch (error) {
            this.logger.error('Failed to create agent template', error);
            throw new BadRequestException('Failed to create agent template');
        }
    }
    /**
     * Update agent template
     */
    async updateAgentTemplate(templateId, updateDto, tenantId) {
        try {
            const result = await this.copilotService.updateAgentTemplate(templateId, updateDto);
            this.eventEmitter.emit('copilot.template.updated', {
                tenantId,
                templateId,
                timestamp: new Date()
            });
            return result;
        }
        catch (error) {
            this.logger.error('Failed to update agent template', error);
            throw new BadRequestException('Failed to update agent template');
        }
    }
    /**
     * Create participant from template
     */
    async createParticipantFromTemplate(templateId, body, tenantId) {
        try {
            const result = await this.copilotService.createParticipantFromTemplate(tenantId, templateId, body.participantId, body.customizations);
            this.eventEmitter.emit('copilot.participant.created.from.template', {
                tenantId,
                templateId,
                participantId: body.participantId,
                timestamp: new Date()
            });
            return result;
        }
        catch (error) {
            this.logger.error('Failed to create participant from template', error);
            throw new BadRequestException('Failed to create participant from template');
        }
    }
    /**
     * Batch operations on participants
     */
    async batchParticipantOperations(operation, tenantId) {
        try {
            const results = await this.copilotService.batchParticipantOperations(tenantId, operation);
            this.eventEmitter.emit('copilot.participants.batch.operation', {
                tenantId,
                operation: operation.action,
                participantIds: operation.participantIds,
                timestamp: new Date()
            });
            return results;
        }
        catch (error) {
            this.logger.error('Failed to perform batch operation', error);
            throw new BadRequestException('Failed to perform batch operation');
        }
    }
    /**
     * Get integration metrics
     */
    async getMetrics(tenantId, period = 'day') {
        try {
            return await this.copilotService.getIntegrationMetrics(tenantId, period);
        }
        catch (error) {
            this.logger.error('Failed to get metrics', error);
            throw new InternalServerErrorException('Failed to get metrics');
        }
    }
    /**
     * Export configuration
     */
    async exportConfiguration(tenantId) {
        try {
            const config = await this.copilotService.exportTenantConfiguration(tenantId);
            return new StreamableFile(Buffer.from(JSON.stringify(config, null, 2)), {
                type: 'application/json',
                disposition: `attachment; filename="copilot-config-${tenantId}.json"`
            });
        }
        catch (error) {
            this.logger.error('Failed to export configuration', error);
            throw new InternalServerErrorException('Failed to export configuration');
        }
    }
    /**
     * Import configuration
     */
    async importConfiguration(body, tenantId) {
        try {
            const result = await this.copilotService.importTenantConfiguration(tenantId, body.configuration, body.mergeMode || 'merge');
            this.eventEmitter.emit('copilot.configuration.imported', {
                tenantId,
                mergeMode: body.mergeMode,
                timestamp: new Date()
            });
            return result;
        }
        catch (error) {
            this.logger.error('Failed to import configuration', error);
            throw new BadRequestException('Failed to import configuration');
        }
    }
    /**
     * WebSocket connection info
     */
    async getWebSocketInfo(tenantId) {
        try {
            return await this.copilotService.getWebSocketConnectionInfo(tenantId);
        }
        catch (error) {
            this.logger.error('Failed to get WebSocket info', error);
            throw new InternalServerErrorException('Failed to get WebSocket info');
        }
    }
};
__decorate([
    Post('initialize'),
    HttpCode(HttpStatus.OK),
    UseGuards(RolesGuard),
    Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN),
    ApiOperation({
        summary: 'Initialize Copilot integration service',
        description: 'Initialize the service with configuration options'
    }),
    ApiBody({ type: IntegrationConfigDto }),
    ApiResponse({
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
    }),
    __param(0, Body()),
    __param(1, Tenant()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [IntegrationConfigDto, String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "initialize", null);
__decorate([
    Get('status'),
    ApiOperation({
        summary: 'Get service status',
        description: 'Retrieve current service status, health, and metrics'
    }),
    ApiResponse({
        status: 200,
        description: 'Service status retrieved successfully'
    }),
    __param(0, Tenant()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "getStatus", null);
__decorate([
    Post('participants'),
    UseGuards(RolesGuard),
    Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.USER),
    ApiOperation({
        summary: 'Create chat participant',
        description: 'Register a new VS Code chat participant'
    }),
    ApiBody({ type: CreateChatParticipantDto }),
    ApiResponse({
        status: 201,
        description: 'Chat participant created successfully'
    }),
    __param(0, Body()),
    __param(1, Tenant()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateChatParticipantDto, String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "createChatParticipant", null);
__decorate([
    Get('participants'),
    ApiOperation({
        summary: 'Get chat participants',
        description: 'Retrieve all registered chat participants for the tenant'
    }),
    ApiQuery({
        name: 'active',
        required: false,
        type: Boolean,
        description: 'Filter by active status'
    }),
    ApiQuery({
        name: 'category',
        required: false,
        type: String,
        description: 'Filter by category'
    }),
    ApiResponse({
        status: 200,
        description: 'Chat participants retrieved successfully'
    }),
    __param(0, Tenant()),
    __param(1, Query('active')),
    __param(2, Query('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "getChatParticipants", null);
__decorate([
    Get('participants/:participantId'),
    ApiOperation({
        summary: 'Get chat participant details',
        description: 'Retrieve detailed information about a specific chat participant'
    }),
    ApiParam({ name: 'participantId', description: 'Chat participant ID' }),
    ApiResponse({
        status: 200,
        description: 'Chat participant details retrieved'
    }),
    __param(0, Param('participantId')),
    __param(1, Tenant()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "getChatParticipant", null);
__decorate([
    Put('participants/:participantId'),
    UseGuards(RolesGuard),
    Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.USER),
    ApiOperation({
        summary: 'Update chat participant',
        description: 'Update configuration of an existing chat participant'
    }),
    ApiParam({ name: 'participantId', description: 'Chat participant ID' }),
    ApiBody({ type: UpdateChatParticipantDto }),
    ApiResponse({
        status: 200,
        description: 'Chat participant updated successfully'
    }),
    __param(0, Param('participantId')),
    __param(1, Body()),
    __param(2, Tenant()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateChatParticipantDto, String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "updateChatParticipant", null);
__decorate([
    Delete('participants/:participantId'),
    UseGuards(RolesGuard),
    Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN),
    ApiOperation({
        summary: 'Delete chat participant',
        description: 'Remove a chat participant and unregister from VS Code'
    }),
    ApiParam({ name: 'participantId', description: 'Chat participant ID' }),
    ApiResponse({
        status: 200,
        description: 'Chat participant deleted successfully'
    }),
    __param(0, Param('participantId')),
    __param(1, Tenant()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "deleteChatParticipant", null);
__decorate([
    Post('participants/:participantId/chat'),
    ApiOperation({
        summary: 'Send chat request',
        description: 'Send a chat request to a specific participant'
    }),
    ApiParam({ name: 'participantId', description: 'Chat participant ID' }),
    ApiBody({ type: ChatRequestDto }),
    ApiHeader({
        name: 'Accept',
        description: 'Use text/event-stream for streaming responses',
        required: false
    }),
    ApiResponse({
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
    }),
    __param(0, Param('participantId')),
    __param(1, Body()),
    __param(2, Tenant()),
    __param(3, Headers('accept')),
    __param(4, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ChatRequestDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "handleChatRequest", null);
__decorate([
    Get('participants/:participantId/commands'),
    ApiOperation({
        summary: 'Get participant commands',
        description: 'Retrieve available commands for a chat participant'
    }),
    ApiParam({ name: 'participantId', description: 'Chat participant ID' }),
    ApiResponse({
        status: 200,
        description: 'Commands retrieved successfully'
    }),
    __param(0, Param('participantId')),
    __param(1, Tenant()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "getParticipantCommands", null);
__decorate([
    Get('templates'),
    ApiOperation({
        summary: 'Get agent templates',
        description: 'Retrieve all available agent templates'
    }),
    ApiQuery({
        name: 'category',
        required: false,
        type: String,
        description: 'Filter by category'
    }),
    ApiQuery({
        name: 'tags',
        required: false,
        type: String,
        description: 'Filter by tags (comma-separated)'
    }),
    ApiResponse({
        status: 200,
        description: 'Agent templates retrieved successfully'
    }),
    __param(0, Query('category')),
    __param(1, Query('tags')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "getAgentTemplates", null);
__decorate([
    Post('templates'),
    UseGuards(RolesGuard),
    Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN),
    ApiOperation({
        summary: 'Create agent template',
        description: 'Create a new reusable agent template'
    }),
    ApiBody({ type: CreateAgentTemplateDto }),
    ApiResponse({
        status: 201,
        description: 'Agent template created successfully'
    }),
    __param(0, Body()),
    __param(1, Tenant()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateAgentTemplateDto, String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "createAgentTemplate", null);
__decorate([
    Put('templates/:templateId'),
    UseGuards(RolesGuard),
    Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN),
    ApiOperation({
        summary: 'Update agent template',
        description: 'Update an existing agent template'
    }),
    ApiParam({ name: 'templateId', description: 'Agent template ID' }),
    ApiBody({ type: UpdateAgentTemplateDto }),
    ApiResponse({
        status: 200,
        description: 'Agent template updated successfully'
    }),
    __param(0, Param('templateId')),
    __param(1, Body()),
    __param(2, Tenant()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateAgentTemplateDto, String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "updateAgentTemplate", null);
__decorate([
    Post('templates/:templateId/participants'),
    UseGuards(RolesGuard),
    Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.USER),
    ApiOperation({
        summary: 'Create participant from template',
        description: 'Create a new chat participant using an agent template'
    }),
    ApiParam({ name: 'templateId', description: 'Agent template ID' }),
    ApiBody({
        schema: {
            type: 'object',
            properties: {
                participantId: { type: 'string' },
                customizations: { type: 'object' }
            }
        }
    }),
    ApiResponse({
        status: 201,
        description: 'Participant created from template successfully'
    }),
    __param(0, Param('templateId')),
    __param(1, Body()),
    __param(2, Tenant()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "createParticipantFromTemplate", null);
__decorate([
    Post('participants/batch'),
    UseGuards(RolesGuard),
    Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN),
    ApiOperation({
        summary: 'Batch operations on participants',
        description: 'Perform batch operations on multiple chat participants'
    }),
    ApiBody({ type: BatchOperationDto }),
    ApiResponse({
        status: 200,
        description: 'Batch operation completed successfully'
    }),
    __param(0, Body()),
    __param(1, Tenant()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BatchOperationDto, String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "batchParticipantOperations", null);
__decorate([
    Get('metrics'),
    UseGuards(RolesGuard),
    Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN),
    ApiOperation({
        summary: 'Get integration metrics',
        description: 'Retrieve usage metrics and analytics for the integration'
    }),
    ApiQuery({
        name: 'period',
        required: false,
        enum: ['hour', 'day', 'week', 'month'],
        description: 'Time period for metrics'
    }),
    ApiResponse({
        status: 200,
        description: 'Metrics retrieved successfully'
    }),
    __param(0, Tenant()),
    __param(1, Query('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "getMetrics", null);
__decorate([
    Get('export'),
    UseGuards(RolesGuard),
    Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN),
    ApiOperation({
        summary: 'Export configuration',
        description: 'Export tenant configuration as JSON file'
    }),
    ApiResponse({
        status: 200,
        description: 'Configuration exported successfully',
        content: {
            'application/json': {
                schema: { type: 'object' }
            }
        }
    }),
    __param(0, Tenant()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "exportConfiguration", null);
__decorate([
    Post('import'),
    UseGuards(RolesGuard),
    Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN),
    ApiOperation({
        summary: 'Import configuration',
        description: 'Import tenant configuration from JSON data'
    }),
    ApiBody({
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
    }),
    ApiResponse({
        status: 200,
        description: 'Configuration imported successfully'
    }),
    __param(0, Body()),
    __param(1, Tenant()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "importConfiguration", null);
__decorate([
    Get('websocket/info'),
    ApiOperation({
        summary: 'Get WebSocket connection info',
        description: 'Retrieve WebSocket connection details for real-time updates'
    }),
    ApiResponse({
        status: 200,
        description: 'WebSocket info retrieved successfully'
    }),
    __param(0, Tenant()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CopilotIntegrationController.prototype, "getWebSocketInfo", null);
CopilotIntegrationController = CopilotIntegrationController_1 = __decorate([
    ApiTags('Copilot Integration'),
    Controller('api/copilot'),
    UseGuards(AuthGuard, TenantGuard),
    ApiBearerAuth(),
    __metadata("design:paramtypes", [CopilotIntegrationService,
        EventEmitter2])
], CopilotIntegrationController);
export { CopilotIntegrationController };
