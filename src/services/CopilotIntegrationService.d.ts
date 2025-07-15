/**
 * GitHub Copilot VS Code Integration Service
 *
 * Provides comprehensive integration with GitHub Copilot VS Code extension,
 * following multi-tenant architecture and event-driven patterns established
 * in The New Fuse platform.
 *
 * Key Features:
 * - Chat Participant Management
 * - VS Code API Integration
 * - Multi-tenant Agent Support
 * - Real-time Event Communication
 * - Template-based Agent System
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as vscode from 'vscode';
import { WebSocketService } from '@the-new-fuse/core/websocket/websocket.service';
import { Response } from 'express';
import { CopilotIntegrationConfig, ChatParticipant, AgentTemplate, IntegrationMetrics, BatchOperationResult, CopilotCommand, CopilotFollowupProvider } from '../types/copilot-integration.types';
export interface CopilotChatRequest {
    id: string;
    tenantId: string;
    userId: string;
    prompt: string;
    command?: string;
    context?: any;
    variables?: any;
    model?: string;
    timestamp: Date;
}
export interface CopilotChatResponse {
    id: string;
    requestId: string;
    content: string;
    type: 'markdown' | 'code' | 'command' | 'progress' | 'reference';
    metadata?: any;
    timestamp: Date;
}
export interface CopilotParticipant {
    id: string;
    name: string;
    fullName: string;
    description: string;
    tenantId: string;
    agentTemplate: AgentTemplate;
    isActive: boolean;
    commands: CopilotCommand[];
    followupProviders: CopilotFollowupProvider[];
}
export declare class CopilotIntegrationService extends EventEmitter2 {
    private readonly webSocketService;
    private readonly logger;
    private participants;
    private activeSessions;
    private vsCodeExtensionContext?;
    private config;
    constructor(webSocketService: WebSocketService, config: CopilotIntegrationConfig);
    /**
     * Initialize the Copilot integration service
     */
    initialize(context: vscode.ExtensionContext): Promise<void>;
    /**
     * Register a new chat participant for a tenant
     */
    registerChatParticipant(tenantId: string, participantData: any, config?: Partial<CopilotParticipant>): Promise<string>;
    /**
     * Create VS Code chat participant
     */
    private createVSCodeChatParticipant;
    /**
     * Process chat request using agent template logic
     */
    private processChatRequest;
    /**
     * Process request using agent template
     */
    private processWithAgentTemplate;
    /**
     * Stream response content to VS Code chat
     */
    private streamResponse;
    /**
     * Generate commands from agent template
     */
    private generateCommandsFromTemplate;
    /**
     * Generate followup providers from template
     */
    private generateFollowupProviders;
    /**
     * Register default participants for common use cases
     */
    private registerDefaultParticipants;
    /**
     * Setup WebSocket handlers for real-time communication
     */
    private setupWebSocketHandlers;
    /**
     * Handle WebSocket requests
     */
    private handleWebSocketRequest;
    /**
     * Handle participant updates
     */
    private handleParticipantUpdate;
    /**
     * Initialize chat capabilities
     */
    private initializeChatCapabilities;
    /**
     * Setup event listeners
     */
    private setupEventListeners;
    /**
     * Get all registered participants
     */
    getParticipants(): CopilotParticipant[];
    /**
     * Get participant by ID
     */
    getParticipant(id: string): CopilotParticipant | undefined;
    /**
     * Remove participant
     */
    removeParticipant(id: string): Promise<boolean>;
    /**
     * Get service status
     */
    getStatus(): any;
    /**
     * Get all chat participants for a tenant with filtering options
     */
    getChatParticipants(tenantId: string, filters?: {
        active?: boolean;
        category?: string;
    }): Promise<ChatParticipant[]>;
    /**
     * Get a specific chat participant for a tenant
     */
    getChatParticipant(tenantId: string, participantId: string): Promise<ChatParticipant | null>;
    /**
     * Update a chat participant
     */
    updateChatParticipant(tenantId: string, participantId: string, updateData: any): Promise<ChatParticipant>;
    /**
     * Unregister a chat participant
     */
    unregisterChatParticipant(tenantId: string, participantId: string): Promise<boolean>;
    /**
     * Get participant commands
     */
    getParticipantCommands(tenantId: string, participantId: string): Promise<CopilotCommand[]>;
    /**
     * Handle streaming chat request (REST API version)
     */
    handleChatRequestStream(tenantId: string, participantId: string, chatRequest: any, res: Response): Promise<void>;
    /**
     * Get all available agent templates
     */
    getAgentTemplates(): Promise<AgentTemplate[]>;
    /**
     * Get a specific agent template
     */
    getAgentTemplate(templateId: string): Promise<AgentTemplate | null>;
    /**
     * Create participant from template
     */
    createParticipantFromTemplate(tenantId: string, templateId: string, participantId: string, customizations?: any): Promise<ChatParticipant>;
    /**
     * Batch operations on participants
     */
    batchParticipantOperations(tenantId: string, operations: any[]): Promise<BatchOperationResult>;
    /**
     * Get integration metrics
     */
    getMetrics(tenantId: string): Promise<IntegrationMetrics>;
    /**
     * Private helper methods
     */
    private mapToApiParticipant;
    private updateParticipantCommands;
    private chunkResponse;
}
//# sourceMappingURL=CopilotIntegrationService.d.ts.map