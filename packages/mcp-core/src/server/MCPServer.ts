/**
 * MCP Server Implementation
 * 
 * This class implements the IMCPServer interface providing a complete MCP server
 * with JSON-RPC 2.0 compliance, resource/tool registration, and request handling.
 */

import { EventEmitter } from 'events';
import { IMCPServer } from '../interfaces/IMCPServer';
import { MCPRequest, MCPResponse, MCPError } from '../interfaces/IMCPMessage';
import { MCPResource } from '../interfaces/IMCPResource';
import { MCPTool } from '../interfaces/IMCPTool';
import { MCPCapability } from '../interfaces/IMCPCapability';
import { MCPServerConfig, MCPServerInfo } from '../types/server';
import { MCPErrorClass, MCPErrorCode, JSONRPCErrorCode } from '../types/error';
import { MessageValidator } from '../validation/messageValidator';
import { LogLevel } from '../types/common';

/**
 * Core MCP Server implementation
 */
export class MCPServer extends EventEmitter implements IMCPServer {
  private config: MCPServerConfig | null = null;
  private running = false;
  private startTime: Date | null = null;
  private resources = new Map<string, MCPResource>();
  private tools = new Map<string, MCPTool>();
  private capabilities = new Map<string, MCPCapability>();
  private activeConnections = 0;
  private requestCount = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private totalResponseTime = 0;
  private messageValidator = new MessageValidator();

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Start the MCP server with the provided configuration
   */
  async start(config: MCPServerConfig): Promise<void> {
    if (this.running) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        'Server is already running'
      );
    }

    try {
      // Validate configuration
      this.validateConfig(config);
      
      // Store configuration
      this.config = { ...config };
      
      // Initialize server components
      await this.initializeServer();
      
      // Mark as running
      this.running = true;
      this.startTime = new Date();
      
      // Register default capabilities
      this.registerDefaultCapabilities();
      
      // Emit started event
      this.emit('started', {
        config: this.config,
        timestamp: this.startTime
      });
      
      this.log(LogLevel.INFO, `MCP Server "${config.name}" started on ${config.host}:${config.port}`);
      
    } catch (error) {
      this.running = false;
      this.startTime = null;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the MCP server gracefully
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    try {
      this.log(LogLevel.INFO, 'Stopping MCP Server...');
      
      // Stop accepting new connections
      this.running = false;
      
      // Wait for active connections to finish
      await this.waitForActiveConnections();
      
      // Cleanup resources
      await this.cleanup();
      
      // Reset state
      this.config = null;
      this.startTime = null;
      this.activeConnections = 0;
      
      // Emit stopped event
      this.emit('stopped', {
        timestamp: new Date()
      });
      
      this.log(LogLevel.INFO, 'MCP Server stopped successfully');
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Register a resource with the MCP server
   */
  registerResource(resource: MCPResource): void {
    if (!resource.uri || !resource.name) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INVALID_PARAMS,
        'Resource must have uri and name'
      );
    }

    if (this.resources.has(resource.uri)) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INVALID_PARAMS,
        `Resource with URI "${resource.uri}" already registered`
      );
    }

    this.resources.set(resource.uri, resource);
    
    this.emit('resourceRegistered', {
      resource,
      timestamp: new Date()
    });
    
    this.log(LogLevel.DEBUG, `Registered resource: ${resource.name} (${resource.uri})`);
  }

  /**
   * Register a tool with the MCP server
   */
  registerTool(tool: MCPTool): void {
    if (!tool.name || !tool.handler) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INVALID_PARAMS,
        'Tool must have name and handler'
      );
    }

    if (this.tools.has(tool.name)) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INVALID_PARAMS,
        `Tool with name "${tool.name}" already registered`
      );
    }

    this.tools.set(tool.name, tool);
    
    this.emit('toolRegistered', {
      tool,
      timestamp: new Date()
    });
    
    this.log(LogLevel.DEBUG, `Registered tool: ${tool.name}`);
  }

  /**
   * Register a capability with the MCP server
   */
  registerCapability(capability: MCPCapability): void {
    if (!capability.name) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INVALID_PARAMS,
        'Capability must have a name'
      );
    }

    if (this.capabilities.has(capability.name)) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INVALID_PARAMS,
        `Capability with name "${capability.name}" already registered`
      );
    }

    this.capabilities.set(capability.name, capability);
    
    this.emit('capabilityRegistered', {
      capability,
      timestamp: new Date()
    });
    
    this.log(LogLevel.DEBUG, `Registered capability: ${capability.name}`);
  }

  /**
   * Handle an incoming MCP request according to JSON-RPC 2.0 specification
   */
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const startTime = Date.now();
    this.requestCount++;
    this.activeConnections++;

    try {
      // Validate request format
      const validationResult = MessageValidator.validateRequest(request);
      if (!validationResult.valid) {
        throw new MCPErrorClass(
          JSONRPCErrorCode.INVALID_REQUEST,
          `Invalid request format: ${validationResult.errors?.join(', ')}`
        );
      }

      // Check if server is running
      if (!this.running) {
        throw new MCPErrorClass(
          MCPErrorCode.SERVICE_UNAVAILABLE,
          'Server is not running'
        );
      }

      // Apply timeout if specified
      const timeout = request.meta?.timeout || this.config?.timeout || 30000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new MCPErrorClass(MCPErrorCode.CONNECTION_TIMEOUT, 'Request timeout'));
        }, timeout);
      });

      // Process request with timeout
      const responsePromise = this.processRequest(request);
      const result = await Promise.race([responsePromise, timeoutPromise]);

      // Create successful response
      const response: MCPResponse = {
        jsonrpc: '2.0',
        id: request.id,
        result,
        meta: {
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          serverId: this.config?.name
        }
      };

      this.successfulRequests++;
      this.totalResponseTime += Date.now() - startTime;

      this.emit('requestProcessed', {
        request,
        response,
        processingTime: Date.now() - startTime
      });

      return response;

    } catch (error) {
      this.failedRequests++;
      
      // Convert error to MCP error format
      const mcpError = this.convertToMCPError(error);
      
      const errorResponse: MCPResponse = {
        jsonrpc: '2.0',
        id: request.id,
        error: mcpError,
        meta: {
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          serverId: this.config?.name
        }
      };

      this.emit('requestError', {
        request,
        error: mcpError,
        processingTime: Date.now() - startTime
      });

      return errorResponse;

    } finally {
      this.activeConnections--;
    }
  }

  /**
   * Get server information including capabilities and status
   */
  getServerInfo(): MCPServerInfo {
    if (!this.config) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        'Server not configured'
      );
    }

    return {
      name: this.config.name,
      version: this.config.version,
      description: `MCP Server for ${this.config.name}`,
      capabilities: Array.from(this.capabilities.keys()),
      status: this.running ? 'running' : 'stopped',
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      activeConnections: this.activeConnections,
      health: {
        healthy: this.running,
        message: this.running ? 'Server is running normally' : 'Server is stopped',
        timestamp: new Date(),
        details: {
          requestCount: this.requestCount,
          successRate: this.requestCount > 0 ? (this.successfulRequests / this.requestCount) * 100 : 0,
          averageResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0
        }
      },
      metadata: {
        resourceCount: this.resources.size,
        toolCount: this.tools.size,
        capabilityCount: this.capabilities.size
      }
    };
  }

  /**
   * Check if the server is currently running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get the list of registered resources
   */
  getRegisteredResources(): MCPResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * Get the list of registered tools
   */
  getRegisteredTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get the list of registered capabilities
   */
  getRegisteredCapabilities(): MCPCapability[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Private method to validate server configuration
   */
  private validateConfig(config: MCPServerConfig): void {
    if (!config.name || typeof config.name !== 'string') {
      throw new MCPErrorClass(JSONRPCErrorCode.INVALID_PARAMS, 'Server name is required');
    }
    
    if (!config.version || typeof config.version !== 'string') {
      throw new MCPErrorClass(JSONRPCErrorCode.INVALID_PARAMS, 'Server version is required');
    }
    
    if (typeof config.port !== 'number' || config.port < 1 || config.port > 65535) {
      throw new MCPErrorClass(JSONRPCErrorCode.INVALID_PARAMS, 'Valid port number is required');
    }
    
    if (!config.host || typeof config.host !== 'string') {
      throw new MCPErrorClass(JSONRPCErrorCode.INVALID_PARAMS, 'Server host is required');
    }
  }

  /**
   * Private method to initialize server components
   */
  private async initializeServer(): Promise<void> {
    // Setup request handlers
    this.setupRequestHandlers();
    
    // Initialize logging
    this.initializeLogging();
  }

  /**
   * Private method to setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('error', (error) => {
      this.log(LogLevel.ERROR, `Server error: ${error.message}`, error);
    });
  }

  /**
   * Private method to setup request handlers
   */
  private setupRequestHandlers(): void {
    // Request handlers will be implemented in the next task
    // This is a placeholder for the request routing system
  }

  /**
   * Private method to register default capabilities
   */
  private registerDefaultCapabilities(): void {
    // Register core MCP capabilities
    this.registerCapability({
      name: 'resources',
      version: '1.0.0',
      description: 'Resource management capability',
      methods: ['resources/list', 'resources/read', 'resources/subscribe'],
      experimental: false
    });

    this.registerCapability({
      name: 'tools',
      version: '1.0.0',
      description: 'Tool execution capability',
      methods: ['tools/list', 'tools/call'],
      experimental: false
    });

    this.registerCapability({
      name: 'server',
      version: '1.0.0',
      description: 'Server information capability',
      methods: ['server/info', 'server/ping'],
      experimental: false
    });
  }

  /**
   * Private method to process individual requests
   */
  private async processRequest(request: MCPRequest): Promise<any> {
    const { method, params } = request;

    switch (method) {
      case 'server/info':
        return this.handleServerInfo();
      
      case 'server/ping':
        return this.handleServerPing();
      
      case 'resources/list':
        return this.handleResourcesList(params);
      
      case 'resources/read':
        return this.handleResourceRead(params);
      
      case 'tools/list':
        return this.handleToolsList();
      
      case 'tools/call':
        return this.handleToolCall(params);
      
      default:
        throw new MCPErrorClass(
          JSONRPCErrorCode.METHOD_NOT_FOUND,
          `Method "${method}" not found`
        );
    }
  }

  /**
   * Handle server info request
   */
  private handleServerInfo(): any {
    return this.getServerInfo();
  }

  /**
   * Handle server ping request
   */
  private handleServerPing(): any {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0
    };
  }

  /**
   * Handle resources list request
   */
  private handleResourcesList(params?: any): any {
    const resources = Array.from(this.resources.values());
    
    // Apply filtering if provided
    if (params?.pattern) {
      const pattern = new RegExp(params.pattern, 'i');
      return resources.filter(resource => 
        pattern.test(resource.name) || pattern.test(resource.uri)
      );
    }
    
    return resources;
  }

  /**
   * Handle resource read request
   */
  private async handleResourceRead(params: any): Promise<any> {
    if (!params?.uri) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INVALID_PARAMS,
        'Resource URI is required'
      );
    }

    const resource = this.resources.get(params.uri);
    if (!resource) {
      throw new MCPErrorClass(
        MCPErrorCode.RESOURCE_NOT_FOUND,
        `Resource not found: ${params.uri}`
      );
    }

    // Call the resource handler
    return await resource.handler.read(params.uri, params);
  }

  /**
   * Handle tools list request
   */
  private handleToolsList(): any {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema
    }));
  }

  /**
   * Handle tool call request
   */
  private async handleToolCall(params: any): Promise<any> {
    if (!params?.name) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INVALID_PARAMS,
        'Tool name is required'
      );
    }

    const tool = this.tools.get(params.name);
    if (!tool) {
      throw new MCPErrorClass(
        MCPErrorCode.TOOL_NOT_FOUND,
        `Tool not found: ${params.name}`
      );
    }

    // Validate tool parameters if schema is provided
    if (tool.inputSchema && params.arguments) {
      // TODO: Implement JSON schema validation
    }

    // Execute the tool
    return await tool.handler.execute(params.arguments || {});
  }

  /**
   * Convert error to MCP error format
   */
  private convertToMCPError(error: any): MCPError {
    if (error instanceof MCPErrorClass) {
      return error.toJSONRPC();
    }

    // Convert generic errors
    return {
      code: JSONRPCErrorCode.INTERNAL_ERROR,
      message: error.message || 'Internal server error',
      details: {
        category: 'system',
        retryable: false
      }
    };
  }

  /**
   * Check if error code indicates a retryable error
   */
  private isRetryableError(code: number): boolean {
    return [
      MCPErrorCode.SERVICE_UNAVAILABLE,
      MCPErrorCode.CONNECTION_TIMEOUT,
      MCPErrorCode.RATE_LIMIT_EXCEEDED
    ].includes(code);
  }

  /**
   * Wait for active connections to finish
   */
  private async waitForActiveConnections(maxWait = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (this.activeConnections > 0 && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Cleanup server resources
   */
  private async cleanup(): Promise<void> {
    // Clear registrations
    this.resources.clear();
    this.tools.clear();
    this.capabilities.clear();
    
    // Reset statistics
    this.requestCount = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.totalResponseTime = 0;
  }

  /**
   * Initialize logging
   */
  private initializeLogging(): void {
    // Logging will be implemented with winston in a future task
  }

  /**
   * Log message with specified level
   */
  private log(level: LogLevel, message: string, meta?: any): void {
    // Simple console logging for now
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (level === LogLevel.ERROR) {
      console.error(logMessage, meta);
    } else if (level === LogLevel.WARN) {
      console.warn(logMessage);
    } else if (level === LogLevel.INFO) {
      console.info(logMessage);
    } else if (level === LogLevel.DEBUG && this.config?.logLevel === LogLevel.DEBUG) {
      console.debug(logMessage);
    }
  }
}