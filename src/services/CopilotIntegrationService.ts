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

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as vscode from 'vscode';
import { WebSocketService } from '@the-new-fuse/core/websocket/websocket.service';
import { Response } from 'express';
import {
  CopilotIntegrationConfig,
  ChatParticipant,
  ChatResponse,
  AgentTemplate,
  IntegrationMetrics,
  BatchOperationResult,
  CopilotCommand,
  CopilotFollowupProvider
} from '../types/copilot-integration.types';

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

@Injectable()
export class CopilotIntegrationService extends EventEmitter2 {
  private readonly logger = new Logger(CopilotIntegrationService.name);
  private participants: Map<string, CopilotParticipant> = new Map();
  private activeSessions: Map<string, vscode.ChatRequestHandler> = new Map();
  private vsCodeExtensionContext?: vscode.ExtensionContext;
  private config: CopilotIntegrationConfig;

  constructor(
    private readonly webSocketService: WebSocketService,
    config: CopilotIntegrationConfig
  ) {
    super();
    this.config = config;
    this.setupEventListeners();
  }

  /**
   * Initialize the Copilot integration service
   */
  async initialize(context: vscode.ExtensionContext): Promise<void> {
    this.logger.log('Initializing GitHub Copilot VS Code Integration...');
    
    this.vsCodeExtensionContext = context;
    
    // Register default participants
    await this.registerDefaultParticipants();
    
    // Setup WebSocket communication
    this.setupWebSocketHandlers();
    
    // Initialize chat capabilities
    await this.initializeChatCapabilities();
    
    this.logger.log('GitHub Copilot Integration initialized successfully');
    this.emit('copilot.integration.initialized');
  }

  /**
   * Register a new chat participant for a tenant
   */
  async registerChatParticipant(
    tenantId: string,
    participantData: any,
    config: Partial<CopilotParticipant> = {}
  ): Promise<string> {
    // Handle different input formats
    let agentTemplate: AgentTemplate;
    let participantConfig: Partial<CopilotParticipant>;

    if (participantData.name && participantData.id) {
      // DTO format from controller
      participantConfig = {
        name: participantData.name,
        fullName: participantData.fullName,
        description: participantData.description,
        ...config
      };

      // Create a basic template if not provided
      agentTemplate = {
        id: participantData.id,
        name: participantData.name,
        displayName: participantData.fullName || participantData.name,
        description: participantData.description || 'Custom chat participant',
        capabilities: ['general_assistance'],
        version: '1.0.0',
        category: 'custom'
      };
    } else {
      // AgentTemplate format
      agentTemplate = participantData;
      participantConfig = config;
    }

    const participantId = `${tenantId}.${agentTemplate.name}`;
    
    const participant: CopilotParticipant = {
      id: participantId,
      name: participantConfig.name || agentTemplate.name.toLowerCase(),
      fullName: participantConfig.fullName || agentTemplate.displayName,
      description: participantConfig.description || agentTemplate.description,
      tenantId,
      agentTemplate,
      isActive: true,
      commands: await this.generateCommandsFromTemplate(agentTemplate),
      followupProviders: await this.generateFollowupProviders(agentTemplate),
      ...participantConfig
    };

    // Register with VS Code
    if (this.vsCodeExtensionContext) {
      await this.createVSCodeChatParticipant(participant);
    }

    this.participants.set(participantId, participant);
    
    this.logger.log(`Registered chat participant: ${participantId}`);
    this.emit('copilot.participant.registered', { participant });
    
    return participantId;
  }

  /**
   * Create VS Code chat participant
   */
  private async createVSCodeChatParticipant(participant: CopilotParticipant): Promise<void> {
    if (!this.vsCodeExtensionContext) {
      throw new Error('VS Code extension context not available');
    }

    const handler: vscode.ChatRequestHandler = async (
      request: vscode.ChatRequest,
      context: vscode.ChatContext,
      stream: vscode.ChatResponseStream,
      token: vscode.CancellationToken
    ): Promise<any> => {
      return this.handleChatRequest(participant, request, context, stream, token);
    };

    const chatParticipant = vscode.chat.createChatParticipant(participant.id, handler);
    
    // Set participant properties
    chatParticipant.iconPath = vscode.Uri.joinPath(
      this.vsCodeExtensionContext.extensionUri,
      'assets',
      'copilot-agent.png'
    );

    // Set followup provider if available
    if (participant.followupProviders.length > 0) {
      chatParticipant.followupProvider = participant.followupProviders[0];
    }

    this.activeSessions.set(participant.id, handler);
  }

  /**
   * Handle chat requests from VS Code
   */
  private async handleChatRequest(
    participant: CopilotParticipant,
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    _token: vscode.CancellationToken
  ): Promise<any> {
    const requestId = `${participant.id}-${Date.now()}`;
    
    const chatRequest: CopilotChatRequest = {
      id: requestId,
      tenantId: participant.tenantId,
      userId: 'vscode-user', // TODO: Get actual user ID
      prompt: request.prompt,
      command: request.command,
      context: context,
      variables: request.variables,
      model: request.model?.id,
      timestamp: new Date()
    };

    try {
      this.logger.debug(`Processing chat request: ${requestId}`);
      
      // Show progress
      stream.progress('Processing your request...');

      // Determine intent and route to appropriate handler
      const response = await this.processChatRequest(participant, chatRequest);

      // Stream response back to VS Code
      await this.streamResponse(stream, response);

      // Track success
      this.emit('copilot.request.completed', { request: chatRequest, response });

      return {
        requestId,
        success: true,
        metadata: {
          participant: participant.id,
          command: request.command,
          responseType: response.type
        }
      };

    } catch (error) {
      this.logger.error(`Error processing chat request ${requestId}:`, error);
      
      stream.markdown('❌ Sorry, I encountered an error processing your request. Please try again.');
      
      this.emit('copilot.request.failed', { request: chatRequest, error });
      
      return {
        requestId,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process chat request using agent template logic
   */
  private async processChatRequest(
    participant: CopilotParticipant,
    request: CopilotChatRequest
  ): Promise<CopilotChatResponse> {
    // Check for command-specific handling
    if (request.command) {
      const command = participant.commands.find(cmd => cmd.name === request.command);
      if (command) {
        return await command.handler(request);
      }
    }

    // Default processing using agent template
    const response = await this.processWithAgentTemplate(participant.agentTemplate, request);
    
    return {
      id: `${request.id}-response`,
      requestId: request.id,
      content: response,
      type: 'markdown',
      timestamp: new Date()
    };
  }

  /**
   * Process request using agent template
   */
  private async processWithAgentTemplate(
    template: AgentTemplate,
    request: CopilotChatRequest
  ): Promise<string> {
    // This would integrate with the existing agent template system
    // For now, returning a placeholder response
    
    return `**${template.displayName}** is processing your request: "${request.prompt}"

*Specialized in: ${template.capabilities.join(', ')}*

This is a placeholder response. The actual implementation would:
1. Use the agent template's specific capabilities
2. Process the request according to the template's logic
3. Return contextual, intelligent responses
4. Leverage VS Code APIs for enhanced functionality`;
  }

  /**
   * Stream response content to VS Code chat
   */
  private async streamResponse(
    stream: vscode.ChatResponseStream,
    response: CopilotChatResponse
  ): Promise<void> {
    switch (response.type) {
      case 'markdown':
        stream.markdown(response.content);
        break;
      
      case 'code':
        // Extract language and code from response
        const codeMatch = response.content.match(/```(\w+)?\n([\s\S]*?)```/);
        if (codeMatch) {
          const language = codeMatch[1] || 'text';
          const code = codeMatch[2];
          stream.markdown(`\`\`\`${language}\n${code}\n\`\`\``);
        } else {
          stream.markdown(response.content);
        }
        break;
      
      case 'command':
        // Parse command button from response
        if (response.metadata?.command) {
          stream.button({
            command: response.metadata.command.id,
            title: response.metadata.command.title,
            arguments: response.metadata.command.args || []
          });
        }
        break;
      
      case 'progress':
        stream.progress(response.content);
        break;
      
      case 'reference':
        if (response.metadata?.reference) {
          stream.reference(vscode.Uri.parse(response.metadata.reference));
        }
        break;
      
      default:
        stream.markdown(response.content);
    }
  }

  /**
   * Generate commands from agent template
   */
  private async generateCommandsFromTemplate(template: AgentTemplate): Promise<CopilotCommand[]> {
    const commands: CopilotCommand[] = [];

    // Generate standard commands based on template capabilities
    if (template.capabilities.includes('code_analysis')) {
      commands.push({
        name: 'analyze',
        description: 'Analyze the current code or selection',
        handler: async (request: CopilotChatRequest) => {
          return {
            id: `${request.id}-analyze`,
            requestId: request.id,
            content: `Analyzing code with ${template.displayName}...`,
            type: 'markdown',
            timestamp: new Date()
          };
        }
      });
    }

    if (template.capabilities.includes('documentation')) {
      commands.push({
        name: 'document',
        description: 'Generate documentation for the current code',
        handler: async (request: CopilotChatRequest) => {
          return {
            id: `${request.id}-document`,
            requestId: request.id,
            content: `Generating documentation with ${template.displayName}...`,
            type: 'markdown',
            timestamp: new Date()
          };
        }
      });
    }

    if (template.capabilities.includes('testing')) {
      commands.push({
        name: 'test',
        description: 'Generate tests for the current code',
        handler: async (request: CopilotChatRequest) => {
          return {
            id: `${request.id}-test`,
            requestId: request.id,
            content: `Generating tests with ${template.displayName}...`,
            type: 'markdown',
            timestamp: new Date()
          };
        }
      });
    }

    return commands;
  }

  /**
   * Generate followup providers from template
   */
  private async generateFollowupProviders(template: AgentTemplate): Promise<CopilotFollowupProvider[]> {
    return [{
      provideFollowups: async (_result: any, _context: vscode.ChatContext, _token: vscode.CancellationToken) => {
        const followups: vscode.ChatFollowup[] = [];

        // Generate contextual followups based on template capabilities
        if (template.capabilities.includes('code_analysis')) {
          followups.push({
            prompt: 'Can you analyze this code further?',
            title: 'Deep Analysis'
          });
        }

        if (template.capabilities.includes('optimization')) {
          followups.push({
            prompt: 'How can I optimize this code?',
            title: 'Optimize Code'
          });
        }

        return followups;
      }
    }];
  }

  /**
   * Register default participants for common use cases
   */
  private async registerDefaultParticipants(): Promise<void> {
    // This would load default agent templates and register them
    this.logger.log('Registering default Copilot participants...');
    
    // Default participants will be added here based on available templates
  }

  /**
   * Setup WebSocket handlers for real-time communication
   */
  private setupWebSocketHandlers(): void {
    this.webSocketService.on('copilot.request', (data) => {
      this.handleWebSocketRequest(data);
    });

    this.webSocketService.on('copilot.participant.update', (data) => {
      this.handleParticipantUpdate(data);
    });
  }

  /**
   * Handle WebSocket requests
   */
  private async handleWebSocketRequest(data: any): Promise<void> {
    this.logger.debug('Received WebSocket request for Copilot integration:', data);
    // Handle external requests via WebSocket
  }

  /**
   * Handle participant updates
   */
  private async handleParticipantUpdate(data: any): Promise<void> {
    this.logger.debug('Received participant update:', data);
    // Update participant configuration
  }

  /**
   * Initialize chat capabilities
   */
  private async initializeChatCapabilities(): Promise<void> {
    this.logger.log('Initializing VS Code chat capabilities...');
    
    // Setup chat API integrations
    // Configure language model access
    // Initialize tool calling if available
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.on('copilot.participant.registered', (data) => {
      this.logger.log(`Copilot participant registered: ${data.participant.id}`);
    });

    this.on('copilot.request.completed', (data) => {
      this.logger.debug(`Copilot request completed: ${data.request.id}`);
    });

    this.on('copilot.request.failed', (data) => {
      this.logger.error(`Copilot request failed: ${data.request.id}`, data.error);
    });
  }

  /**
   * Get all registered participants
   */
  getParticipants(): CopilotParticipant[] {
    return Array.from(this.participants.values());
  }

  /**
   * Get participant by ID
   */
  getParticipant(id: string): CopilotParticipant | undefined {
    return this.participants.get(id);
  }

  /**
   * Remove participant
   */
  async removeParticipant(id: string): Promise<boolean> {
    const participant = this.participants.get(id);
    if (!participant) {
      return false;
    }

    // Remove from VS Code
    this.activeSessions.delete(id);
    
    // Remove from internal storage
    this.participants.delete(id);
    
    this.logger.log(`Removed Copilot participant: ${id}`);
    this.emit('copilot.participant.removed', { participantId: id });
    
    return true;
  }

  /**
   * Get service status
   */
  getStatus(): any {
    return {
      initialized: !!this.vsCodeExtensionContext,
      participantsCount: this.participants.size,
      activeSessionsCount: this.activeSessions.size,
      participants: this.getParticipants().map(p => ({
        id: p.id,
        name: p.name,
        tenantId: p.tenantId,
        isActive: p.isActive
      }))
    };
  }

  /**
   * Get all chat participants for a tenant with filtering options
   */
  async getChatParticipants(
    tenantId: string, 
    filters?: { active?: boolean; category?: string }
  ): Promise<ChatParticipant[]> {
    let participants = Array.from(this.participants.values())
      .filter(p => p.tenantId === tenantId);

    if (filters?.active !== undefined) {
      participants = participants.filter(p => p.isActive === filters.active);
    }

    if (filters?.category) {
      participants = participants.filter(p => 
        p.agentTemplate.capabilities.includes(filters.category)
      );
    }

    return participants.map(p => this.mapToApiParticipant(p));
  }

  /**
   * Get a specific chat participant for a tenant
   */
  async getChatParticipant(tenantId: string, participantId: string): Promise<ChatParticipant | null> {
    const fullId = participantId.includes('.') ? participantId : `${tenantId}.${participantId}`;
    const participant = this.participants.get(fullId);
    
    if (!participant || participant.tenantId !== tenantId) {
      return null;
    }

    return this.mapToApiParticipant(participant);
  }

  /**
   * Update a chat participant
   */
  async updateChatParticipant(
    tenantId: string, 
    participantId: string, 
    updateData: any
  ): Promise<ChatParticipant> {
    const fullId = participantId.includes('.') ? participantId : `${tenantId}.${participantId}`;
    const participant = this.participants.get(fullId);
    
    if (!participant || participant.tenantId !== tenantId) {
      throw new Error('Chat participant not found');
    }

    // Update participant properties
    if (updateData.name) participant.name = updateData.name;
    if (updateData.description) participant.description = updateData.description;
    if (updateData.fullName) participant.fullName = updateData.fullName;
    if (updateData.isActive !== undefined) participant.isActive = updateData.isActive;

    // Update commands if provided
    if (updateData.commands) {
      participant.commands = await this.updateParticipantCommands(participant, updateData.commands);
    }

    this.participants.set(fullId, participant);
    
    this.logger.log(`Updated chat participant: ${fullId}`);
    this.emit('copilot.participant.updated', { participant });

    return this.mapToApiParticipant(participant);
  }

  /**
   * Unregister a chat participant
   */
  async unregisterChatParticipant(tenantId: string, participantId: string): Promise<boolean> {
    const fullId = participantId.includes('.') ? participantId : `${tenantId}.${participantId}`;
    const participant = this.participants.get(fullId);
    
    if (!participant || participant.tenantId !== tenantId) {
      return false;
    }

    return await this.removeParticipant(fullId);
  }

  /**
   * Get participant commands
   */
  async getParticipantCommands(tenantId: string, participantId: string): Promise<CopilotCommand[]> {
    const fullId = participantId.includes('.') ? participantId : `${tenantId}.${participantId}`;
    const participant = this.participants.get(fullId);
    
    if (!participant || participant.tenantId !== tenantId) {
      throw new Error('Chat participant not found');
    }

    return participant.commands;
  }

  /**
   * Handle chat request (REST API version)
   */
  async handleChatRequest(
    tenantId: string,
    participantId: string,
    chatRequest: any
  ): Promise<ChatResponse> {
    const fullId = participantId.includes('.') ? participantId : `${tenantId}.${participantId}`;
    const participant = this.participants.get(fullId);
    
    if (!participant || participant.tenantId !== tenantId) {
      throw new Error('Chat participant not found');
    }

    const request: CopilotChatRequest = {
      id: `api-${Date.now()}`,
      tenantId,
      userId: 'api-user', // TODO: Get from request context
      prompt: chatRequest.prompt,
      command: chatRequest.command,
      context: chatRequest.context,
      variables: chatRequest.variables,
      timestamp: new Date()
    };

    const response = await this.processChatRequest(participant, request);
    
    return {
      id: response.id,
      requestId: response.requestId,
      content: response.content,
      type: response.type as any,
      metadata: response.metadata,
      timestamp: response.timestamp.toISOString(),
      tenantId
    };
  }

  /**
   * Handle streaming chat request (REST API version)
   */
  async handleChatRequestStream(
    tenantId: string,
    participantId: string,
    chatRequest: any,
    res: Response
  ): Promise<void> {
    const fullId = participantId.includes('.') ? participantId : `${tenantId}.${participantId}`;
    const participant = this.participants.get(fullId);
    
    if (!participant || participant.tenantId !== tenantId) {
      throw new Error('Chat participant not found');
    }

    const request: CopilotChatRequest = {
      id: `stream-${Date.now()}`,
      tenantId,
      userId: 'api-user',
      prompt: chatRequest.prompt,
      command: chatRequest.command,
      context: chatRequest.context,
      variables: chatRequest.variables,
      timestamp: new Date()
    };

    try {
      // Send initial event
      res.write(`data: ${JSON.stringify({ type: 'start', requestId: request.id })}\n\n`);

      // Process request
      const response = await this.processChatRequest(participant, request);

      // Stream response in chunks
      const chunks = this.chunkResponse(response.content);
      for (const chunk of chunks) {
        res.write(`data: ${JSON.stringify({ 
          type: 'chunk', 
          content: chunk,
          requestId: request.id 
        })}\n\n`);
        
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Send completion event
      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        requestId: request.id,
        metadata: response.metadata 
      })}\n\n`);

    } catch (error) {
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        error: (error as Error).message,
        requestId: request.id 
      })}\n\n`);
    } finally {
      res.end();
    }
  }

  /**
   * Get all available agent templates
   */
  async getAgentTemplates(): Promise<AgentTemplate[]> {
    // This would typically fetch from a database or registry
    // For now, return some example templates
    return [
      {
        id: 'code-analyst',
        name: 'code-analyst',
        displayName: 'Code Analyst',
        description: 'Analyzes code for quality, security, and performance',
        capabilities: ['code_analysis', 'security_scan', 'performance_review'],
        version: '1.0.0',
        category: 'development'
      },
      {
        id: 'documentation-generator',
        name: 'documentation-generator',
        displayName: 'Documentation Generator',
        description: 'Generates comprehensive documentation for code',
        capabilities: ['documentation', 'api_docs', 'code_comments'],
        version: '1.0.0',
        category: 'documentation'
      }
    ];
  }

  /**
   * Get a specific agent template
   */
  async getAgentTemplate(templateId: string): Promise<AgentTemplate | null> {
    const templates = await this.getAgentTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  /**
   * Create participant from template
   */
  async createParticipantFromTemplate(
    tenantId: string,
    templateId: string,
    participantId: string,
    customizations?: any
  ): Promise<ChatParticipant> {
    const template = await this.getAgentTemplate(templateId);
    if (!template) {
      throw new Error('Agent template not found');
    }

    const config = {
      name: participantId,
      ...customizations
    };

    const fullParticipantId = await this.registerChatParticipant(tenantId, template, config);
    const participant = this.participants.get(fullParticipantId);
    
    if (!participant) {
      throw new Error('Failed to create participant from template');
    }

    return this.mapToApiParticipant(participant);
  }

  /**
   * Batch operations on participants
   */
  async batchParticipantOperations(
    tenantId: string,
    operations: any[]
  ): Promise<BatchOperationResult> {
    const results: any[] = [];
    const errors: any[] = [];

    for (const operation of operations) {
      try {
        let result;
        switch (operation.type) {
          case 'create':
            result = await this.registerChatParticipant(tenantId, operation.data.template, operation.data.config);
            break;
          case 'update':
            result = await this.updateChatParticipant(tenantId, operation.participantId, operation.data);
            break;
          case 'delete':
            result = await this.unregisterChatParticipant(tenantId, operation.participantId);
            break;
          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }
        results.push({ operation: operation.id, success: true, result });
      } catch (error) {
        errors.push({ operation: operation.id, error: (error as Error).message });
      }
    }

    return {
      totalOperations: operations.length,
      successfulOperations: results.length,
      failedOperations: errors.length,
      results,
      errors
    };
  }

  /**
   * Get integration metrics
   */
  async getMetrics(tenantId: string): Promise<IntegrationMetrics> {
    const tenantParticipants = Array.from(this.participants.values())
      .filter(p => p.tenantId === tenantId);

    return {
      totalParticipants: tenantParticipants.length,
      activeParticipants: tenantParticipants.filter(p => p.isActive).length,
      totalRequests: 0, // Would track in real implementation
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Private helper methods
   */
  private mapToApiParticipant(participant: CopilotParticipant): ChatParticipant {
    return {
      id: participant.id,
      name: participant.name,
      fullName: participant.fullName,
      description: participant.description,
      iconPath: undefined, // Would be set based on template
      isSticky: false,
      sampleRequest: `Ask ${participant.fullName} about ${participant.agentTemplate.capabilities[0]}`,
      commands: participant.commands.map(cmd => ({
        name: cmd.name,
        description: cmd.description,
        sampleRequest: `@${participant.name} /${cmd.name}`
      })),
      followupProvider: participant.followupProviders.length > 0 ? {
        provideFollowups: true,
        supportedCommands: participant.commands.map(c => c.name)
      } : undefined
    };
  }

  private async updateParticipantCommands(
    participant: CopilotParticipant, 
    commandUpdates: any[]
  ): Promise<CopilotCommand[]> {
    // Update existing commands or add new ones
    const updatedCommands = [...participant.commands];
    
    for (const update of commandUpdates) {
      const existingIndex = updatedCommands.findIndex(c => c.name === update.name);
      if (existingIndex >= 0) {
        updatedCommands[existingIndex] = {
          ...updatedCommands[existingIndex],
          ...update,
          handler: updatedCommands[existingIndex].handler // Keep original handler
        };
      } else {
        // Add new command with default handler
        updatedCommands.push({
          name: update.name,
          description: update.description,
          handler: async (request: CopilotChatRequest) => {
            return {
              id: `${request.id}-${update.name}`,
              requestId: request.id,
              content: `Executing ${update.name} command...`,
              type: 'markdown',
              timestamp: new Date()
            };
          }
        });
      }
    }

    return updatedCommands;
  }

  private chunkResponse(content: string, chunkSize: number = 50): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
