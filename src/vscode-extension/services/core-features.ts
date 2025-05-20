import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { getLogger, Logger } from '../src/core/logging.js';
import { ConversationManager } from './conversation-manager.js';
import { AgentDiscoveryManager } from './agent-discovery.js';
import { RelayService } from './relay-service.js';
import { FileProtocolService } from './file-protocol.js';
import { AIMessage, MessageType, AIAgent, AgentCapability } from '../types/shared.js';

export class CoreFeaturesManager extends EventEmitter {
    private static instance: CoreFeaturesManager;
    private logger: Logger;
    private conversationManager: ConversationManager;
    private agentDiscovery: AgentDiscoveryManager;
    private relayService: RelayService;
    private fileProtocol: FileProtocolService;
    private statusBarItem: vscode.StatusBarItem;

    private constructor() {
        super();
        this.logger = Logger.getInstance();
        this.conversationManager = ConversationManager.getInstance();
        this.agentDiscovery = AgentDiscoveryManager.getInstance();
        this.relayService = RelayService.getInstance();
        this.fileProtocol = FileProtocolService.getInstance();
        this.statusBarItem = this.createStatusBarItem();
    }

    public static getInstance(): CoreFeaturesManager {
        if (!CoreFeaturesManager.instance) {
            CoreFeaturesManager.instance = new CoreFeaturesManager();
        }
        return CoreFeaturesManager.instance;
    }

    private createStatusBarItem(): vscode.StatusBarItem {
        const item = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            1000
        );
        item.text = "$(versions) The New Fuse";
        item.tooltip = "The New Fuse Core Features";
        item.command = 'thefuse.showCommunicationPanel';
        return item;
    }

    public async initialize(): Promise<void> {
        try {
            // Initialize core services
            await this.fileProtocol.initialize();
            
            // Register this instance as an AI agent
            await this.registerSelfAsAgent();

            // Setup event handlers
            this.setupEventHandlers();

            // Show status bar item
            this.statusBarItem.show();

            this.logger.info('Core features manager initialized');
        } catch (error) {
            this.logger.error('Failed to initialize core features:', error);
            throw error;
        }
    }

    private async registerSelfAsAgent(): Promise<void> {
        const agent: AIAgent = {
            id: 'vscode.core',
            name: 'The New Fuse Core',
            capabilities: [
                'mcp',
                'agent-communication',
                'file-protocol',
                'code-execution'
            ],
            version: '1.0.0',
            provider: 'vscode',
            apiVersion: '1.0.0',
            lastSeen: Date.now(),
            active: true
        };

        await this.agentDiscovery.registerAgent(agent);

        // Register core capabilities
        const capabilities: AgentCapability[] = [
            {
                id: 'mcp',
                name: 'Model Context Protocol',
                description: 'Supports MCP for standardized AI agent interactions'
            },
            {
                id: 'agent-communication',
                name: 'Agent Communication',
                description: 'Enables direct agent-to-agent communication'
            },
            {
                id: 'file-protocol',
                name: 'File Protocol',
                description: 'Supports file-based agent communication'
            },
            {
                id: 'code-execution',
                name: 'Code Execution',
                description: 'Enables code execution and workspace manipulation'
            }
        ];

        for (const capability of capabilities) {
            await this.agentDiscovery.registerCapability('vscode.core', capability);
        }
    }

    private setupEventHandlers(): void {
        // Handle agent-to-agent messages
        this.conversationManager.on('messageSent', (message: AIMessage) => {
            this.handleAgentMessage(message);
        });

        // Handle file protocol messages
        this.fileProtocol.on('message', (message) => {
            this.handleFileProtocolMessage(message);
        });

        // Handle MCP-related messages
        this.relayService.registerHandler('mcp', async (message) => {
            await this.handleMCPMessage(message);
        });
    }

    private async handleAgentMessage(message: AIMessage): Promise<void> {
        try {
            if (message.type === MessageType.AI_REQUEST) {
                await this.handleAIRequest(message);
            } else if (message.type === MessageType.CODE_INPUT) {
                await this.handleCodeInput(message);
            }
        } catch (error) {
            this.logger.error('Error handling agent message:', error);
        }
    }

    private async handleFileProtocolMessage(message: any): Promise<void> {
        try {
            if (message.action === 'mcp_request') {
                await this.handleMCPRequest(message.payload);
            } else if (message.action === 'agent_capability_query') {
                await this.handleCapabilityQuery(message);
            }
        } catch (error) {
            this.logger.error('Error handling file protocol message:', error);
        }
    }

    private async handleMCPMessage(message: any): Promise<void> {
        try {
            const response = await this.processMCPRequest(message);
            await this.relayService.sendMessage(message.sourceAgent, {
                command: 'mcp_response',
                data: response
            });
        } catch (error) {
            this.logger.error('Error handling MCP message:', error);
        }
    }

    private async handleAIRequest(message: AIMessage): Promise<void> {
        try {
            // Process AI request using MCP
            const response = await this.processMCPRequest({
                type: 'ai_request',
                content: message.content,
                metadata: message.metadata
            });

            // Send response back
            await this.conversationManager.sendMessage({
                type: MessageType.AI_RESPONSE,
                conversationId: message.conversationId,
                sourceAgent: 'vscode.core',
                targetAgent: message.sourceAgent,
                content: response
            });
        } catch (error) {
            this.logger.error('Error handling AI request:', error);
        }
    }

    private async handleCodeInput(message: AIMessage): Promise<void> {
        try {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                await editor.edit(editBuilder => {
                    const position = editor.selection.active;
                    editBuilder.insert(position, message.content);
                });
            }
        } catch (error) {
            this.logger.error('Error handling code input:', error);
        }
    }

    private async handleCapabilityQuery(message: any): Promise<void> {
        try {
            const capabilities = this.agentDiscovery.getAgentCapabilities('vscode.core');
            await this.fileProtocol.sendMessage(
                message.sender,
                'capability_response',
                { capabilities }
            );
        } catch (error) {
            this.logger.error('Error handling capability query:', error);
        }
    }

    private async processMCPRequest(request: any): Promise<any> {
        // Implement MCP request processing
        // This is a placeholder - actual implementation would depend on specific MCP requirements
        return {
            status: 'success',
            result: 'MCP request processed'
        };
    }

    private async handleMCPRequest(request: any): Promise<void> {
        try {
            const response = await this.processMCPRequest(request);
            await this.fileProtocol.sendMessage(
                request.sender,
                'mcp_response',
                response
            );
        } catch (error) {
            this.logger.error('Error handling MCP request:', error);
        }
    }

    public dispose(): void {
        this.statusBarItem.dispose();
        this.removeAllListeners();
    }
}