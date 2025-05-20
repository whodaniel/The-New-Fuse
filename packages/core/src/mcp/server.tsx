import { createServer, Server } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { 
  McpServerConfig, 
  McpTool, 
  McpResource, 
  McpPrompt,
  JsonRpcRequest, 
  JsonRpcResponse 
} from './types.js';
import { Logger } from '../logging.js';

export class McpServer extends EventEmitter {
  private config: McpServerConfig;
  private tools: Map<string, McpTool> = new Map();
  private resources: Map<string, McpResource> = new Map();
  private prompts: Map<string, McpPrompt> = new Map();
  private httpServer?: Server;
  private clients: Set<any> = new Set();
  private logger: Logger;

  constructor(config: McpServerConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
  }

  /**
   * Register a tool with the MCP server
   */
  registerTool(tool: McpTool): void {
    this.tools.set(tool.name, tool);
    this.logger.info(`Registered tool: ${tool.name}`);
  }

  /**
   * Register a resource with the MCP server
   */
  registerResource(resource: McpResource): void {
    this.resources.set(resource.uri, resource);
    this.logger.info(`Registered resource: ${resource.name} at ${resource.uri}`);
  }

  /**
   * Register a prompt with the MCP server
   */
  registerPrompt(prompt: McpPrompt): void {
    this.prompts.set(prompt.name, prompt);
    this.logger.info(`Registered prompt: ${prompt.name}`);
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    if (this.config.transport === 'stdio') {
      this.startStdioServer();
    } else {
      await this.startSseServer();
    }
    this.logger.info(`MCP Server "${this.config.name}" v${this.config.version} started`);
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer?.close(() => {
          this.logger.info('MCP Server stopped');
          resolve();
        });
      });
    }
    this.logger.info('MCP Server stopped');
  }

  private startStdioServer(): void {
    process.stdin.on('data', async (data) => {
      try {
        const request = JSON.parse(data.toString()) as JsonRpcRequest;
        const response = await this.handleRequest(request);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (error) {
        this.logger.error('Error processing stdin request', error);
        // Send error response
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error'
          }
        }) + '\n');
      }
    });
  }

  private async startSseServer(): Promise<void> {
    this.httpServer = createServer(async (req, res) => {
      // Handle auth if required
      if (this.config.authRequired) {
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${this.config.authKey}`) {
          res.writeHead(401);
          res.end('Unauthorized');
          return;
        }
      }

      // Handle SSE endpoint
      if (req.url === '/events') {
        this.setupSseConnection(req, res);
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
            const request = JSON.parse(body) as JsonRpcRequest;
            const response = await this.handleRequest(request);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } catch (error) {
            this.logger.error('Error processing RPC request', error);
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

      // Default response for unknown endpoints
      res.writeHead(404);
      res.end('Not Found');
    });

    const port = this.config.port || 3000;
    return new Promise((resolve) => {
      this.httpServer?.listen(port, () => {
        this.logger.info(`MCP Server listening on port ${port}`);
        resolve();
      });
    });
  }

  private setupSseConnection(req: any, res: any): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const clientId = uuidv4();
    const client = { id: clientId, res };
    this.clients.add(client);

    req.on('close', () => {
      this.clients.delete(client);
      this.logger.info(`Client ${clientId} disconnected`);
    });

    this.logger.info(`Client ${clientId} connected`);
    
    // Send initial connected message
    res.write(`data: ${JSON.stringify({ connected: true, serverId: this.config.id })}\n\n`);
  }

  private async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    try {
      this.logger.debug(`Handling request: ${request.method}`, request);

      // Standard discovery method
      if (request.method === 'mcp.listCapabilities') {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: this.getCapabilities()
        };
      }

      // Handle tool calls
      if (request.method.startsWith('tool.')) {
        const toolName = request.method.substring(5);
        const tool = this.tools.get(toolName);
        
        if (!tool) {
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Tool not found: ${toolName}`
            }
          };
        }

        try {
          const result = await tool.handler(request.params || {});
          return {
            jsonrpc: '2.0',
            id: request.id,
            result
          };
        } catch (error: any) {
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32000,
              message: error.message || 'Tool execution error'
            }
          };
        }
      }

      // Handle resource requests
      if (request.method.startsWith('resource.')) {
        const resourceUri = request.method.substring(9);
        const resource = this.resources.get(resourceUri);
        
        if (!resource) {
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Resource not found: ${resourceUri}`
            }
          };
        }

        try {
          const result = await resource.handler();
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: result instanceof Buffer ? result.toString('base64') : result,
              mimeType: resource.mimeType
            }
          };
        } catch (error: any) {
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32000,
              message: error.message || 'Resource fetch error'
            }
          };
        }
      }

      // Handle prompt requests
      if (request.method.startsWith('prompt.')) {
        const promptName = request.method.substring(7);
        const prompt = this.prompts.get(promptName);
        
        if (!prompt) {
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Prompt not found: ${promptName}`
            }
          };
        }

        try {
          let result: string;
          
          if (prompt.handler) {
            result = await prompt.handler(request.params || {});
          } else {
            // Simple template substitution
            result = prompt.template;
            if (request.params && typeof request.params === 'object') {
              Object.entries(request.params).forEach(([key, value]) => {
                result = result.replace(`{${key}}`, String(value));
              });
            }
          }
          
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: { text: result }
          };
        } catch (error: any) {
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32000,
              message: error.message || 'Prompt generation error'
            }
          };
        }
      }

      // Method not found
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`
        }
      };
    } catch (error: any) {
      this.logger.error('Error handling request', error);
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: error.message || 'Internal error'
        }
      };
    }
  }

  private getCapabilities() {
    const tools = Array.from(this.tools.values()).map(tool => ({
      type: 'tool',
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));

    const resources = Array.from(this.resources.values()).map(resource => ({
      type: 'resource',
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType
    }));

    const prompts = Array.from(this.prompts.values()).map(prompt => ({
      type: 'prompt',
      name: prompt.name,
      description: prompt.description,
      parameters: prompt.parameters || {}
    }));

    return {
      server: {
        id: this.config.id,
        name: this.config.name,
        version: this.config.version,
        description: this.config.description || ''
      },
      capabilities: [...tools, ...resources, ...prompts]
    };
  }
}
