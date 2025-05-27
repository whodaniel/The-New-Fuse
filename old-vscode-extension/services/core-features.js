"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreFeaturesManager = void 0;
const vscode = __importStar(require("vscode"));
const events_1 = require("events");
const logging_1 = require("../core/logging");
const conversation_manager_1 = require("./conversation-manager");
const agent_discovery_1 = require("./agent-discovery");
const relay_service_1 = require("./relay-service");
const file_protocol_1 = require("./file-protocol");
const shared_1 = require("../types/shared");
class CoreFeaturesManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.logger = logging_1.Logger.getInstance();
        this.conversationManager = conversation_manager_1.ConversationManager.getInstance();
        this.agentDiscovery = agent_discovery_1.AgentDiscoveryManager.getInstance();
        this.relayService = relay_service_1.RelayService.getInstance();
        this.fileProtocol = file_protocol_1.FileProtocolService.getInstance();
        this.statusBarItem = this.createStatusBarItem();
    }
    static getInstance() {
        if (!CoreFeaturesManager.instance) {
            CoreFeaturesManager.instance = new CoreFeaturesManager();
        }
        return CoreFeaturesManager.instance;
    }
    createStatusBarItem() {
        const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
        item.text = "$(versions) The New Fuse";
        item.tooltip = "The New Fuse Core Features";
        item.command = 'thefuse.showCommunicationPanel';
        return item;
    }
    async initialize() {
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
        }
        catch (error) {
            this.logger.error('Failed to initialize core features:', error);
            throw error;
        }
    }
    async registerSelfAsAgent() {
        const agent = {
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
        const capabilities = [
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
    setupEventHandlers() {
        // Handle agent-to-agent messages
        this.conversationManager.on('messageSent', (message) => {
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
    async handleAgentMessage(message) {
        try {
            if (message.type === shared_1.MessageType.AI_REQUEST) {
                await this.handleAIRequest(message);
            }
            else if (message.type === shared_1.MessageType.CODE_INPUT) {
                await this.handleCodeInput(message);
            }
        }
        catch (error) {
            this.logger.error('Error handling agent message:', error);
        }
    }
    async handleFileProtocolMessage(message) {
        try {
            if (message.action === 'mcp_request') {
                await this.handleMCPRequest(message.payload);
            }
            else if (message.action === 'agent_capability_query') {
                await this.handleCapabilityQuery(message);
            }
        }
        catch (error) {
            this.logger.error('Error handling file protocol message:', error);
        }
    }
    async handleMCPMessage(message) {
        try {
            const response = await this.processMCPRequest(message);
            await this.relayService.sendMessage(message.sourceAgent, {
                command: 'mcp_response',
                data: response
            });
        }
        catch (error) {
            this.logger.error('Error handling MCP message:', error);
        }
    }
    async handleAIRequest(message) {
        try {
            // Process AI request using MCP
            const response = await this.processMCPRequest({
                type: 'ai_request',
                content: message.content,
                metadata: message.metadata
            });
            // Send response back
            await this.conversationManager.sendMessage({
                type: shared_1.MessageType.AI_RESPONSE,
                conversationId: message.conversationId,
                sourceAgent: 'vscode.core',
                targetAgent: message.sourceAgent,
                content: response
            });
        }
        catch (error) {
            this.logger.error('Error handling AI request:', error);
        }
    }
    async handleCodeInput(message) {
        try {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                await editor.edit(editBuilder => {
                    const position = editor.selection.active;
                    editBuilder.insert(position, message.content);
                });
            }
        }
        catch (error) {
            this.logger.error('Error handling code input:', error);
        }
    }
    async handleCapabilityQuery(message) {
        try {
            const capabilities = this.agentDiscovery.getAgentCapabilities('vscode.core');
            await this.fileProtocol.sendMessage(message.sender, 'capability_response', { capabilities });
        }
        catch (error) {
            this.logger.error('Error handling capability query:', error);
        }
    }
    async processMCPRequest(request) {
        // Implement MCP request processing
        // This is a placeholder - actual implementation would depend on specific MCP requirements
        return {
            status: 'success',
            result: 'MCP request processed'
        };
    }
    async handleMCPRequest(request) {
        try {
            const response = await this.processMCPRequest(request);
            await this.fileProtocol.sendMessage(request.sender, 'mcp_response', response);
        }
        catch (error) {
            this.logger.error('Error handling MCP request:', error);
        }
    }
    dispose() {
        this.statusBarItem.dispose();
        this.removeAllListeners();
    }
}
exports.CoreFeaturesManager = CoreFeaturesManager;
//# sourceMappingURL=core-features.js.map