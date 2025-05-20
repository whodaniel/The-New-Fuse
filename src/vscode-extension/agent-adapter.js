"use strict";
/**
 * Agent Adapter Module
 *
 * This module provides adapters for integrating with specific VS Code AI extensions,
 * allowing them to participate in The New Fuse's inter-extension communication system.
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
exports.AgentAdapterManager = exports.ClaudeAdapter = exports.CopilotAdapter = void 0;
exports.createAgentAdapterManager = createAgentAdapterManager;
const vscode = __importStar(require("vscode"));
/**
 * Adapter for GitHub Copilot
 */
class CopilotAdapter {
    constructor(context, agentClient) {
        this.id = 'github.copilot';
        this.name = 'GitHub Copilot';
        this.extensionId = 'GitHub.copilot';
        this.capabilities = ['code-completion', 'code-generation'];
        this.isActive = true;
        this.initialized = false;
        this.commandMap = {
            'generateCode': 'github.copilot.generate',
            'explainCode': 'github.copilot.explain',
            'completions': 'github.copilot.provideInlineCompletions'
        };
        this.context = context;
        this.agentClient = agentClient;
    }
    async isAvailable() {
        const commands = await vscode.commands.getCommands(true);
        return commands.includes(this.commandMap.generateCode);
    }
    async initialize() {
        if (this.initialized)
            return true;
        try {
            // Register this adapter as an agent
            const registered = await this.agentClient.register(this.name, ['code-generation', 'code-explanation', 'code-completion'], '1.0.0');
            if (registered) {
                // Subscribe to receive messages
                await this.agentClient.subscribe(this.handleAgentMessage.bind(this));
                this.initialized = true;
                return true;
            }
            return false;
        }
        catch (error) {
            console.error(`Failed to initialize ${this.name} adapter:`, error);
            return false;
        }
    }
    async executeCommand(action, input) {
        const commandId = this.commandMap[action];
        if (!commandId) {
            throw new Error(`Unsupported action: ${action}`);
        }
        // Adapt input to the format expected by Copilot
        const adaptedInput = this.adaptInput(action, input);
        // Execute the command
        return vscode.commands.executeCommand(commandId, adaptedInput);
    }
    adaptInput(action, input) {
        switch (action) {
            case 'generateCode':
                return {
                    prompt: input.prompt,
                    context: input.context,
                    language: input.language
                };
            case 'explainCode':
                return {
                    code: input.code,
                    language: input.language
                };
            case 'completions':
                return input; // Pass through as is
            default:
                return input;
        }
    }
    async handleAgentMessage(message) {
        if (message.recipient !== this.id)
            return;
        try {
            let response;
            switch (message.action) {
                case 'generateCode':
                case 'explainCode':
                case 'completions':
                    response = await this.executeCommand(message.action, message.payload);
                    break;
                default:
                    throw new Error(`Unsupported action: ${message.action}`);
            }
            // Send response back to sender
            await this.agentClient.sendMessage(message.sender, `${message.action}Response`, {
                requestId: message.id,
                result: response,
                success: true
            });
        }
        catch (error) {
            // Send error response
            await this.agentClient.sendMessage(message.sender, `${message.action}Response`, {
                requestId: message.id,
                error: error.message,
                success: false
            });
        }
    }
    dispose() {
        // Nothing to dispose
    }
}
exports.CopilotAdapter = CopilotAdapter;
/**
 * Adapter for Claude extension
 */
class ClaudeAdapter {
    constructor(context, agentClient) {
        this.id = 'anthropic.claude';
        this.name = 'Claude';
        this.extensionId = 'anthropic.claude';
        this.capabilities = ['text-generation', 'code-explanation'];
        this.isActive = true;
        this.initialized = false;
        this.commandMap = {
            'generateText': 'anthropic.claude.generate',
            'completions': 'anthropic.claude.completions'
        };
        this.context = context;
        this.agentClient = agentClient;
    }
    async isAvailable() {
        const commands = await vscode.commands.getCommands(true);
        return commands.includes(this.commandMap.generateText);
    }
    async initialize() {
        if (this.initialized)
            return true;
        try {
            // Register this adapter as an agent
            const registered = await this.agentClient.register(this.name, ['text-generation', 'code-generation', 'code-explanation'], '1.0.0');
            if (registered) {
                // Subscribe to receive messages
                await this.agentClient.subscribe(this.handleAgentMessage.bind(this));
                this.initialized = true;
                return true;
            }
            return false;
        }
        catch (error) {
            console.error(`Failed to initialize ${this.name} adapter:`, error);
            return false;
        }
    }
    async executeCommand(action, input) {
        const commandId = this.commandMap[action];
        if (!commandId) {
            throw new Error(`Unsupported action: ${action}`);
        }
        // Adapt input to the format expected by Claude
        const adaptedInput = this.adaptInput(action, input);
        // Execute the command
        return vscode.commands.executeCommand(commandId, adaptedInput);
    }
    adaptInput(action, input) {
        switch (action) {
            case 'generateText':
                return {
                    prompt: input.prompt,
                    system: input.systemPrompt,
                    maxTokens: input.maxTokens,
                    temperature: input.temperature,
                    model: input.model || 'claude-2.0'
                };
            case 'completions':
                return input; // Pass through as is
            default:
                return input;
        }
    }
    async handleAgentMessage(message) {
        if (message.recipient !== this.id)
            return;
        try {
            let response;
            switch (message.action) {
                case 'generateText':
                case 'completions':
                    response = await this.executeCommand(message.action, message.payload);
                    break;
                default:
                    throw new Error(`Unsupported action: ${message.action}`);
            }
            // Send response back to sender
            await this.agentClient.sendMessage(message.sender, `${message.action}Response`, {
                requestId: message.id,
                result: response,
                success: true
            });
        }
        catch (error) {
            // Send error response
            await this.agentClient.sendMessage(message.sender, `${message.action}Response`, {
                requestId: message.id,
                error: error.message,
                success: false
            });
        }
    }
    dispose() {
        // Nothing to dispose
    }
}
exports.ClaudeAdapter = ClaudeAdapter;
/**
 * AgentAdapterManager manages all the extension adapters
 */
class AgentAdapterManager {
    constructor(context, agentClient, outputChannel) {
        this.adapters = new Map();
        this.context = context;
        this.agentClient = agentClient;
        this.outputChannel = outputChannel;
    }
    /**
     * Initialize the adapter manager and discover extensions
     */
    async initialize() {
        // Set up listeners for extension changes
        vscode.extensions.onDidChange(() => this.detectExtensions());
        // Discover extensions
        await this.detectExtensions();
        // Listen for adapter messages
        this.agentClient.subscribe(this.handleAdapterMessage.bind(this));
        this.log('Agent Adapter Manager initialized');
    }
    /**
     * Get available adapters
     */
    getAvailableAdapters() {
        return Array.from(this.adapters.values());
    }
    /**
     * Get adapter by ID
     */
    getAdapter(id) {
        return this.adapters.get(id);
    }
    /**
     * Handle messages directed to adapters
     */
    async handleAdapterMessage(message) {
        // Check if this is a message for an adapter
        if (message.action === 'adapter.register') {
            await this.registerAdapter(message.payload);
        }
        else if (message.action === 'adapter.message') {
            await this.routeMessageToAdapter(message.payload);
        }
    }
    /**
     * Register an adapter from a registration message
     */
    async registerAdapter(registration) {
        try {
            if (!registration.id || !registration.name || !registration.extensionId) {
                this.log(`Invalid adapter registration: missing required fields`);
                return;
            }
            const adapter = {
                id: registration.id,
                name: registration.name,
                extensionId: registration.extensionId,
                capabilities: registration.capabilities || [],
                isActive: true,
                // Method to send messages to this adapter
                sendMessage: async (action, payload) => {
                    return this.agentClient.sendMessage(registration.id, action, payload);
                }
            };
            this.adapters.set(registration.id, adapter);
            this.log(`Registered adapter: ${registration.name} (${registration.id})`);
            // Send acknowledgement
            await this.agentClient.sendMessage(registration.id, 'adapter.registered', {
                success: true,
                timestamp: Date.now()
            });
        }
        catch (error) {
            this.log(`Error registering adapter: ${error.message}`);
        }
    }
    /**
     * Route a message to an adapter
     */
    async routeMessageToAdapter(message) {
        try {
            const { targetId, action, payload } = message;
            if (!targetId || !action) {
                this.log(`Invalid adapter message: missing required fields`);
                return;
            }
            const adapter = this.adapters.get(targetId);
            if (!adapter) {
                this.log(`Adapter not found: ${targetId}`);
                return;
            }
            // Send the message to the adapter
            await adapter.sendMessage(action, payload);
            this.log(`Routed message to adapter ${targetId}: ${action}`);
        }
        catch (error) {
            this.log(`Error routing adapter message: ${error.message}`);
        }
    }
    /**
     * Detect installed AI extensions and create adapters
     */
    async detectExtensions() {
        try {
            // List of known AI extensions with their adapter configurations
            const knownExtensions = [
                {
                    extensionId: 'GitHub.copilot',
                    adapterId: 'github.copilot',
                    name: 'GitHub Copilot',
                    capabilities: ['code-completion', 'code-generation']
                },
                {
                    extensionId: 'anthropic.claude',
                    adapterId: 'anthropic.claude',
                    name: 'Claude',
                    capabilities: ['text-generation', 'code-explanation']
                },
                {
                    extensionId: 'openai.gpt',
                    adapterId: 'openai.gpt',
                    name: 'OpenAI GPT',
                    capabilities: ['text-generation', 'image-generation']
                }
            ];
            // Create adapters for installed extensions
            let detectedCount = 0;
            for (const extConfig of knownExtensions) {
                const extension = vscode.extensions.getExtension(extConfig.extensionId);
                if (extension) {
                    // Create adapter if it doesn't exist yet
                    if (!this.adapters.has(extConfig.adapterId)) {
                        const adapter = {
                            id: extConfig.adapterId,
                            name: extConfig.name,
                            extensionId: extConfig.extensionId,
                            capabilities: extConfig.capabilities,
                            isActive: extension.isActive,
                            sendMessage: async (action, payload) => {
                                // Use the extension's exports if available
                                if (extension.isActive && extension.exports && typeof extension.exports.receiveMessage === 'function') {
                                    return extension.exports.receiveMessage(action, payload);
                                }
                                // Otherwise use commands if available
                                try {
                                    return await vscode.commands.executeCommand(`${extConfig.adapterId}.receiveMessage`, action, payload);
                                }
                                catch (error) {
                                    this.log(`Error sending message to ${extConfig.name}: ${error.message}`);
                                    return null;
                                }
                            }
                        };
                        this.adapters.set(extConfig.adapterId, adapter);
                        detectedCount++;
                        this.log(`Detected AI extension: ${extConfig.name}`);
                    }
                    else {
                        // Update active status for existing adapter
                        const adapter = this.adapters.get(extConfig.adapterId);
                        if (adapter) {
                            adapter.isActive = extension.isActive;
                        }
                    }
                }
            }
            if (detectedCount > 0) {
                this.log(`Detected ${detectedCount} AI extensions`);
            }
        }
        catch (error) {
            this.log(`Error detecting extensions: ${error.message}`);
        }
    }
    /**
     * Log a message to the output channel
     */
    log(message) {
        this.outputChannel.appendLine(`[Agent Adapter] ${message}`);
    }
    /**
     * Dispose of resources
     */
    dispose() {
        // Nothing to dispose for now
    }
}
exports.AgentAdapterManager = AgentAdapterManager;
/**
 * Factory function to create an agent adapter manager
 */
function createAgentAdapterManager(context, agentClient, outputChannel) {
    return new AgentAdapterManager(context, agentClient, outputChannel);
}
//# sourceMappingURL=agent-adapter.js.map