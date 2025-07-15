import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';
import { MCPMessage, MCPCapability, ProtocolVersion } from './types';
import { McpToolRegistry } from './McpToolRegistry';
import { MCPRegistry } from './MCPRegistry';
import http from 'http';
import { EventEmitter } from 'events';

export interface MCPServerConfig {
  port?: number;
  transport: 'stdio' | 'http' | 'websocket';
  capabilities?: MCPCapability[];
  protocolVersion?: ProtocolVersion;
}

@Injectable()
export class MCPServer extends EventEmitter {
  private config: MCPServerConfig;
  private logger = new Logger('MCPServer');
  private httpServer?: http.Server;
  private running = false;
  private protocolVersion: ProtocolVersion = '2024-11-05';

  constructor(
    config: MCPServerConfig,
    private toolRegistry: McpToolRegistry,
    private mcpRegistry: MCPRegistry
  ) {
    super();
    this.config = {
      port: 3000,
      protocolVersion: '2024-11-05',
      ...config
    };
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    if (this.running) {
      this.logger.warn('Server is already running');
      return;
    }

    if (this.config.transport === 'stdio') {
      await this.startStdioTransport();
    } else if (this.config.transport === 'http') {
      await this.startHttpTransport();
    } else {
      throw new Error(`Unsupported transport: ${this.config.transport}`);
    }

    this.running = true;
    this.emit('started');
    this.logger.info(`MCP Server started on ${this.config.transport} transport`);
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    try {
      if (this.httpServer) {
        await new Promise<void>((resolve) => {
          this.httpServer?.close(() => {
            this.logger.info('HTTP Server stopped');
            resolve();
          });
        });
        this.httpServer = undefined;
      }

      this.running = false;
      this.emit('stopped');
      this.logger.info('MCP Server stopped');
    } catch (error) {
      this.logger.error('Error stopping server:', error);
      throw error;
    }
  }

  private async startStdioTransport(): Promise<void> {
    process.stdin.on('data', (data: Buffer) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          try {
            const message = JSON.parse(line);
            this.handleMessage(message).then(response => {
              if (response) {
                process.stdout.write(JSON.stringify(response) + '\n');
              }
            }).catch(error => {
              const errorResponse = {
                jsonrpc: '2.0',
                id: message.id,
                error: {
                  code: -32603,
                  message: 'Internal error'
                }
              };
              process.stdout.write(JSON.stringify(errorResponse) + '\n');
            });
          } catch (error) {
            this.logger.error('Failed to parse message:', error);
            const errorResponse = {
              jsonrpc: '2.0',
              id: null,
              error: {
                code: -32700,
                message: 'Parse error'
              }
            };
            process.stdout.write(JSON.stringify(errorResponse) + '\n');
          }
        }
      });
    });

    process.stdin.resume();
  }

  private async startHttpTransport(): Promise<void> {
    this.httpServer = http.createServer(async (req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Handle SSE endpoint
      if (req.url === '/events') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
        
        // Send initial connection event
        res.write('data: {"type":"connected"}\n\n');
        return;
      }

      // Handle JSON-RPC endpoint
      if (req.url === '/rpc' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const message = JSON.parse(body);
            const response = await this.handleMessage(message);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } catch (error) {
            this.logger.error('Error processing request:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              id: null,
              error: {
                code: -32700,
                message: 'Parse error'
              }
            }));
          }
        });
        return;
      }

      // Handle capabilities endpoint
      if (req.url === '/capabilities' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          capabilities: this.config.capabilities || [],
          protocolVersion: this.protocolVersion,
          tools: this.toolRegistry.getToolDefinitions()
        }));
        return;
      }

      // 404 for other endpoints
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    return new Promise((resolve, reject) => {
      this.httpServer?.listen(this.config.port, () => {
        this.logger.info(`HTTP server listening on port ${this.config.port}`);
        resolve();
      });

      this.httpServer?.on('error', (error) => {
        this.logger.error('HTTP server error:', error);
        reject(error);
      });
    });
  }

  private async handleMessage(message: MCPMessage): Promise<MCPMessage | null> {
    try {
      // Standard discovery method
      if (message.method === 'initialize') {
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            protocolVersion: this.protocolVersion,
            capabilities: this.config.capabilities || [],
            serverInfo: {
              name: 'TNF MCP Server',
              version: '1.0.0'
            }
          }
        };
      }

      if (message.method === 'listCapabilities') {
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            capabilities: this.config.capabilities || []
          }
        };
      }

      // Handle tool requests
      if (message.method && message.method.startsWith('tools/')) {
        const toolName = message.method.replace('tools/', '');
        try {
          const result = await this.toolRegistry.executeTool(toolName, message.params);
          return {
            jsonrpc: '2.0',
            id: message.id,
            result
          };
        } catch (error: any) {
          return {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32603,
              message: error.message || 'Tool execution error'
            }
          };
        }
      }

      // Handle resource requests
      if (message.method && message.method.startsWith('resources/')) {
        try {
          const result = {
            contents: [{
              uri: `resource://${message.method}`,
              mimeType: 'text/plain',
              text: 'Resource content would be returned here'
            }]
          };
          return {
            jsonrpc: '2.0',
            id: message.id,
            result
          };
        } catch (error: any) {
          return {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32603,
              message: error.message || 'Resource fetch error'
            }
          };
        }
      }

      // Handle prompt requests
      if (message.method && message.method.startsWith('prompts/')) {
        try {
          let result = 'Default prompt template';
          if (message.params && typeof message.params === 'object') {
            // Process template with params
            result = 'Processed prompt template';
          }
          
          return {
            jsonrpc: '2.0',
            id: message.id,
            result: { text: result }
          };
        } catch (error: any) {
          return {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32603,
              message: error.message || 'Prompt generation error'
            }
          };
        }
      }

      // Method not found
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32601,
          message: `Method not found: ${message.method}`
        }
      };

    } catch (error: any) {
      this.logger.error('Error handling request:', error);
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32603,
          message: error.message || 'Internal error'
        }
      };
    }
  }

  public getCapabilities(): MCPCapability[] {
    return this.config.capabilities || [];
  }

  public addCapability(capability: MCPCapability): void {
    if (!this.config.capabilities) {
      this.config.capabilities = [];
    }
    this.config.capabilities.push(capability);
    this.logger.info(`Added capability: ${capability}`);
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getPort(): number | undefined {
    return this.config.port;
  }

  public getTransport(): string {
    return this.config.transport;
  }
}