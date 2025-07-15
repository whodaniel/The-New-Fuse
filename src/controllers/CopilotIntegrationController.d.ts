/**
 * GitHub Copilot Integration Controller
 *
 * REST API controller for managing GitHub Copilot VS Code integration
 * Provides comprehensive endpoints for chat participants, commands, and multi-tenant management
 */
import { StreamableFile } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Response } from 'express';
import { CopilotIntegrationService } from '../services/CopilotIntegrationService';
export declare class CreateChatParticipantDto {
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
export declare class UpdateChatParticipantDto {
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
export declare class ChatRequestDto {
    participant: string;
    prompt: string;
    command?: string;
    references?: Array<{
        id?: string;
        uri?: string;
        range?: {
            start: {
                line: number;
                character: number;
            };
            end: {
                line: number;
                character: number;
            };
        };
    }>;
    location?: {
        uri: string;
        range?: {
            start: {
                line: number;
                character: number;
            };
            end: {
                line: number;
                character: number;
            };
        };
    };
    context?: Record<string, any>;
}
export declare class ChatResponseDto {
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
export declare class CreateAgentTemplateDto {
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
export declare class UpdateAgentTemplateDto {
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
export declare class BatchOperationDto {
    participantIds?: string[];
    action: 'activate' | 'deactivate' | 'refresh' | 'remove';
    options?: Record<string, any>;
}
export declare class IntegrationConfigDto {
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
export declare class CopilotIntegrationController {
    private readonly copilotService;
    private readonly eventEmitter;
    private readonly logger;
    constructor(copilotService: CopilotIntegrationService, eventEmitter: EventEmitter2);
    /**
     * Initialize the Copilot integration service
     */
    initialize(config: IntegrationConfigDto, tenantId: string): Promise<{
        success: boolean;
        message: string;
        serviceStatus: any;
    }>;
    /**
     * Get service status and health
     */
    getStatus(tenantId: string): Promise<any>;
    /**
     * Create a new chat participant
     */
    createChatParticipant(participantDto: CreateChatParticipantDto, tenantId: string): Promise<string>;
    /**
     * Get all chat participants for tenant
     */
    getChatParticipants(tenantId: string, active?: boolean, category?: string): Promise<import("../types/copilot-integration.types").ChatParticipant[]>;
    /**
     * Get specific chat participant
     */
    getChatParticipant(participantId: string, tenantId: string): Promise<import("../types/copilot-integration.types").ChatParticipant>;
    /**
     * Update chat participant
     */
    updateChatParticipant(participantId: string, updateDto: UpdateChatParticipantDto, tenantId: string): Promise<import("../types/copilot-integration.types").ChatParticipant>;
    /**
     * Delete chat participant
     */
    deleteChatParticipant(participantId: string, tenantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Handle chat request to participant
     */
    handleChatRequest(participantId: string, chatRequest: ChatRequestDto, tenantId: string, accept?: string, res?: Response): Promise<void | import("../types/copilot-integration.types").ChatResponse>;
    /**
     * Get available commands for participant
     */
    getParticipantCommands(participantId: string, tenantId: string): Promise<CopilotCommand[]>;
    /**
     * Get agent templates
     */
    getAgentTemplates(category?: string, tags?: string): Promise<import("../types/copilot-integration.types").AgentTemplate[]>;
    /**
     * Create agent template
     */
    createAgentTemplate(templateDto: CreateAgentTemplateDto, tenantId: string): Promise<any>;
    /**
     * Update agent template
     */
    updateAgentTemplate(templateId: string, updateDto: UpdateAgentTemplateDto, tenantId: string): Promise<any>;
    /**
     * Create participant from template
     */
    createParticipantFromTemplate(templateId: string, body: {
        participantId: string;
        customizations?: any;
    }, tenantId: string): Promise<import("../types/copilot-integration.types").ChatParticipant>;
    /**
     * Batch operations on participants
     */
    batchParticipantOperations(operation: BatchOperationDto, tenantId: string): Promise<import("../types/copilot-integration.types").BatchOperationResult>;
    /**
     * Get integration metrics
     */
    getMetrics(tenantId: string, period?: 'hour' | 'day' | 'week' | 'month'): Promise<any>;
    /**
     * Export configuration
     */
    exportConfiguration(tenantId: string): Promise<StreamableFile>;
    /**
     * Import configuration
     */
    importConfiguration(body: {
        configuration: any;
        mergeMode?: 'replace' | 'merge';
    }, tenantId: string): Promise<any>;
    /**
     * WebSocket connection info
     */
    getWebSocketInfo(tenantId: string): Promise<any>;
}
//# sourceMappingURL=CopilotIntegrationController.d.ts.map