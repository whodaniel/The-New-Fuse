
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
import { Transport, RelayMessage } from '../types/index.js';
import { Logger } from '../utils/Logger.js';

export interface MCPTransportConfig {
  relayId: string;
  version: string;
  logger: Logger;
}

export class MCPTransport extends EventEmitter implements Transport {
  public readonly name = 'mcp';
  private config: MCPTransportConfig;
  private logger: Logger;
  private mcpServer: Server | null = null;
  private messageHandlers: ((message: RelayMessage) => void)[] = [];

  constructor(config: MCPTransportConfig) {
    super();
    this.config = config;
    this.logger = config.logger;
  }

  async start(): Promise<boolean> {
    if (this.mcpServer) {
      this.logger.warn('MCP server is already running.');
      return true;
    }

    try {
      this.mcpServer = new Server(
        {
          name: this.config.relayId,
          version: this.config.version,
        },
        {
          capabilities: {
            tools: {},
            resources: {},
          },
        }
      );

      this.setupRequestHandlers();

      if (process.argv.includes('--mcp')) {
        const transport = new StdioServerTransport();
        await this.mcpServer.connect(transport);
        this.logger.info('MCP Server started on stdio transport');
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to start MCP server: ${error instanceof Error ? error.message : String(error)}`);
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

    this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      const message: RelayMessage = {
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
