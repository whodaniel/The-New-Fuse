import { EventEmitter } from 'events';
import { ICommunicationProtocol, Message } from '../protocols/ICommunicationProtocol.js';
import { ProtocolFactory, ProtocolType } from '../protocols/ProtocolFactory.js';

/**
 * Interface for agent metadata
 */
export interface AgentInfo {
  id: string;
  name: string;
  capabilities: string[];
}

/**
 * A2A Service Options
 */
export interface A2AServiceOptions {
  agentId: string;
  agentName: string;
  protocolType?: ProtocolType;
  debug?: boolean;
  capabilities?: string[];
}

/**
 * Agent-to-Agent Communication Service
 * 
 * Provides a high-level API for agent-to-agent communication,
 * abstracting away the underlying protocol details.
 */
export class A2AService extends EventEmitter {
  private protocol: ICommunicationProtocol;
  private agentId: string;
  private agentName: string;
  private capabilities: string[];
  private debug: boolean;

  constructor(options: A2AServiceOptions) {
    super();
    this.agentId = options.agentId;
    this.agentName = options.agentName;
    this.capabilities = options.capabilities || [];
    this.debug = options.debug || false;
    
    // Create the protocol instance
    const protocolType = options.protocolType || ProtocolType.FILE;
    this.protocol = ProtocolFactory.createProtocol(protocolType, {
      agentId: this.agentId,
      debug: this.debug
    });
    
    // Set up protocol event forwarding
    this.protocol.onMessageReceived(this.handleMessage.bind(this));
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await this.protocol.initialize();
    this.protocol.startListening();
    this.log('A2A service initialized');
  }

  /**
   * Send a message to another agent
   */
  async sendMessage(
    targetAgentId: string,
    content: any,
    messageType: string = 'text',
    conversationId?: string
  ): Promise<Message> {
    this.log(`Sending message to ${targetAgentId}`, { type: messageType });
    return this.protocol.sendMessage(targetAgentId, content, messageType, conversationId || undefined);
  }

  /**
   * Send a task request to another agent
   */
  async sendTaskRequest(
    targetAgentId: string,
    taskType: string,
    parameters: Record<string, any>,
    conversationId?: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<Message> {
    const content = {
      taskType,
      parameters,
      priority,
      requestedBy: {
        id: this.agentId,
        name: this.agentName
      }
    };
    
    return this.protocol.sendMessage(
      targetAgentId,
      content,
      'TASK_REQUEST',
      conversationId
    );
  }

  /**
   * Send a query to another agent
   */
  async sendQuery(
    targetAgentId: string,
    query: string,
    parameters: Record<string, any> = {},
    conversationId?: string
  ): Promise<Message> {
    const content = {
      query,
      parameters,
      requestedBy: {
        id: this.agentId,
        name: this.agentName
      }
    };
    
    return this.protocol.sendMessage(
      targetAgentId,
      content,
      'QUERY',
      conversationId
    );
  }

  /**
   * Send a response to a message
   */
  async sendResponse(
    originalMessage: Message,
    content: any,
    status: 'success' | 'error' | 'partial' = 'success'
  ): Promise<Message> {
    const responseContent = {
      originalMessageId: originalMessage.id,
      status,
      data: content,
      respondedBy: {
        id: this.agentId,
        name: this.agentName
      }
    };
    
    return this.protocol.sendResponse(originalMessage, responseContent);
  }

  /**
   * Broadcast a message to all agents
   */
  async broadcastMessage(
    content: any,
    messageType: string = 'NOTIFICATION',
    conversationId?: string
  ): Promise<Message> {
    // In this implementation, we use 'broadcast' as the target
    // The actual broadcasting is handled by the protocol implementation
    return this.protocol.sendMessage('broadcast', content, messageType, conversationId || undefined);
  }

  /**
   * Register a message handler for specific message types
   */
  onMessageType(type: string, handler: (message: Message) => void): void {
    this.protocol.onMessageType(type, handler);
  }

  /**
   * Get agent information
   */
  getAgentInfo(): AgentInfo {
    return {
      id: this.agentId,
      name: this.agentName,
      capabilities: this.capabilities
    };
  }

  /**
   * Register capabilities for this agent
   */
  registerCapabilities(capabilities: string[]): void {
    this.capabilities = [...new Set([...this.capabilities, ...capabilities])];
    this.log('Updated agent capabilities', this.capabilities);
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: Message): void {
    this.log(`Received message of type ${message.metadata.type} from ${message.source}`);
    
    // Emit an event for this message type
    this.emit(`message:${message.metadata.type}`, message);
    
    // Also emit a generic message event
    this.emit('message', message);
  }

  /**
   * Utility method for logging
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      if (data) {
        console.log(`[A2A:${this.agentId}] ${message}`, data);
      } else {
        console.log(`[A2A:${this.agentId}] ${message}`);
      }
    }
  }
}