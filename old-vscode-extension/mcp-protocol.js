"use strict";
/**
 * Message Control Protocol (MCP) Implementation
 *
 * This module implements a simplified MCP protocol for AI agent communication,
 * enabling autonomous discovery and interaction between AI extensions.
 */
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
exports.MCPProtocolManager = void 0;
exports.createMCPProtocolManager = createMCPProtocolManager;
const vscode = __importStar(require("vscode"));
const utilities_1 = require("./utilities");
/**
 * MCP Protocol Manager
 */
class MCPProtocolManager {
    constructor(context, agentClient) {
        this.handlers = new Map();
        this.context = context;
        this.agentClient = agentClient;
        this.outputChannel = vscode.window.createOutputChannel('MCP Protocol');
        // Register this as an agent
        this.agentClient.register('MCP Protocol Manager', ['mcp', 'agent-discovery'], '1.0.0')
            .then(() => {
            this.log('MCP Protocol Manager registered');
            // Subscribe to receive messages
            this.agentClient.subscribe(this.handleAgentMessage.bind(this));
        });
        // Register the basic MCP handlers
        this.registerBuiltinHandlers();
        // Register commands
        this.registerCommands();
    }
    /**
     * Register built-in MCP handlers
     */
    registerBuiltinHandlers() {
        // Register the discovery handler
        this.registerHandler('mcp.core.discover', async () => {
            // Return list of registered agents
            return vscode.commands.executeCommand('llm-orchestrator.getRegisteredAgents');
        });
        // Register the capabilities handler
        this.registerHandler('mcp.core.getCapabilities', async (params) => {
            if (!params.agentId) {
                throw new Error('agentId parameter is required');
            }
            // Get agent capabilities
            return vscode.commands.executeCommand('llm-orchestrator.getAgentCapabilities', params.agentId);
        });
        // Register ping/echo handler
        this.registerHandler('mcp.core.echo', async (params) => {
            return {
                message: params.message || 'Hello from MCP Protocol Manager',
                timestamp: Date.now(),
                echo: true
            };
        });
    }
    /**
     * Register VS Code commands
     */
    registerCommands() {
        // Register a command to register an MCP handler
        this.context.subscriptions.push(vscode.commands.registerCommand('thefuse.mcp.registerHandler', async (namespace, handlerFn) => {
            await this.registerHandlerFromString(namespace, handlerFn);
            return true;
        }));
        // Register a command to send an MCP message
        this.context.subscriptions.push(vscode.commands.registerCommand('thefuse.mcp.sendMessage', async (recipient, namespace, command, parameters) => {
            return this.sendMCPMessage(recipient, namespace, command, parameters);
        }));
        // Register a command to trigger auto-discovery
        this.context.subscriptions.push(vscode.commands.registerCommand('thefuse.mcp.startAutoDiscovery', async () => {
            return this.startAutoDiscovery();
        }));
    }
    /**
     * Register an MCP handler
     */
    registerHandler(fullCommand, handler) {
        this.handlers.set(fullCommand, handler);
        this.log(`Registered handler for ${fullCommand}`);
    }
    /**
     * Register an MCP handler from a string or function
     */
    async registerHandlerFromString(fullCommand, handlerFn) {
        try {
            let handler;
            if (typeof handlerFn === 'function') {
                handler = handlerFn;
            }
            else if (typeof handlerFn === 'string') {
                // Convert string to function
                // eslint-disable-next-line no-new-func
                handler = new Function('parameters', `return (async () => { ${handlerFn} })()`);
            }
            else {
                throw new Error('Invalid handler: must be a function or string');
            }
            this.registerHandler(fullCommand, handler);
            return true;
        }
        catch (error) {
            this.log(`Error registering handler for ${fullCommand}: ${(0, utilities_1.getErrorMessage)(error)}`);
            return false;
        }
    }
    /**
     * Send an MCP message to another agent
     */
    async sendMCPMessage(recipient, namespace, command, parameters) {
        try {
            const fullCommand = `${namespace}.${command}`;
            this.log(`Sending MCP message: ${fullCommand} to ${recipient}`);
            const result = await this.agentClient.sendMessage(recipient, 'mcp.execute', {
                namespace,
                command,
                parameters,
                requestId: `mcp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            });
            return { success: true, result };
        }
        catch (error) {
            this.log(`Error sending MCP message: ${(0, utilities_1.getErrorMessage)(error)}`);
            return { success: false, error: (0, utilities_1.getErrorMessage)(error) };
        }
    }
    /**
     * Start auto-discovery of AI agents
     */
    async startAutoDiscovery() {
        try {
            this.log('Starting auto-discovery of AI agents');
            // Broadcast discovery message
            await this.agentClient.broadcast('mcp.execute', {
                namespace: 'mcp.core',
                command: 'discover',
                parameters: {},
                requestId: `mcp-discovery-${Date.now()}`
            });
            return true;
        }
        catch (error) {
            this.log(`Error in auto-discovery: ${(0, utilities_1.getErrorMessage)(error)}`);
            return false;
        }
    }
    /**
     * Handle incoming agent messages
     */
    async handleAgentMessage(message) {
        if (message.action === 'mcp.execute') {
            const mcpMessage = message.payload;
            const fullCommand = `${mcpMessage.namespace}.${mcpMessage.command}`;
            this.log(`Received MCP execute: ${fullCommand}`);
            // Find the handler
            const handler = this.handlers.get(fullCommand);
            if (!handler) {
                // Send error response
                await this.agentClient.sendMessage(message.sender, 'mcp.response', {
                    requestId: mcpMessage.requestId,
                    success: false,
                    error: `No handler registered for ${fullCommand}`
                });
                return;
            }
            try {
                // Execute the handler
                const result = await handler(mcpMessage.parameters);
                // Send response
                await this.agentClient.sendMessage(message.sender, 'mcp.response', {
                    requestId: mcpMessage.requestId,
                    success: true,
                    result
                });
            }
            catch (error) {
                // Send error response
                await this.agentClient.sendMessage(message.sender, 'mcp.response', {
                    requestId: mcpMessage.requestId,
                    success: false,
                    error: error.message
                });
            }
        }
        else if (message.action === 'mcp.response') {
            // Handle response to a previous MCP execute
            this.log(`Received MCP response for request ${message.payload.requestId}`);
            // In a real implementation, this would resolve a promise for the original request
        }
    }
    /**
     * Log a message to the output channel
     */
    log(message) {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    }
    /**
     * Dispose of resources
     */
    dispose() {
        this.outputChannel.dispose();
    }
}
exports.MCPProtocolManager = MCPProtocolManager;
// Export factory function
function createMCPProtocolManager(context, agentClient) {
    return new MCPProtocolManager(context, agentClient);
}
//# sourceMappingURL=mcp-protocol.js.map