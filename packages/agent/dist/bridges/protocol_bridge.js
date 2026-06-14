"use strict";
/**
 * Protocol Bridge - Multi-Protocol Communication Layer
 *
 * Enables agents to communicate using multiple protocols:
 * - A2A (Agent-to-Agent) Protocol v0.3.0
 * - MCP (Model Context Protocol)
 * - Custom TNF protocols
 *
 * CONNECTS TO:
 * - UniversalBridge: For transport abstraction
 * - A2A types: From @the-new-fuse/a2a-core
 * - MCP Server: For tool registration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolBridge = void 0;
const index_js_1 = require("./index.js");
const DEFAULT_CONFIG = {
    supportedProtocols: ['a2a', 'mcp', 'tnf'],
    defaultProtocol: 'a2a',
    enableDiscovery: true,
    discoveryInterval: 60000,
};
// ============================================================
// PROTOCOL BRIDGE IMPLEMENTATION
// ============================================================
class ProtocolBridge extends index_js_1.BaseBridge {
    constructor(config) {
        super(`protocol-bridge-${config.agentId}`);
        // Agent registry
        this.knownAgents = new Map();
        // MCP components
        this.mcpTools = new Map();
        this.mcpResources = new Map();
        this.mcpPrompts = new Map();
        // Message handling
        this.messageHandlers = new Map();
        this.pendingRequests = new Map();
        // Discovery
        this.discoveryInterval = null;
        this.config = { ...DEFAULT_CONFIG, ...config };
        // Initialize agent card
        this.myAgentCard = {
            id: config.agentId,
            name: config.agentName || config.agentId,
            description: 'TNF Protocol Bridge Agent',
            version: '1.0.0',
            capabilities: [],
            protocols: config.supportedProtocols || ['a2a', 'mcp', 'tnf'],
            endpoints: {
                primary: config.a2aEndpoint || `tnf://agent/${config.agentId}`,
            },
        };
        // Register default message handlers
        this.registerDefaultHandlers();
    }
    // ============================================================
    // CONNECTION MANAGEMENT
    // ============================================================
    async connect() {
        this.emit('connecting');
        try {
            // Register with MCP server if configured
            if (this.config.mcpServerUrl) {
                await this.registerWithMCPServer();
            }
            // Start agent discovery if enabled
            if (this.config.enableDiscovery) {
                this.startDiscovery();
            }
            this.isConnected = true;
            this.emit('connected');
            this.emit('agent:registered', this.myAgentCard);
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    async disconnect() {
        if (this.discoveryInterval) {
            clearInterval(this.discoveryInterval);
            this.discoveryInterval = null;
        }
        // Cancel pending requests
        for (const [id, pending] of this.pendingRequests) {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Bridge disconnected'));
        }
        this.pendingRequests.clear();
        this.isConnected = false;
        this.emit('disconnected');
    }
    // ============================================================
    // MESSAGE SENDING
    // ============================================================
    async sendMessage(message, messageType = index_js_1.MessageType.REQUEST, priority = index_js_1.Priority.MEDIUM) {
        const a2aMessage = this.createA2AMessage(message.to || 'broadcast', message.action || 'execute', message.data || message, messageType === index_js_1.MessageType.REQUEST ? 'request' : 'notification');
        await this.send(a2aMessage);
    }
    /**
     * Send an A2A message
     */
    async send(message) {
        this.emit('message:sending', message);
        // Route based on protocol
        switch (message.protocol) {
            case 'a2a':
                await this.sendA2AMessage(message);
                break;
            case 'mcp':
                await this.sendMCPMessage(message);
                break;
            case 'tnf':
                await this.sendTNFMessage(message);
                break;
            default:
                throw new Error(`Unsupported protocol: ${message.protocol}`);
        }
        this.emit('message:sent', message);
    }
    /**
     * Send and wait for response
     */
    async sendAndWait(to, action, data, timeout = 30000) {
        const message = this.createA2AMessage(to, action, data, 'request');
        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                this.pendingRequests.delete(message.id);
                reject(new Error(`Request timeout after ${timeout}ms`));
            }, timeout);
            this.pendingRequests.set(message.id, {
                resolve,
                reject,
                timeout: timeoutHandle,
            });
            this.send(message).catch(reject);
        });
    }
    // ============================================================
    // MESSAGE RECEIVING
    // ============================================================
    /**
     * Handle incoming message
     */
    async handleMessage(message) {
        this.emit('message:received', message);
        // Check if this is a response to a pending request
        if (message.type === 'response' && message.correlation?.requestId) {
            const pending = this.pendingRequests.get(message.correlation.requestId);
            if (pending) {
                clearTimeout(pending.timeout);
                pending.resolve(message);
                this.pendingRequests.delete(message.correlation.requestId);
                return;
            }
        }
        // Find and execute handler
        const handler = this.messageHandlers.get(message.payload.action);
        if (handler) {
            await handler(message);
        }
        else {
            // Default handler
            this.emit('message:unhandled', message);
        }
    }
    /**
     * Register a message handler
     */
    onAction(action, handler) {
        this.messageHandlers.set(action, handler);
    }
    // ============================================================
    // A2A PROTOCOL
    // ============================================================
    /**
     * Create an A2A message
     */
    createA2AMessage(to, action, data, type = 'request', correlationId) {
        return {
            id: `a2a-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
            type,
            protocol: this.config.defaultProtocol,
            version: '0.3.0',
            from: this.config.agentId,
            to,
            timestamp: new Date(),
            payload: {
                action,
                data,
            },
            correlation: correlationId ? { requestId: correlationId } : undefined,
        };
    }
    /**
     * Create a response to a message
     */
    createResponse(originalMessage, data, isError = false) {
        return {
            id: `a2a-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
            type: isError ? 'error' : 'response',
            protocol: originalMessage.protocol,
            version: '0.3.0',
            from: this.config.agentId,
            to: originalMessage.from,
            timestamp: new Date(),
            payload: {
                action: `${originalMessage.payload.action}:result`,
                data,
            },
            correlation: {
                requestId: originalMessage.id,
                conversationId: originalMessage.correlation?.conversationId,
            },
        };
    }
    async sendA2AMessage(message) {
        // Find target agent
        const targetAgent = this.knownAgents.get(message.to);
        if (message.to === 'broadcast') {
            // Broadcast to all known agents
            for (const agent of this.knownAgents.values()) {
                this.emit('a2a:broadcast', { agent, message });
            }
        }
        else if (targetAgent) {
            this.emit('a2a:send', { agent: targetAgent, message });
        }
        else {
            // Agent not found, emit for discovery
            this.emit('a2a:agent-not-found', { agentId: message.to, message });
        }
    }
    // ============================================================
    // MCP PROTOCOL
    // ============================================================
    /**
     * Register a tool with MCP
     */
    registerMCPTool(tool) {
        this.mcpTools.set(tool.name, tool);
        this.emit('mcp:tool:registered', tool);
    }
    /**
     * Register a resource with MCP
     */
    registerMCPResource(resource) {
        this.mcpResources.set(resource.uri, resource);
        this.emit('mcp:resource:registered', resource);
    }
    /**
     * Register a prompt with MCP
     */
    registerMCPPrompt(prompt) {
        this.mcpPrompts.set(prompt.name, prompt);
        this.emit('mcp:prompt:registered', prompt);
    }
    /**
     * Get all MCP tools
     */
    getMCPTools() {
        return Array.from(this.mcpTools.values());
    }
    /**
     * Get all MCP resources
     */
    getMCPResources() {
        return Array.from(this.mcpResources.values());
    }
    async sendMCPMessage(message) {
        // MCP messages would go through the MCP server
        this.emit('mcp:send', message);
    }
    async registerWithMCPServer() {
        // Would register tools/resources/prompts with MCP server
        this.emit('mcp:registering', {
            tools: this.mcpTools.size,
            resources: this.mcpResources.size,
            prompts: this.mcpPrompts.size,
        });
    }
    // ============================================================
    // TNF PROTOCOL
    // ============================================================
    async sendTNFMessage(message) {
        // TNF internal protocol - direct emit for local handling
        this.emit('tnf:send', message);
    }
    // ============================================================
    // AGENT DISCOVERY
    // ============================================================
    /**
     * Register a known agent
     */
    registerAgent(agentCard) {
        this.knownAgents.set(agentCard.id, agentCard);
        this.emit('agent:discovered', agentCard);
    }
    /**
     * Update agent capabilities
     */
    updateCapabilities(capabilities) {
        this.myAgentCard.capabilities = capabilities;
        this.emit('capabilities:updated', capabilities);
    }
    /**
     * Get my agent card
     */
    getAgentCard() {
        return this.myAgentCard;
    }
    /**
     * Get known agents
     */
    getKnownAgents() {
        return Array.from(this.knownAgents.values());
    }
    /**
     * Find agents by capability
     */
    findAgentsByCapability(capability) {
        return Array.from(this.knownAgents.values()).filter((agent) => agent.capabilities.includes(capability));
    }
    startDiscovery() {
        this.discoveryInterval = setInterval(() => {
            this.discoverAgents();
        }, this.config.discoveryInterval);
        // Initial discovery
        this.discoverAgents();
    }
    async discoverAgents() {
        this.emit('discovery:started');
        // Broadcast discovery request
        const discoveryMessage = this.createA2AMessage('broadcast', 'agent:discover', { capabilities: this.myAgentCard.capabilities }, 'request');
        await this.send(discoveryMessage);
        this.emit('discovery:completed');
    }
    // ============================================================
    // TASK EXECUTION
    // ============================================================
    /**
     * Request task execution from another agent
     */
    async requestTaskExecution(agentId, task) {
        const response = await this.sendAndWait(agentId, 'task:execute', task, task.timeout || 60000);
        return response.payload.data;
    }
    /**
     * Broadcast task to find capable agent
     */
    async broadcastTask(task) {
        // Find agents with required capabilities
        const capableAgents = task.requiredCapabilities.length > 0
            ? this.findAgentsByCapability(task.requiredCapabilities[0])
            : Array.from(this.knownAgents.values());
        if (capableAgents.length === 0) {
            return null;
        }
        // Try first capable agent
        const agent = capableAgents[0];
        const result = await this.requestTaskExecution(agent.id, task);
        return { agentId: agent.id, result };
    }
    // ============================================================
    // DEFAULT HANDLERS
    // ============================================================
    registerDefaultHandlers() {
        // Handle discovery requests
        this.onAction('agent:discover', async (message) => {
            const response = this.createResponse(message, this.myAgentCard);
            await this.send(response);
        });
        // Handle ping
        this.onAction('ping', async (message) => {
            const response = this.createResponse(message, {
                pong: true,
                timestamp: new Date(),
                agentId: this.config.agentId,
            });
            await this.send(response);
        });
        // Handle capability query
        this.onAction('capabilities:query', async (message) => {
            const response = this.createResponse(message, {
                capabilities: this.myAgentCard.capabilities,
                protocols: this.myAgentCard.protocols,
            });
            await this.send(response);
        });
    }
    // ============================================================
    // STATISTICS
    // ============================================================
    getStatistics() {
        return {
            connected: this.isConnected,
            protocol: this.config.defaultProtocol,
            knownAgents: this.knownAgents.size,
            mcpTools: this.mcpTools.size,
            mcpResources: this.mcpResources.size,
            pendingRequests: this.pendingRequests.size,
            capabilities: this.myAgentCard.capabilities,
        };
    }
}
exports.ProtocolBridge = ProtocolBridge;
exports.default = ProtocolBridge;
//# sourceMappingURL=protocol_bridge.js.map