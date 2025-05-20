/**
 * MCP Broker Service
 * Manages communication between MCP servers and clients
 */

import { Injectable, Logger } from '@nestjs/common';
import { toError } from '../../utils/error.js'; // Import the helper

@Injectable()
export class MCPBrokerService {
  private readonly logger = new Logger(MCPBrokerService.name);
  private servers: Map<string, any> = new Map();
  private capabilities: Map<string, any> = new Map();
  private tools: Map<string, any> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.logger.log('Initializing MCP Broker Service');
  }

  /**
   * Initialize the MCP Broker Service
   * Sets up connections and loads configuration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.log('MCP Broker Service already initialized');
      return;
    }

    try {
      this.logger.log('Starting MCP Broker Service initialization');
      // Mock initialization process - in a real system, this might:
      // 1. Connect to external resources
      // 2. Load configurations
      // 3. Set up event listeners
      // 4. Register default capabilities and tools

      // Register some mock servers for development
      this.registerServer('mock-server', {
        capabilities: ['text-generation', 'image-analysis'],
        version: '1.0.0'
      });

      this.registerServer('code-assistant', {
        capabilities: ['code-completion', 'code-explanation'],
        version: '1.1.0'
      });

      this.isInitialized = true;
      this.logger.log('MCP Broker Service initialized successfully');
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error('Failed to initialize MCP Broker Service', err);
      throw err;
    }
  }

  /**
   * Clean up resources used by the MCP Broker Service
   */
  async cleanup(): Promise<void> {
    if (!this.isInitialized) {
      this.logger.log('MCP Broker Service not initialized, nothing to clean up');
      return;
    }

    try {
      this.logger.log('Cleaning up MCP Broker Service resources');
      // Mock cleanup process - in a real system, this might:
      // 1. Close connections
      // 2. Release resources
      // 3. Unregister event listeners

      this.servers.clear();
      this.capabilities.clear();
      this.tools.clear();
      this.isInitialized = false;

      this.logger.log('MCP Broker Service cleanup completed');
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error('Error during MCP Broker Service cleanup', err);
      throw err;
    }
  }

  /**
   * Register a new MCP server
   * @param name Server name
   * @param server Server instance
   */
  registerServer(name: string, server: any): void {
    this.servers.set(name, server);
    this.logger.log(`Registered MCP server: ${name}`);
  }

  /**
   * Get all registered servers
   * @returns Map of server names to server instances
   */
  getServers(): string[] {
    return Array.from(this.servers.keys());
  }

  /**
   * Get status of all servers
   * @returns Server status information
   */
  async getServerStatus(): Promise<Record<string, any>> {
    const status: Record<string, any> = {};
    
    for (const [name, server] of this.servers.entries()) {
      try {
        status[name] = {
          online: true,
          capabilities: server.capabilities || [],
          version: server.version || '1.0.0'
        };
      } catch (error: unknown) { // Change to unknown
        const err = toError(error); // Use helper
        status[name] = {
          online: false,
          error: err.message // Use err.message
        };
      }
    }
    
    return status;
  }

  /**
   * Register a capability
   * @param name Capability name
   * @param handler Capability handler
   */
  registerCapability(name: string, handler: any): void {
    this.capabilities.set(name, handler);
    this.logger.log(`Registered MCP capability: ${name}`);
  }

  /**
   * Get all registered capabilities
   * @returns Map of capability names to handlers
   */
  getAllCapabilities(): string[] {
    return Array.from(this.capabilities.keys());
  }

  /**
   * Register a tool
   * @param name Tool name
   * @param handler Tool handler
   */
  registerTool(name: string, handler: any): void {
    this.tools.set(name, handler);
    this.logger.log(`Registered MCP tool: ${name}`);
  }

  /**
   * Get all registered tools
   * @returns Map of tool names to handlers
   */
  getAllTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Execute a directive on a server
   * @param serverName Server name
   * @param action Action to execute
   * @param params Action parameters
   * @param context Execution context
   * @returns Action result
   */
  async executeDirective(
    serverName: string,
    action: string,
    params: Record<string, any> = {},
    context: { sender: string; metadata?: Record<string, any> } = { sender: 'system' }
  ): Promise<any> {
    const server = this.servers.get(serverName);
    
    if (!server) {
      throw new Error(`MCP server not found: ${serverName}`);
    }
    
    this.logger.log(`Executing MCP directive: ${serverName}.${action}`);
    
    try {
      // Mock implementation - in a real system, this would call the server
      return {
        success: true,
        action,
        result: { message: `Executed ${action} on ${serverName}` }
      };
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error executing MCP directive: ${err.message}`, err.stack); // Use err.message and err.stack
      throw err;
    }
  }
}
