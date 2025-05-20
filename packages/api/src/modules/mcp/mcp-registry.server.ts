import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebSocketServer, WebSocket } from 'ws';
import Ajv, { ValidateFunction } from 'ajv'; // Import Ajv
import { MCPRegistryService } from './mcp-registry.service.js';
import { MCPMessage, MCPTool, parseMCPMessage, createMCPResponse, createMCPError } from '@the-new-fuse/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MCPRegistryServer implements OnModuleInit {
  private readonly logger = new Logger(MCPRegistryServer.name);
  private wss: WebSocketServer;
  private tools: Map<string, MCPTool>;
  private port: number;
  private ajv: Ajv; // Ajv instance
  private validatorCache: Map<string, ValidateFunction>; // Cache for compiled validators

  constructor(
    private readonly configService: ConfigService,
    private readonly registryService: MCPRegistryService,
  ) {
    this.port = this.configService.get<number>('MCP_REGISTRY_PORT', 3002); // Example port, configure as needed
    this.tools = new Map(this.registryService.getTools().map(tool => [tool.name, tool]));
    this.ajv = new Ajv({ allErrors: true }); // Initialize Ajv, 'allErrors' provides more detail
    this.validatorCache = new Map(); // Initialize cache
    this.compileValidators(); // Pre-compile validators
  }

  private compileValidators() {
    this.tools.forEach(tool => {
      if (tool.parameters && Object.keys(tool.parameters).length > 0) { // Check if parameters schema exists and is not empty
        try {
          const validate = this.ajv.compile(tool.parameters);
          this.validatorCache.set(tool.name, validate);
          this.logger.debug(`Compiled validator for tool: ${tool.name}`);
        } catch (error) {
          this.logger.error(`Failed to compile schema for tool ${tool.name}: ${error.message}`, error.stack);
          // Decide how to handle compilation errors - skip tool? throw? For now, just log.
        }
      } else {
          this.logger.debug(`No parameter schema to compile for tool: ${tool.name}`);
      }
    });
  }

  onModuleInit() {
    this.startServer();
  }

  private startServer() {
    this.wss = new WebSocketServer({ port: this.port });
    this.logger.log(`MCP Registry Server started on port ${this.port}`);

    this.wss.on('connection', (ws: WebSocket) => {
      const connectionId = uuidv4();
      this.logger.log(`Client connected: ${connectionId}`);

      ws.on('message', async (message: Buffer) => {
        let mcpMessage: MCPMessage | null = null;
        try {
          const messageString = message.toString();
          this.logger.debug(`Received message from ${connectionId}: ${messageString}`);
          mcpMessage = parseMCPMessage(messageString);

          if (!mcpMessage) {
            throw new Error('Invalid MCP message format');
          }

          if (mcpMessage.type === 'request') {
            const tool = this.tools.get(mcpMessage.tool_name);
            if (!tool || !tool.execute) {
              throw new Error(`Tool '${mcpMessage.tool_name}' not found or not executable`);
            }

            // --- Parameter Validation ---
            const validator = this.validatorCache.get(mcpMessage.tool_name);
            if (validator) {
              const valid = validator(mcpMessage.parameters);
              if (!valid) {
                const errorText = this.ajv.errorsText(validator.errors);
                this.logger.warn(`Invalid parameters for tool '${mcpMessage.tool_name}' from ${connectionId}: ${errorText}`);
                throw new Error(`Invalid parameters: ${errorText}`);
              }
              this.logger.debug(`Parameters validated successfully for tool '${mcpMessage.tool_name}' from ${connectionId}`);
            } else if (tool.parameters && Object.keys(tool.parameters).length > 0) {
                // If schema exists but wasn't compiled (e.g., due to error), reject the call
                this.logger.error(`Schema found but no validator compiled for tool '${mcpMessage.tool_name}'. Rejecting call.`);
                throw new Error(`Internal server error: Could not validate parameters for tool '${mcpMessage.tool_name}'.`);
            }
            // --- End Parameter Validation ---


            this.logger.log(`Executing tool '${mcpMessage.tool_name}' for ${connectionId} (ID: ${mcpMessage.id})`);
            const result = await tool.execute(mcpMessage.parameters);
            const response = createMCPResponse(mcpMessage.id, mcpMessage.tool_name, result);
            ws.send(JSON.stringify(response));
            this.logger.log(`Sent response for tool '${mcpMessage.tool_name}' to ${connectionId} (ID: ${mcpMessage.id})`);

          } else {
            // Handle other message types if needed (e.g., 'response', 'error')
            this.logger.warn(`Received unhandled message type '${mcpMessage.type}' from ${connectionId}`);
          }

        } catch (error: any) {
          this.logger.error(`Error processing message from ${connectionId}: ${error.message}`, error.stack);
          if (mcpMessage && mcpMessage.id) {
            const errorResponse = createMCPError(mcpMessage.id, mcpMessage.tool_name || 'unknown', error.message);
            ws.send(JSON.stringify(errorResponse));
          } else {
            // Send generic error if message ID is unknown
             ws.send(JSON.stringify({ type: 'error', id: 'unknown', error: `Failed to process message: ${error.message}` }));
          }
        }
      });

      ws.on('close', () => {
        this.logger.log(`Client disconnected: ${connectionId}`);
      });

      ws.on('error', (error: Error) => {
        this.logger.error(`WebSocket error for ${connectionId}: ${error.message}`, error.stack);
      });
    });

    this.wss.on('error', (error: Error) => {
      this.logger.error(`MCP Registry Server error: ${error.message}`, error.stack);
    });
  }

  // Optional: Method to gracefully shutdown the server
  async closeServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.wss) {
        this.wss.close((err) => {
          if (err) {
            this.logger.error('Error closing MCP Registry Server:', err);
            reject(err);
          } else {
            this.logger.log('MCP Registry Server closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}
