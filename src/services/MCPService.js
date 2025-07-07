"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPService = void 0;
const events_1 = require("events");
/**
 * Model Context Protocol (MCP) Service
 *
 * Provides a standardized way for agents to discover and invoke tools.
 * This service is focused on agent-tool interactions, separate from
 * direct agent-to-agent communication.
 */
class MCPService extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.agentId = options.agentId;
        this.agentName = options.agentName;
        this.debug = options.debug || false;
        this.availableTools = new Map();
        this.toolHandlers = new Map();
    }
    /**
     * Initialize the service
     */
    async initialize() {
        this.log('MCP service initialized');
        return Promise.resolve();
    }
    /**
     * Register a tool with the MCP service
     */
    registerTool(tool, handler) {
        this.availableTools.set(tool.name, tool);
        this.toolHandlers.set(tool.name, handler);
        this.log(`Registered tool: ${tool.name}`);
    }
    /**
     * Get all available tools
     */
    getTools() {
        return Array.from(this.availableTools.values());
    }
    /**
     * Invoke a tool by name
     */
    async invokeTool(request) {
        const { toolName, parameters, requestId } = request;
        this.log(`Tool invocation request: ${toolName}`, parameters);
        // Check if tool exists
        if (!this.availableTools.has(toolName)) {
            const errorResponse = {
                toolName,
                requestId,
                success: false,
                error: `Tool '${toolName}' not found`,
                timestamp: new Date().toISOString()
            };
            this.emit('tool:error', errorResponse);
            return errorResponse;
        }
        // Get tool definition and handler
        const tool = this.availableTools.get(toolName);
        const handler = this.toolHandlers.get(toolName);
        try {
            // Validate parameters
            this.validateParameters(tool, parameters);
            // Invoke the tool handler
            const result = await handler(parameters);
            // Create response
            const response = {
                toolName,
                requestId,
                success: true,
                result,
                timestamp: new Date().toISOString()
            };
            this.emit('tool:success', response);
            return response;
        }
        catch (error) {
            const errorResponse = {
                toolName,
                requestId,
                success: false,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            };
            this.emit('tool:error', errorResponse);
            return errorResponse;
        }
    }
    /**
     * Validate parameters against tool schema
     */
    validateParameters(tool, parameters) {
        // Check required parameters
        for (const [paramName, paramSchema] of Object.entries(tool.parameters)) {
            if (paramSchema.required && (parameters[paramName] === undefined || parameters[paramName] === null)) {
                throw new Error(`Required parameter '${paramName}' is missing`);
            }
            if (parameters[paramName] !== undefined) {
                // Validate enum values
                if (paramSchema.enum && !paramSchema.enum.includes(parameters[paramName])) {
                    throw new Error(`Parameter '${paramName}' must be one of: ${paramSchema.enum.join(', ')}`);
                }
                // Basic type checking
                if (paramSchema.type === 'number' && typeof parameters[paramName] !== 'number') {
                    throw new Error(`Parameter '${paramName}' must be a number`);
                }
                else if (paramSchema.type === 'string' && typeof parameters[paramName] !== 'string') {
                    throw new Error(`Parameter '${paramName}' must be a string`);
                }
                else if (paramSchema.type === 'boolean' && typeof parameters[paramName] !== 'boolean') {
                    throw new Error(`Parameter '${paramName}' must be a boolean`);
                }
                else if (paramSchema.type === 'array' && !Array.isArray(parameters[paramName])) {
                    throw new Error(`Parameter '${paramName}' must be an array`);
                }
                else if (paramSchema.type === 'object' && (typeof parameters[paramName] !== 'object' || Array.isArray(parameters[paramName]))) {
                    throw new Error(`Parameter '${paramName}' must be an object`);
                }
            }
        }
    }
    /**
     * Utility method for logging
     */
    log(message, data) {
        if (this.debug) {
            if (data) {
                console.log(`[MCP:${this.agentId}] ${message}`, data);
            }
            else {
                console.log(`[MCP:${this.agentId}] ${message}`);
            }
        }
    }
}
exports.MCPService = MCPService;
