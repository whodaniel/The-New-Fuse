/**
 * MCP Transport for The New Fuse Relay System
 *
 * Based on comprehensive-tnf-relay.js:86 (setupMCPServer method)
 * Handles communication with Model Context Protocol (MCP) clients.
 */
import { EventEmitter } from 'events';
// @ts-ignore
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
// @ts-ignore
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// @ts-ignore
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
export class MCPTransport extends EventEmitter {
    constructor(config) {
        super();
        this.name = 'mcp';
        this.mcpServer = null;
        this.messageHandlers = [];
        this.config = config;
        this.logger = config.logger;
    }
    async start() {
        if (this.mcpServer) {
            this.logger.warn('MCP server is already running.');
            return true;
        }
        try {
            this.mcpServer = new Server({
                name: this.config.relayId,
                version: this.config.version,
            }, {
                capabilities: {
                    tools: {},
                    resources: {},
                },
            });
            this.setupRequestHandlers();
            if (process.argv.includes('--mcp')) {
                const transport = new StdioServerTransport();
                await this.mcpServer.connect(transport);
                this.logger.info('MCP Server started on stdio transport');
            }
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to start MCP server: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    async stop() {
        // MCP server doesn't have a formal stop method in this context
        this.mcpServer = null;
        this.logger.info('MCP transport stopped.');
    }
    async send(message) {
        // MCP is primarily for receiving commands, not sending them directly.
        this.logger.warn('MCP transport does not support sending messages directly.');
        return false;
    }
    onMessage(handler) {
        this.messageHandlers.push(handler);
    }
    isConnected() {
        return this.mcpServer !== null;
    }
    setupRequestHandlers() {
        if (!this.mcpServer)
            return;
        this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
            // This can be expanded to dynamically list tools from the relay
            return { tools: [] };
        });
        this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            const message = {
                id: `mcp_${Date.now()}`,
                type: 'TOOL_CALL',
                source: 'mcp-client',
                payload: { name, args },
                timestamp: new Date().toISOString(),
            };
            this.messageHandlers.forEach(handler => handler(message));
            return { content: [{ type: 'text', text: 'Tool call received' }] };
        });
    }
}
//# sourceMappingURL=MCPTransport.js.map