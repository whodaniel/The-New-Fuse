"use strict";
/**
 * MCP Transport for The New Fuse Relay System
 *
 * Based on comprehensive-tnf-relay.js:86 (setupMCPServer method)
 * Handles communication with Model Context Protocol (MCP) clients.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPTransport = void 0;
const events_1 = require("events");
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
class MCPTransport extends events_1.EventEmitter {
    name = 'mcp';
    config;
    logger;
    mcpServer = null;
    messageHandlers = [];
    constructor(config) {
        super();
        this.config = config;
        this.logger = config.logger;
    }
    async start() {
        if (this.mcpServer) {
            this.logger.warn('MCP server is already running.');
            return true;
        }
        try {
            this.mcpServer = new index_js_1.Server({
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
                const transport = new stdio_js_1.StdioServerTransport();
                await this.mcpServer.connect(transport);
                this.logger.info('MCP Server started on stdio transport');
            }
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to start MCP server: ${error instanceof Error ? error.message : String(error)});
      return false;
    }
  }

  async stop(): Promise<void> {
    // MCP server doesn't have a formal stop method in this context
    this.mcpServer = null;
    this.logger.info('MCP transport stopped.');
  }

  async send(message: RelayMessage): Promise<boolean> {
    // MCP is primarily for receiving commands, not sending them directly.
    this.logger.warn('MCP transport does not support sending messages directly.');
    return false;
  }

  onMessage(handler: (message: RelayMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  isConnected(): boolean {
    return this.mcpServer !== null;
  }

  private setupRequestHandlers(): void {
    if (!this.mcpServer) return;

    this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
      // This can be expanded to dynamically list tools from the relay
      return { tools: [] };
    });

    this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const message: RelayMessage = {`, id, `mcp_${Date.now()}` `,
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
            );
        }
    }
}
exports.MCPTransport = MCPTransport;
//# sourceMappingURL=MCPTransport.js.map