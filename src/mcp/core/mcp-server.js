"use strict";
/**
 * Refactored MCP Server using modular architecture
 * Delegates tool and resource handling to specialized handlers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpServer = void 0;
const index_1 = require("@modelcontextprotocol/sdk/server/index");
const stdio_1 = require("@modelcontextprotocol/sdk/server/stdio");
const types_1 = require("@modelcontextprotocol/sdk/types");
const api_client_1 = require("./api-client");
const auth_handler_1 = require("../handlers/auth.handler");
class McpServer {
    server;
    apiClient;
    handlers = [];
    constructor() {
        this.server = new index_1.Server({
            name: 'the-new-fuse-complete-api-wrapper',
            version: '2.0.0',
        }, {
            capabilities: {
                tools: {},
                resources: {},
            },
        });
        this.apiClient = new api_client_1.ApiClient();
        this.setupHandlers();
        this.registerHandlers();
    }
    setupHandlers() {
        // Register core request handlers
        this.server.setRequestHandler(types_1.ListToolsRequestSchema, async () => {
            const allTools = this.handlers.flatMap(handler => handler.getTools());
            return { tools: allTools };
        });
        this.server.setRequestHandler(types_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            // Find the appropriate handler
            const handler = this.handlers.find(h => h.canHandle(name));
            if (!handler) {
                return {
                    content: [{
                            type: 'text',
                            text: `Unknown tool: ${name}`,
                        }],
                    isError: true,
                };
            }
            try {
                const result = await handler.handleTool(name, args);
                return {
                    content: result.content,
                    isError: result.isError,
                };
            }
            catch (error) {
                return {
                    content: [{
                            type: 'text',
                            text: `Error executing tool ${name}: ${error.message}`,
                        }],
                    isError: true,
                };
            }
        });
        // TODO: Implement resource handlers
        this.server.setRequestHandler(types_1.ListResourcesRequestSchema, async () => {
            return { resources: [] };
        });
        this.server.setRequestHandler(types_1.ReadResourceRequestSchema, async (request) => {
            return {
                contents: [{
                        type: 'text',
                        text: 'Resource not found',
                    }],
            };
        });
    }
    registerHandlers() {
        // Register all handlers
        this.handlers.push(new auth_handler_1.AuthHandler(this.apiClient));
        // TODO: Register additional handlers as they are created
        // this.handlers.push(new AgentHandler(this.apiClient));
        // this.handlers.push(new ChatHandler(this.apiClient));
        // etc.
    }
    async run() {
        const transport = new stdio_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error('🚀 The New Fuse MCP API Wrapper v2.0 running on stdio');
        console.error(`📊 ${this.handlers.length} handler(s) registered`);
        console.error('🔐 Use auth_login first to authenticate');
        const totalTools = this.handlers.reduce((sum, handler) => sum + handler.getTools().length, 0);
        console.error(`🛠️ ${totalTools} tools available`);
    }
    // Public API for external configuration
    addHandler(handler) {
        this.handlers.push(handler);
    }
    getApiClient() {
        return this.apiClient;
    }
}
exports.McpServer = McpServer;
//# sourceMappingURL=mcp-server.js.map