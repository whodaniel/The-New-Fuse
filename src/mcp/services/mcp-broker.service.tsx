import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { MCPServer } from '../MCPServer.js';
import { MCPAgentServer } from '../MCPAgentServer.js';
import { MCPChatServer } from '../MCPChatServer.js';
import { MCPWorkflowServer } from '../MCPWorkflowServer.js';
import { MCPFuseServer } from '../MCPFuseServer.js';

/**
 * Message interface for MCP communication
 */
export interface MCPMessage {
  id: string;
  timestamp: string;
  sender: string;
  recipient?: string;
  type: 'command' | 'response' | 'event' | 'error';
  payload: {
    server: string;
    action: string;
    params?: Record<string, any>;
    result?: any;
    error?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * MCP Broker Service
 * 
 * Central broker for all MCP communication. Provides:
 * 1. Single entry point for all MCP directives
 * 2. Message routing between MCP servers
 * 3. Redis-based communication for distributed setups
 * 4. Logging and monitoring of MCP operations
 */
@Injectable()
export class MCPBrokerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MCPBrokerService.name);
  private publisher: Redis;
  private subscriber: Redis;
  private readonly servers = new Map<string, MCPServer>();
  private readonly handlers = new Map<string, Set<(message: MCPMessage) => Promise<void>>>();
  
  // Redis channels
  private readonly BROADCAST_CHANNEL = 'mcp:broadcast';
  private readonly DIRECT_CHANNEL_PREFIX = 'mcp:direct:';
  private readonly SERVER_CHANNEL_PREFIX = 'mcp:server:';
  
  constructor(
    private readonly configService: ConfigService,
    private readonly agentServer: MCPAgentServer,
    private readonly chatServer: MCPChatServer,
    private readonly workflowServer: MCPWorkflowServer,
    private readonly fuseServer: MCPFuseServer,
  ) {
    // Register all MCP servers
    this.servers.set('agent', this.agentServer);
    this.servers.set('chat', this.chatServer);
    this.servers.set('workflow', this.workflowServer);
    this.servers.set('fuse', this.fuseServer);
  }

  async onModuleInit() {
    await this.connect();
    await this.setupSubscriptions();
    this.logger.log('MCP Broker Service initialized');
  }

  async onModuleDestroy() {
    await this.disconnect();
    this.logger.log('MCP Broker Service destroyed');
  }

  /**
   * Connect to Redis
   */
  private async connect() {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    
    try {
      this.publisher = new Redis(redisUrl);
      this.subscriber = new Redis(redisUrl);
      
      this.logger.log('Connected to Redis');
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  private async disconnect() {
    try {
      await Promise.all([
        this.publisher?.disconnect(),
        this.subscriber?.disconnect()
      ]);
      
      this.logger.log('Disconnected from Redis');
    } catch (error) {
      this.logger.error(`Failed to disconnect from Redis: ${error.message}`);
    }
  }

  /**
   * Setup Redis subscriptions
   */
  private async setupSubscriptions() {
    try {
      // Subscribe to broadcast channel
      await this.subscriber.subscribe(this.BROADCAST_CHANNEL);
      
      // Subscribe to direct channel for this instance
      const instanceId = this.configService.get<string>('INSTANCE_ID') || 'default';
      const directChannel = `${this.DIRECT_CHANNEL_PREFIX}${instanceId}`;
      await this.subscriber.subscribe(directChannel);
      
      // Subscribe to server channels
      for (const serverName of this.servers.keys()) {
        const serverChannel = `${this.SERVER_CHANNEL_PREFIX}${serverName}`;
        await this.subscriber.subscribe(serverChannel);
      }
      
      // Handle incoming messages
      this.subscriber.on('message', async (channel, message) => {
        try {
          const parsedMessage = JSON.parse(message) as MCPMessage;
          await this.handleMessage(channel, parsedMessage);
        } catch (error) {
          this.logger.error(`Error handling message on channel ${channel}: ${error.message}`);
        }
      });
      
      this.logger.log('Redis subscriptions set up');
    } catch (error) {
      this.logger.error(`Failed to set up Redis subscriptions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(channel: string, message: MCPMessage) {
    this.logger.debug(`Received message on channel ${channel}: ${JSON.stringify(message)}`);
    
    // Handle based on channel type
    if (channel === this.BROADCAST_CHANNEL) {
      await this.handleBroadcastMessage(message);
    } else if (channel.startsWith(this.DIRECT_CHANNEL_PREFIX)) {
      await this.handleDirectMessage(message);
    } else if (channel.startsWith(this.SERVER_CHANNEL_PREFIX)) {
      await this.handleServerMessage(channel, message);
    }
    
    // Notify handlers
    const handlers = this.handlers.get(message.type) || new Set();
    const promises = Array.from(handlers).map(handler => handler(message));
    await Promise.all(promises);
  }

  /**
   * Handle broadcast message
   */
  private async handleBroadcastMessage(message: MCPMessage) {
    // Process broadcast message
    this.logger.debug(`Processing broadcast message: ${JSON.stringify(message)}`);
    
    // Route to appropriate server
    const serverName = message.payload.server;
    const server = this.servers.get(serverName);
    
    if (!server) {
      this.logger.warn(`Unknown server: ${serverName}`);
      return;
    }
    
    try {
      // Execute capability or tool based on action
      const action = message.payload.action;
      const params = message.payload.params || {};
      
      let result;
      if (action.includes('.')) {
        // Tool execution (format: toolName.execute)
        const [toolName, method] = action.split('.');
        if (method === 'execute') {
          result = await server.executeTool(toolName, params);
        }
      } else {
        // Capability execution
        result = await server.executeCapability(action, params);
      }
      
      // Send response
      await this.sendResponse(message, result);
    } catch (error) {
      await this.sendError(message, error.message);
    }
  }

  /**
   * Handle direct message
   */
  private async handleDirectMessage(message: MCPMessage) {
    // Process direct message (similar to broadcast but for this instance only)
    await this.handleBroadcastMessage(message);
  }

  /**
   * Handle server message
   */
  private async handleServerMessage(channel: string, message: MCPMessage) {
    // Extract server name from channel
    const serverName = channel.replace(this.SERVER_CHANNEL_PREFIX, '');
    const server = this.servers.get(serverName);
    
    if (!server) {
      this.logger.warn(`Unknown server: ${serverName}`);
      return;
    }
    
    try {
      // Execute capability or tool based on action
      const action = message.payload.action;
      const params = message.payload.params || {};
      
      let result;
      if (action.includes('.')) {
        // Tool execution (format: toolName.execute)
        const [toolName, method] = action.split('.');
        if (method === 'execute') {
          result = await server.executeTool(toolName, params);
        }
      } else {
        // Capability execution
        result = await server.executeCapability(action, params);
      }
      
      // Send response
      await this.sendResponse(message, result);
    } catch (error) {
      await this.sendError(message, error.message);
    }
  }

  /**
   * Send response message
   */
  private async sendResponse(originalMessage: MCPMessage, result: any) {
    const response: MCPMessage = {
      id: `${originalMessage.id}_response`,
      timestamp: new Date().toISOString(),
      sender: originalMessage.recipient || 'mcp-broker',
      recipient: originalMessage.sender,
      type: 'response',
      payload: {
        server: originalMessage.payload.server,
        action: originalMessage.payload.action,
        result
      },
      metadata: {
        correlationId: originalMessage.id,
        ...originalMessage.metadata
      }
    };
    
    // Send to appropriate channel
    if (originalMessage.sender) {
      const channel = `${this.DIRECT_CHANNEL_PREFIX}${originalMessage.sender}`;
      await this.publisher.publish(channel, JSON.stringify(response));
    } else {
      // If no sender specified, broadcast the response
      await this.publisher.publish(this.BROADCAST_CHANNEL, JSON.stringify(response));
    }
  }

  /**
   * Send error message
   */
  private async sendError(originalMessage: MCPMessage, errorMessage: string) {
    const response: MCPMessage = {
      id: `${originalMessage.id}_error`,
      timestamp: new Date().toISOString(),
      sender: originalMessage.recipient || 'mcp-broker',
      recipient: originalMessage.sender,
      type: 'error',
      payload: {
        server: originalMessage.payload.server,
        action: originalMessage.payload.action,
        error: errorMessage
      },
      metadata: {
        correlationId: originalMessage.id,
        ...originalMessage.metadata
      }
    };
    
    // Send to appropriate channel
    if (originalMessage.sender) {
      const channel = `${this.DIRECT_CHANNEL_PREFIX}${originalMessage.sender}`;
      await this.publisher.publish(channel, JSON.stringify(response));
    } else {
      // If no sender specified, broadcast the response
      await this.publisher.publish(this.BROADCAST_CHANNEL, JSON.stringify(response));
    }
  }

  /**
   * Execute MCP directive
   * 
   * This is the main entry point for all MCP directives
   */
  async executeDirective(
    serverName: string,
    action: string,
    params: Record<string, any> = {},
    options: {
      sender?: string;
      recipient?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<any> {
    const { sender = 'api', recipient, metadata = {} } = options;
    
    // Check if server exists
    if (!this.servers.has(serverName)) {
      throw new Error(`Unknown MCP server: ${serverName}`);
    }
    
    // Create message
    const message: MCPMessage = {
      id: `mcp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      sender,
      recipient,
      type: 'command',
      payload: {
        server: serverName,
        action,
        params
      },
      metadata
    };
    
    // Determine channel
    let channel: string;
    if (recipient) {
      channel = `${this.DIRECT_CHANNEL_PREFIX}${recipient}`;
    } else {
      channel = `${this.SERVER_CHANNEL_PREFIX}${serverName}`;
    }
    
    // Publish message
    await this.publisher.publish(channel, JSON.stringify(message));
    
    // For local execution, also handle directly
    const server = this.servers.get(serverName);
    try {
      if (action.includes('.')) {
        // Tool execution (format: toolName.execute)
        const [toolName, method] = action.split('.');
        if (method === 'execute') {
          return await server.executeTool(toolName, params);
        }
        throw new Error(`Unknown method: ${method}`);
      } else {
        // Capability execution
        return await server.executeCapability(action, params);
      }
    } catch (error) {
      this.logger.error(`Error executing directive: ${error.message}`);
      throw error;
    }
  }

  /**
   * Register message handler
   */
  registerHandler(type: string, handler: (message: MCPMessage) => Promise<void>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    
    this.handlers.get(type).add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(type);
        }
      }
    };
  }

  /**
   * Get all available MCP capabilities
   */
  getAllCapabilities(): Record<string, Record<string, any>> {
    const capabilities: Record<string, Record<string, any>> = {};
    
    for (const [serverName, server] of this.servers.entries()) {
      capabilities[serverName] = server.getCapabilities();
    }
    
    return capabilities;
  }

  /**
   * Get all available MCP tools
   */
  getAllTools(): Record<string, Record<string, any>> {
    const tools: Record<string, Record<string, any>> = {};
    
    for (const [serverName, server] of this.servers.entries()) {
      tools[serverName] = server.getTools();
    }
    
    return tools;
  }
}
