import { Logger } from 'winston';
import { getLogger } from '../logging/loggingConfig.js';
import { AgentCommunicationBridge, AgentMessage } from './AgentCommunicationBridge.js';
import { MetricsProcessor } from '../security/metricsProcessor.js';
import { ProtocolTranslator } from '../protocols/ProtocolTranslator.js';
import { EventEmitter } from 'events';

const logger: Logger = getLogger('agent_communication_manager');

export interface CommunicationChannel {
  id: string;
  type: 'direct' | 'broadcast' | 'group';
  participants: string[];
  metadata: Record<string, unknown>;
}

export interface AgentCommunicationConfig {
  enabledProtocols: ('A2A_V1' | 'A2A_V2' | 'MCP')[];
  retryOptions: {
    maxRetries: number;
    initialDelay: number;
    backoffMultiplier: number;
  };
  securityLevel: 'basic' | 'enhanced' | 'strict';
  timeoutMs: number;
}

export class AgentCommunicationManager extends EventEmitter {
  private bridge: AgentCommunicationBridge;
  private protocolTranslator: ProtocolTranslator;
  private activeChannels: Map<string, CommunicationChannel>;
  private config: AgentCommunicationConfig;
  
  constructor(
    private readonly metricsProcessor: MetricsProcessor,
    config?: Partial<AgentCommunicationConfig>
  ) {
    super();
    this.bridge = new AgentCommunicationBridge(metricsProcessor);
    this.protocolTranslator = new ProtocolTranslator();
    this.activeChannels = new Map();
    
    // Default configuration
    this.config = {
      enabledProtocols: ['A2A_V2', 'MCP'],
      retryOptions: {
        maxRetries: 3,
        initialDelay: 1000,
        backoffMultiplier: 1.5,
      },
      securityLevel: 'enhanced',
      timeoutMs: 30000,
      ...config
    };

    logger.info('AgentCommunicationManager initialized with configuration', { 
      enabledProtocols: this.config.enabledProtocols,
      securityLevel: this.config.securityLevel
    });
  }

  /**
   * Create a communication channel between agents
   */
  async createChannel(
    channelType: 'direct' | 'broadcast' | 'group',
    participants: string[],
    metadata: Record<string, unknown> = {}
  ): Promise<CommunicationChannel> {
    const channelId = `channel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const channel: CommunicationChannel = {
      id: channelId,
      type: channelType,
      participants,
      metadata: {
        createdAt: Date.now(),
        createdBy: 'system',
        ...metadata
      }
    };
    
    this.activeChannels.set(channelId, channel);
    logger.info(`Created new ${channelType} channel`, { channelId, participants });
    
    this.emit('channelCreated', channel);
    return channel;
  }

  /**
   * Send a message to a specific agent using the appropriate protocol
   */
  async sendMessage(
    message: Omit<AgentMessage, 'id' | 'timestamp'>,
    options: {
      priority?: 'low' | 'medium' | 'high';
      protocol?: 'A2A_V1' | 'A2A_V2' | 'MCP';
      timeout?: number;
    } = {}
  ): Promise<string> {
    const protocol = options.protocol || this.config.enabledProtocols[0];
    const priority = options.priority || 'medium';
    const timeout = options.timeout || this.config.timeoutMs;
    
    // Create full message with generated ID
    const messageId = this.generateMessageId();
    const fullMessage: AgentMessage = {
      ...message,
      id: messageId,
      timestamp: Date.now(),
      metadata: {
        ...message.metadata,
        priority,
        timeout,
        protocol
      }
    };
    
    // Translate message to the appropriate protocol if needed
    const translatedMessage = await this.protocolTranslator.translateMessage(
      fullMessage, 
      'internal', 
      protocol
    );
    
    // Send through the bridge
    await this.bridge.sendMessage(translatedMessage as AgentMessage);
    
    logger.debug('Message sent', { 
      messageId, 
      sender: message.sender, 
      recipient: message.recipient,
      protocol
    });
    
    this.emit('messageSent', fullMessage);
    return messageId;
  }
  
  /**
   * Register a handler for incoming messages
   */
  async registerAgent(
    agentId: string,
    handler: (message: AgentMessage) => Promise<void>
  ): Promise<void> {
    await this.bridge.registerHandler(agentId, async (message) => {
      try {
        // Translate incoming message if needed
        const internalMessage = await this.protocolTranslator.translateMessage(
          message,
          message.metadata.protocol as string || 'A2A_V2',
          'internal'
        );
        
        // Process the message
        await handler(internalMessage as AgentMessage);
        
        this.emit('messageProcessed', {
          messageId: message.id,
          agentId,
          success: true
        });
      } catch (error) {
        logger.error(`Error handling message for agent ${agentId}:`, error);
        
        this.emit('messageProcessingError', {
          messageId: message.id,
          agentId,
          error: error.message
        });
      }
    });
    
    logger.info(`Agent ${agentId} registered with communication manager`);
  }
  
  /**
   * Send a broadcast message to all agents in a specified group or channel
   */
  async broadcastMessage(
    sender: string,
    channelId: string,
    payload: unknown,
    metadata: Record<string, unknown> = {}
  ): Promise<string[]> {
    const channel = this.activeChannels.get(channelId);
    
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }
    
    const messageIds: string[] = [];
    
    // Send message to all participants except the sender
    const recipients = channel.participants.filter(p => p !== sender);
    
    for (const recipient of recipients) {
      const messageId = await this.sendMessage({
        sender,
        recipient,
        type: 'task_request',
        payload,
        metadata: {
          channelId,
          isChannelMessage: true,
          ...metadata
        }
      });
      
      messageIds.push(messageId);
    }
    
    logger.info(`Broadcast message sent to ${recipients.length} recipients`, {
      channelId,
      sender,
      messageIds
    });
    
    return messageIds;
  }
  
  /**
   * Close a communication channel
   */
  async closeChannel(channelId: string): Promise<boolean> {
    const channel = this.activeChannels.get(channelId);
    
    if (!channel) {
      logger.warn(`Attempted to close non-existent channel: ${channelId}`);
      return false;
    }
    
    this.activeChannels.delete(channelId);
    
    logger.info(`Channel ${channelId} closed`, {
      type: channel.type,
      participants: channel.participants.length
    });
    
    this.emit('channelClosed', channel);
    return true;
  }
  
  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}