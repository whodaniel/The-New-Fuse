var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MCPFileCoordinationServer_1;
var _a, _b, _c;
import { Injectable, Logger } from '@nestjs/common';
import { MCPServer, MCPServerOptions } from './types.js';
import { FileCreationCoordinationService } from '../vscode-extension/src/coordination/FileCreationCoordinationService';
import { FileCoordinationManager } from '../vscode-extension/src/coordination/FileCoordinationManager';
/**
 * MCP Server for File Creation Coordination System
 *
 * This server exposes file coordination capabilities through the MCP protocol,
 * allowing agents to coordinate file creation activities across the system.
 */
let MCPFileCoordinationServer = MCPFileCoordinationServer_1 = class MCPFileCoordinationServer extends MCPServer {
    coordinationService;
    coordinationManager;
    logger = new Logger(MCPFileCoordinationServer_1.name);
    constructor(coordinationService, coordinationManager, options = {}) {
        super(options);
        this.coordinationService = coordinationService;
        this.coordinationManager = coordinationManager;
        this.initializeTools();
    }
    /**
     * Initialize MCP tools for file coordination
     */
    initializeTools() {
        this.tools = {
            // Configuration Management Tools
            'fileCoordination.getConfig': {
                description: 'Get current file coordination system configuration',
                parameters: {},
                execute: this.getConfiguration.bind(this)
            },
            'fileCoordination.updateConfig': {
                description: 'Update file coordination system configuration',
                parameters: {
                    config: {
                        type: 'object',
                        description: 'Configuration object to update',
                        properties: {
                            enableFileCreationParticipants: { type: 'boolean' },
                            enableSwarmIntegration: { type: 'boolean' },
                            enableAgentChat: { type: 'boolean' },
                            coordinationTimeout: { type: 'number' },
                            maxParticipants: { type: 'number' }
                        }
                    }
                },
                execute: this.updateConfiguration.bind(this)
            },
            // Session Management Tools
            'fileCoordination.getActiveSessions': {
                description: 'Get all currently active coordination sessions',
                parameters: {},
                execute: this.getActiveSessions.bind(this)
            },
            'fileCoordination.getSession': {
                description: 'Get details of a specific coordination session',
                parameters: {
                    sessionId: {
                        type: 'string',
                        description: 'ID of the coordination session to retrieve'
                    }
                },
                execute: this.getSession.bind(this)
            },
            'fileCoordination.getSessionHistory': {
                description: 'Get coordination session history with filtering options',
                parameters: {
                    page: { type: 'number', description: 'Page number (default: 1)' },
                    limit: { type: 'number', description: 'Results per page (default: 20)' },
                    status: { type: 'string', description: 'Filter by session status' },
                    agentId: { type: 'string', description: 'Filter by involved agent ID' }
                },
                execute: this.getSessionHistory.bind(this)
            },
            // Participant Management Tools
            'fileCoordination.getParticipants': {
                description: 'Get all registered file creation participants',
                parameters: {},
                execute: this.getParticipants.bind(this)
            },
            'fileCoordination.registerParticipant': {
                description: 'Register a new file creation participant',
                parameters: {
                    agentId: { type: 'string', description: 'Unique identifier for the agent' },
                    agentName: { type: 'string', description: 'Human-readable name for the agent' },
                    capabilities: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'List of capabilities this agent provides'
                    },
                    priority: { type: 'number', description: 'Priority level (higher runs first)' },
                    metadata: { type: 'object', description: 'Optional metadata for the participant' }
                },
                execute: this.registerParticipant.bind(this)
            },
            'fileCoordination.unregisterParticipant': {
                description: 'Remove a registered file creation participant',
                parameters: {
                    agentId: { type: 'string', description: 'ID of the agent to unregister' }
                },
                execute: this.unregisterParticipant.bind(this)
            },
            // File Creation Tools
            'fileCoordination.createFile': {
                description: 'Create a file with multi-agent coordination',
                parameters: {
                    filePath: { type: 'string', description: 'Path where the file should be created' },
                    content: { type: 'string', description: 'Initial content for the file' },
                    triggerCoordination: { type: 'boolean', description: 'Whether to trigger agent coordination' },
                    metadata: { type: 'object', description: 'Additional metadata for the file creation' }
                },
                execute: this.createFileWithCoordination.bind(this)
            },
            'fileCoordination.prepareFileCreation': {
                description: 'Prepare for file creation by running coordination analysis',
                parameters: {
                    filePath: { type: 'string', description: 'Path where the file will be created' },
                    fileType: { type: 'string', description: 'Type/extension of the file' },
                    context: { type: 'object', description: 'Additional context for preparation' }
                },
                execute: this.prepareFileCreation.bind(this)
            },
            // Monitoring and Statistics Tools
            'fileCoordination.getStats': {
                description: 'Get comprehensive coordination system statistics',
                parameters: {},
                execute: this.getCoordinationStats.bind(this)
            },
            'fileCoordination.getSystemHealth': {
                description: 'Get health status of the file coordination system',
                parameters: {},
                execute: this.getSystemHealth.bind(this)
            },
            // Agent Communication Tools
            'fileCoordination.sendCoordinationMessage': {
                description: 'Send a message to agents in a coordination session',
                parameters: {
                    sessionId: { type: 'string', description: 'ID of the coordination session' },
                    message: { type: 'string', description: 'Message content to send' },
                    senderId: { type: 'string', description: 'ID of the message sender' },
                    messageType: { type: 'string', description: 'Type of message (info, warning, error, etc.)' }
                },
                execute: this.sendCoordinationMessage.bind(this)
            },
            'fileCoordination.getCoordinationMessages': {
                description: 'Get messages from a coordination session chat room',
                parameters: {
                    sessionId: { type: 'string', description: 'ID of the coordination session' },
                    limit: { type: 'number', description: 'Maximum number of messages to retrieve' }
                },
                execute: this.getCoordinationMessages.bind(this)
            },
            // Template and Context Tools
            'fileCoordination.getTemplatesForFile': {
                description: 'Get available templates for a specific file type',
                parameters: {
                    fileExtension: { type: 'string', description: 'File extension (e.g., .ts, .js, .py)' },
                    context: { type: 'object', description: 'Context information for template selection' }
                },
                execute: this.getTemplatesForFile.bind(this)
            },
            'fileCoordination.analyzeFileContext': {
                description: 'Analyze workspace context for optimal file placement',
                parameters: {
                    filePath: { type: 'string', description: 'Proposed file path' },
                    analyzeDepth: { type: 'number', description: 'Depth of context analysis (1-3)' }
                },
                execute: this.analyzeFileContext.bind(this)
            },
            // Advanced Coordination Tools
            'fileCoordination.simulateCoordination': {
                description: 'Simulate a coordination session without actually creating files',
                parameters: {
                    filePath: { type: 'string', description: 'Path to simulate file creation for' },
                    participants: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Specific participants to include in simulation'
                    }
                },
                execute: this.simulateCoordination.bind(this)
            },
            'fileCoordination.optimizeParticipantOrder': {
                description: 'Get optimized execution order for participants based on dependencies',
                parameters: {
                    participants: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'List of participant IDs to optimize'
                    },
                    fileContext: { type: 'object', description: 'Context about the file being created' }
                },
                execute: this.optimizeParticipantOrder.bind(this)
            }
        };
    }
    // Tool Implementation Methods
    async getConfiguration() {
        try {
            return await this.coordinationManager.getConfiguration();
        }
        catch (error) {
            this.logger.error('Failed to get configuration:', error);
            throw new Error(`Failed to retrieve configuration: ${error.message}`);
        }
    }
    async updateConfiguration(params) {
        try {
            await this.coordinationManager.updateConfiguration(params.config);
            return { success: true, message: 'Configuration updated successfully' };
        }
        catch (error) {
            this.logger.error('Failed to update configuration:', error);
            throw new Error(`Failed to update configuration: ${error.message}`);
        }
    }
    async getActiveSessions() {
        try {
            const sessions = this.coordinationService.getActiveCoordinations();
            return sessions.map(session => ({
                id: session.id,
                fileName: session.fileEvent.fileName,
                fileUri: session.fileEvent.uri.toString(),
                status: session.status,
                involvedAgents: session.involvedAgents,
                startedAt: session.startedAt,
                chatRoomId: session.chatRoomId
            }));
        }
        catch (error) {
            this.logger.error('Failed to get active sessions:', error);
            throw new Error(`Failed to retrieve active sessions: ${error.message}`);
        }
    }
    async getSession(params) {
        try {
            const session = this.coordinationService.getCoordinationSession(params.sessionId);
            if (!session) {
                throw new Error(`Session ${params.sessionId} not found`);
            }
            return {
                id: session.id,
                fileName: session.fileEvent.fileName,
                fileUri: session.fileEvent.uri.toString(),
                status: session.status,
                involvedAgents: session.involvedAgents,
                startedAt: session.startedAt,
                completedAt: session.completedAt,
                chatRoomId: session.chatRoomId,
                swarmExecutionId: session.swarmExecutionId
            };
        }
        catch (error) {
            this.logger.error(`Failed to get session ${params.sessionId}:`, error);
            throw new Error(`Failed to retrieve session: ${error.message}`);
        }
    }
    async getSessionHistory(params) {
        try {
            return await this.coordinationService.getCoordinationHistory({
                page: params.page || 1,
                limit: params.limit || 20,
                status: params.status,
                agentId: params.agentId
            });
        }
        catch (error) {
            this.logger.error('Failed to get session history:', error);
            throw new Error(`Failed to retrieve session history: ${error.message}`);
        }
    }
    async getParticipants() {
        try {
            return await this.coordinationService.getRegisteredParticipants();
        }
        catch (error) {
            this.logger.error('Failed to get participants:', error);
            throw new Error(`Failed to retrieve participants: ${error.message}`);
        }
    }
    async registerParticipant(params) {
        try {
            const participant = {
                agentId: params.agentId,
                agentName: params.agentName,
                capabilities: params.capabilities,
                priority: params.priority,
                participate: async (event) => ({
                    willParticipate: true,
                    estimatedDuration: 1000
                })
            };
            this.coordinationService.registerCustomParticipant(participant);
            return {
                success: true,
                message: `Participant ${params.agentName} registered successfully`
            };
        }
        catch (error) {
            this.logger.error('Failed to register participant:', error);
            throw new Error(`Failed to register participant: ${error.message}`);
        }
    }
    async unregisterParticipant(params) {
        try {
            await this.coordinationService.unregisterParticipant(params.agentId);
            return {
                success: true,
                message: `Participant ${params.agentId} unregistered successfully`
            };
        }
        catch (error) {
            this.logger.error('Failed to unregister participant:', error);
            throw new Error(`Failed to unregister participant: ${error.message}`);
        }
    }
    async createFileWithCoordination(params) {
        try {
            const result = await this.coordinationService.createFileWithCoordination({
                filePath: params.filePath,
                content: params.content || '',
                triggerCoordination: params.triggerCoordination ?? true,
                metadata: params.metadata
            });
            return {
                success: true,
                sessionId: result.sessionId,
                message: `File creation initiated at ${params.filePath}`
            };
        }
        catch (error) {
            this.logger.error('Failed to create file with coordination:', error);
            throw new Error(`Failed to create file: ${error.message}`);
        }
    }
    async prepareFileCreation(params) {
        try {
            return await this.coordinationService.prepareFileCreation({
                filePath: params.filePath,
                fileType: params.fileType,
                context: params.context
            });
        }
        catch (error) {
            this.logger.error('Failed to prepare file creation:', error);
            throw new Error(`Failed to prepare file creation: ${error.message}`);
        }
    }
    async getCoordinationStats() {
        try {
            return await this.coordinationService.getCoordinationStatistics();
        }
        catch (error) {
            this.logger.error('Failed to get coordination stats:', error);
            throw new Error(`Failed to retrieve statistics: ${error.message}`);
        }
    }
    async getSystemHealth() {
        try {
            return await this.coordinationManager.getSystemHealth();
        }
        catch (error) {
            this.logger.error('Failed to get system health:', error);
            return {
                overall: 'unhealthy',
                components: {
                    fileCoordinationService: { status: 'error', message: error.message }
                }
            };
        }
    }
    async sendCoordinationMessage(params) {
        try {
            return await this.coordinationService.sendCoordinationMessage(params.sessionId, params.message, params.senderId, params.messageType || 'info');
        }
        catch (error) {
            this.logger.error('Failed to send coordination message:', error);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }
    async getCoordinationMessages(params) {
        try {
            return await this.coordinationService.getCoordinationMessages(params.sessionId, params.limit || 50);
        }
        catch (error) {
            this.logger.error('Failed to get coordination messages:', error);
            throw new Error(`Failed to retrieve messages: ${error.message}`);
        }
    }
    async getTemplatesForFile(params) {
        try {
            return await this.coordinationService.getTemplatesForFile(params.fileExtension, params.context);
        }
        catch (error) {
            this.logger.error('Failed to get templates:', error);
            throw new Error(`Failed to retrieve templates: ${error.message}`);
        }
    }
    async analyzeFileContext(params) {
        try {
            return await this.coordinationService.analyzeFileContext(params.filePath, params.analyzeDepth || 2);
        }
        catch (error) {
            this.logger.error('Failed to analyze file context:', error);
            throw new Error(`Failed to analyze context: ${error.message}`);
        }
    }
    async simulateCoordination(params) {
        try {
            return await this.coordinationService.simulateCoordination(params.filePath, params.participants);
        }
        catch (error) {
            this.logger.error('Failed to simulate coordination:', error);
            throw new Error(`Failed to simulate coordination: ${error.message}`);
        }
    }
    async optimizeParticipantOrder(params) {
        try {
            return await this.coordinationService.optimizeParticipantOrder(params.participants, params.fileContext);
        }
        catch (error) {
            this.logger.error('Failed to optimize participant order:', error);
            throw new Error(`Failed to optimize order: ${error.message}`);
        }
    }
    /**
     * Get available MCP tools for this server
     */
    getTools() {
        return this.tools;
    }
};
MCPFileCoordinationServer = MCPFileCoordinationServer_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof FileCreationCoordinationService !== "undefined" && FileCreationCoordinationService) === "function" ? _a : Object, typeof (_b = typeof FileCoordinationManager !== "undefined" && FileCoordinationManager) === "function" ? _b : Object, typeof (_c = typeof MCPServerOptions !== "undefined" && MCPServerOptions) === "function" ? _c : Object])
], MCPFileCoordinationServer);
export { MCPFileCoordinationServer };
//# sourceMappingURL=MCPFileCoordinationServer.js.map