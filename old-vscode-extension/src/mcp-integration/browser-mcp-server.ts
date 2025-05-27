import { MCPServer } from '../types/mcp';
import { Logger } from '../core/logging';
import { BrowserMCPClient } from '@browsermcp/mcp';

export class BrowserMCPServerManager {
  private browserMCPClient: BrowserMCPClient | undefined;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public async createServer(): Promise<MCPServer> {
    this.logger.info('Creating BrowserMCP server configuration');

    const serverId = 'browser-mcp';
    const server: MCPServer = {
      id: serverId,
      name: 'Browser MCP',
      url: 'ws://localhost:3772', // Main MCP server port
      status: 'offline',
      isBuiltIn: true,
      config: {
        version: "1.0",
        tools: [] // Will be populated when connected
      }
    };

    try {
      // Initialize browser MCP client
      this.browserMCPClient = new BrowserMCPClient({
        serverUrl: server.url,
        serverName: server.name,
        autoReconnect: true,
        onConnected: () => {
          this.logger.info('BrowserMCP client connected');
          server.status = 'online';
        },
        onDisconnected: () => {
          this.logger.info('BrowserMCP client disconnected');
          server.status = 'offline';
        },
        onError: (error) => {
          this.logger.error(`BrowserMCP client error: ${error}`);
          server.status = 'error';
        }
      });

      return server;
    } catch (error) {
      this.logger.error(`Failed to create BrowserMCP server: ${error}`);
      throw error;
    }
  }

  public async connect(): Promise<void> {
    if (!this.browserMCPClient) {
      throw new Error('BrowserMCP client not initialized');
    }

    try {
      await this.browserMCPClient.connect();
    } catch (error) {
      this.logger.error(`Failed to connect BrowserMCP client: ${error}`);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.browserMCPClient) {
      return;
    }

    try {
      await this.browserMCPClient.disconnect();
    } catch (error) {
      this.logger.error(`Failed to disconnect BrowserMCP client: ${error}`);
      throw error;
    }
  }

  public dispose(): void {
    this.disconnect().catch(error => {
      this.logger.error(`Error during BrowserMCP disposal: ${error}`);
    });
    this.browserMCPClient = undefined;
  }
}