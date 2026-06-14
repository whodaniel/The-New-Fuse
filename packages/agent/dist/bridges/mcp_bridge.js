"use strict";
/**
 * MCP Bridge - Model Context Protocol Integration
 *
 * Provides bridge functionality for MCP (Model Context Protocol):
 * - Tool registration and execution
 * - Resource management
 * - Prompt handling
 * - Server lifecycle management
 *
 * CONNECTS TO:
 * - UniversalBridge: For transport abstraction
 * - ProtocolBridge: For A2A protocol integration
 * - TNFMCPModule: For NestJS integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPBridge = void 0;
const index_js_1 = require("./index.js");
const DEFAULT_CONFIG = {
    serverName: 'tnf-mcp-bridge',
    serverVersion: '1.0.0',
    protocolVersion: '2024-11-05',
    capabilities: {
        tools: true,
        resources: true,
        prompts: true,
        logging: true,
    },
};
// ============================================================
// MCP BRIDGE IMPLEMENTATION
// ============================================================
class MCPBridge extends index_js_1.BaseBridge {
    constructor(config = {}) {
        super('mcp-bridge');
        // Tool registry
        this.tools = new Map();
        this.toolHandlers = new Map();
        // Resource registry
        this.resources = new Map();
        this.resourceHandlers = new Map();
        // Prompt registry
        this.prompts = new Map();
        this.promptHandlers = new Map();
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.registerBuiltInTools();
    }
    // ============================================================
    // CONNECTION MANAGEMENT
    // ============================================================
    async connect() {
        this.emit('connecting');
        // Initialize MCP server capabilities
        this.emit('server:info', this.getServerInfo());
        this.isConnected = true;
        this.emit('connected');
    }
    async disconnect() {
        this.isConnected = false;
        this.emit('disconnected');
    }
    async sendMessage(message, messageType = index_js_1.MessageType.REQUEST, priority = index_js_1.Priority.MEDIUM) {
        // Route based on message type
        if (message.method === 'tools/call') {
            const result = await this.callTool(message.params);
            this.emit('tool:result', result);
        }
        else if (message.method === 'resources/read') {
            const content = await this.readResource(message.params);
            this.emit('resource:content', content);
        }
        else if (message.method === 'prompts/get') {
            const messages = await this.getPrompt(message.params);
            this.emit('prompt:messages', messages);
        }
    }
    // ============================================================
    // SERVER INFO
    // ============================================================
    getServerInfo() {
        return {
            name: this.config.serverName,
            version: this.config.serverVersion,
            protocolVersion: this.config.protocolVersion,
            capabilities: this.config.capabilities,
        };
    }
    // ============================================================
    // TOOL MANAGEMENT
    // ============================================================
    /**
     * Register a tool
     */
    registerTool(tool, handler) {
        this.tools.set(tool.name, tool);
        this.toolHandlers.set(tool.name, handler);
        this.emit('tool:registered', tool);
    }
    /**
     * Unregister a tool
     */
    unregisterTool(name) {
        this.tools.delete(name);
        this.toolHandlers.delete(name);
        this.emit('tool:unregistered', { name });
    }
    /**
     * List all tools
     */
    listTools() {
        return Array.from(this.tools.values());
    }
    /**
     * Call a tool
     */
    async callTool(call) {
        const handler = this.toolHandlers.get(call.name);
        if (!handler) {
            return {
                content: [{ type: 'text', text: `Tool not found: ${call.name}` }],
                isError: true,
            };
        }
        try {
            this.emit('tool:calling', call);
            const result = await handler(call.arguments);
            this.emit('tool:called', { call, result });
            return result;
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    }
    // ============================================================
    // RESOURCE MANAGEMENT
    // ============================================================
    /**
     * Register a resource
     */
    registerResource(resource, handler) {
        this.resources.set(resource.uri, resource);
        this.resourceHandlers.set(resource.uri, handler);
        this.emit('resource:registered', resource);
    }
    /**
     * Unregister a resource
     */
    unregisterResource(uri) {
        this.resources.delete(uri);
        this.resourceHandlers.delete(uri);
        this.emit('resource:unregistered', { uri });
    }
    /**
     * List all resources
     */
    listResources() {
        return Array.from(this.resources.values());
    }
    /**
     * Read a resource
     */
    async readResource(params) {
        const handler = this.resourceHandlers.get(params.uri);
        if (!handler) {
            throw new Error(`Resource not found: ${params.uri}`);
        }
        this.emit('resource:reading', params);
        const content = await handler();
        this.emit('resource:read', { uri: params.uri, content });
        return content;
    }
    // ============================================================
    // PROMPT MANAGEMENT
    // ============================================================
    /**
     * Register a prompt
     */
    registerPrompt(prompt, handler) {
        this.prompts.set(prompt.name, prompt);
        this.promptHandlers.set(prompt.name, handler);
        this.emit('prompt:registered', prompt);
    }
    /**
     * Unregister a prompt
     */
    unregisterPrompt(name) {
        this.prompts.delete(name);
        this.promptHandlers.delete(name);
        this.emit('prompt:unregistered', { name });
    }
    /**
     * List all prompts
     */
    listPrompts() {
        return Array.from(this.prompts.values());
    }
    /**
     * Get a prompt
     */
    async getPrompt(params) {
        const handler = this.promptHandlers.get(params.name);
        if (!handler) {
            throw new Error(`Prompt not found: ${params.name}`);
        }
        this.emit('prompt:getting', params);
        const messages = await handler(params.arguments || {});
        this.emit('prompt:got', { name: params.name, messages });
        return messages;
    }
    // ============================================================
    // BUILT-IN TOOLS
    // ============================================================
    registerBuiltInTools() {
        // System info tool
        this.registerTool({
            name: 'tnf_system_info',
            description: 'Get information about the TNF autonomous system',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        }, async () => ({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        server: this.getServerInfo(),
                        tools: this.tools.size,
                        resources: this.resources.size,
                        prompts: this.prompts.size,
                        connected: this.isConnected,
                    }, null, 2),
                },
            ],
        }));
        // List tools tool
        this.registerTool({
            name: 'tnf_list_tools',
            description: 'List all available tools',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        }, async () => ({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(this.listTools(), null, 2),
                },
            ],
        }));
        // Agent status tool
        this.registerTool({
            name: 'tnf_agent_status',
            description: 'Get the status of registered agents',
            inputSchema: {
                type: 'object',
                properties: {
                    agentId: {
                        type: 'string',
                        description: 'Optional specific agent ID',
                    },
                },
            },
        }, async (args) => ({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        agentId: args.agentId || 'all',
                        status: 'operational',
                        timestamp: new Date().toISOString(),
                    }, null, 2),
                },
            ],
        }));
        // Execute BMAD cycle tool
        this.registerTool({
            name: 'tnf_bmad_cycle',
            description: 'Execute a BMAD (Skills→Tools→Context→Prompts) cycle',
            inputSchema: {
                type: 'object',
                properties: {
                    purpose: {
                        type: 'string',
                        description: 'The purpose of this BMAD cycle',
                    },
                    skillIds: {
                        type: 'string',
                        description: 'Comma-separated list of skill IDs to use',
                    },
                },
                required: ['purpose'],
            },
        }, async (args) => {
            const purpose = args.purpose;
            const skillIds = args.skillIds ? args.skillIds.split(',') : [];
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            purpose,
                            skillIds,
                            status: 'cycle_initiated',
                            message: 'BMAD cycle queued for execution',
                        }, null, 2),
                    },
                ],
            };
        });
    }
    // ============================================================
    // STATISTICS
    // ============================================================
    getStatistics() {
        return {
            connected: this.isConnected,
            tools: this.tools.size,
            resources: this.resources.size,
            prompts: this.prompts.size,
            serverInfo: this.getServerInfo(),
        };
    }
}
exports.MCPBridge = MCPBridge;
exports.default = MCPBridge;
//# sourceMappingURL=mcp_bridge.js.map