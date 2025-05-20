import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '../utils/logger.js';
import { EnhancedPythonBridge } from '../utils/EnhancedPythonBridge.js';

/**
 * Tool specification for ADK
 */
export interface ADKToolSpec {
  name: string;
  description: string;
  parameters: Record<string, any>;
  returns?: Record<string, any>;
}

/**
 * Message handler for ADK
 */
export interface ADKMessageHandler {
  messageType: string;
  handler: (message: any) => Promise<void>;
}

/**
 * ADK Bridge Service
 * 
 * This service provides a bridge between TypeScript and Google's ADK (Agent Development Kit).
 * It allows for registering tools, handling messages, and sending messages to other agents.
 */
@Injectable()
export class ADKBridgeService implements OnModuleInit, OnModuleDestroy {
  private bridge: EnhancedPythonBridge;
  private logger = new Logger(ADKBridgeService.name);
  private initialized = false;
  private tools = new Map<string, ADKToolSpec>();
  private messageHandlers = new Map<string, (message: any) => Promise<void>>();
  private handlerIds = new Map<string, string>();

  constructor(private eventEmitter: EventEmitter2) {
    this.bridge = new EnhancedPythonBridge({
      pythonPath: './src/protocols/adk_bridge.py',
      debug: true,
    });

    // Set up event listeners
    this.bridge.on('error', (error) => {
      this.logger.error(`Bridge error: ${error.message}`);
      this.eventEmitter.emit('adk.bridge.error', error);
    });

    this.bridge.on('exit', ({ code, signal }) => {
      this.logger.warn(`Bridge exited with code ${code} and signal ${signal}`);
      this.initialized = false;
      this.eventEmitter.emit('adk.bridge.exit', { code, signal });
    });

    this.bridge.on('stderr', (text) => {
      this.logger.debug(`Bridge stderr: ${text}`);
    });
  }

  /**
   * Initialize the ADK bridge
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.initialize();
    } catch (error) {
      this.logger.error(`Failed to initialize ADK bridge: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clean up the ADK bridge
   */
  async onModuleDestroy(): Promise<void> {
    await this.terminate();
  }

  /**
   * Initialize the ADK bridge
   * @returns Promise that resolves when the bridge is initialized
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize the bridge
      await this.bridge.initialize();
      
      // Call the initialize method on the Python side
      const result = await this.bridge.invoke('initialize', {});
      
      if (result.status !== 'initialized' && result.status !== 'already_initialized') {
        throw new Error(`Failed to initialize ADK bridge: ${result.error || 'Unknown error'}`);
      }
      
      this.initialized = true;
      this.logger.info('ADK bridge initialized successfully');
      this.eventEmitter.emit('adk.bridge.initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize ADK bridge: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Terminate the ADK bridge
   * @returns Promise that resolves when the bridge is terminated
   */
  async terminate(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // Call the terminate method on the Python side
      await this.bridge.invoke('terminate', {});
      
      // Terminate the bridge
      await this.bridge.terminate();
      
      this.initialized = false;
      this.logger.info('ADK bridge terminated successfully');
      this.eventEmitter.emit('adk.bridge.terminated');
    } catch (error) {
      this.logger.error(`Failed to terminate ADK bridge: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Register a tool with the ADK bridge
   * @param tool Tool specification
   * @returns Promise that resolves when the tool is registered
   */
  async registerTool(tool: ADKToolSpec): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Register the tool with the Python side
      const result = await this.bridge.invoke('register_tool', {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      });
      
      if (result.status !== 'success') {
        throw new Error(`Failed to register tool: ${result.error || 'Unknown error'}`);
      }
      
      // Store the tool for later reference
      this.tools.set(tool.name, tool);
      
      this.logger.info(`Registered tool: ${tool.name}`);
      this.eventEmitter.emit('adk.tool.registered', tool);
    } catch (error) {
      this.logger.error(`Failed to register tool ${tool.name}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Register a message handler with the ADK bridge
   * @param messageType Message type to handle
   * @param handler Handler function
   * @returns Promise that resolves when the handler is registered
   */
  async registerMessageHandler(messageType: string, handler: (message: any) => Promise<void>): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Generate a unique handler ID
      const handlerId = `handler_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Register the handler with the Python side
      const result = await this.bridge.invoke('register_message_handler', {
        message_type: messageType,
        handler_id: handlerId,
      });
      
      if (result.status !== 'success') {
        throw new Error(`Failed to register message handler: ${result.error || 'Unknown error'}`);
      }
      
      // Store the handler for later reference
      this.messageHandlers.set(handlerId, handler);
      this.handlerIds.set(messageType, handlerId);
      
      this.logger.info(`Registered message handler for ${messageType}: ${handlerId}`);
      this.eventEmitter.emit('adk.handler.registered', { messageType, handlerId });
    } catch (error) {
      this.logger.error(`Failed to register message handler for ${messageType}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Send a message to another agent
   * @param target Target agent ID
   * @param messageType Message type
   * @param payload Message payload
   * @returns Promise that resolves when the message is sent
   */
  async sendMessage(target: string, messageType: string, payload: any): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Send the message via the Python side
      const result = await this.bridge.invoke('send_message', {
        target,
        message_type: messageType,
        payload,
      });
      
      if (result.status !== 'success') {
        throw new Error(`Failed to send message: ${result.error || 'Unknown error'}`);
      }
      
      this.logger.info(`Sent message to ${target}: ${messageType}`);
      this.eventEmitter.emit('adk.message.sent', { target, messageType, payload });
    } catch (error) {
      this.logger.error(`Failed to send message to ${target}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Update the agent context
   * @param context Context to update
   * @returns Promise that resolves when the context is updated
   */
  async updateContext(context: Record<string, any>): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Update the context via the Python side
      const result = await this.bridge.invoke('update_context', {
        context,
      });
      
      if (result.status !== 'success') {
        throw new Error(`Failed to update context: ${result.error || 'Unknown error'}`);
      }
      
      this.logger.info(`Updated context: ${Object.keys(context).join(', ')}`);
      this.eventEmitter.emit('adk.context.updated', context);
    } catch (error) {
      this.logger.error(`Failed to update context: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Handle a tool invocation from the Python side
   * @param name Tool name
   * @param parameters Tool parameters
   * @returns Promise that resolves with the tool result
   */
  private async handleToolInvocation(name: string, parameters: Record<string, any>): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      // Emit an event for the tool invocation
      this.eventEmitter.emit('adk.tool.invoked', { name, parameters });
      
      // Execute the tool
      // In a real implementation, this would call the actual tool function
      const result = { status: 'success', message: `Tool ${name} executed successfully` };
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to execute tool ${name}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Handle a message received from the Python side
   * @param handlerId Handler ID
   * @param message Message
   * @returns Promise that resolves when the message is handled
   */
  private async handleMessageReceived(handlerId: string, message: any): Promise<void> {
    const handler = this.messageHandlers.get(handlerId);
    if (!handler) {
      throw new Error(`Unknown handler: ${handlerId}`);
    }

    try {
      // Emit an event for the message received
      this.eventEmitter.emit('adk.message.received', message);
      
      // Call the handler
      await handler(message);
    } catch (error) {
      this.logger.error(`Failed to handle message: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
