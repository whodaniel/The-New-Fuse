import { EventEmitter } from 'events';
import { Injectable, Logger } from '@nestjs/common';
import { MetricsProcessor } from '../security/metricsProcessor';
import { AgentCommunicationBridge, AgentMessage } from './AgentCommunicationBridge';

interface CommunicationConfig {
  level: 'info' | 'debug' | 'warn' | 'error';
  type: 'direct' | 'broadcast' | 'group';
  enabledProtocols: ('A2A_V1' | 'A2A_V2' | 'MCP')[];
  securityLevel: 'basic' | 'enhanced' | 'enterprise';
}

interface CommunicationChannel {
  id: string;
  name: string;
  channelType: 'direct' | 'broadcast' | 'group';
  participants: string[];
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

interface SendMessageOptions {
  priority?: 'low' | 'medium' | 'high';
  protocol?: 'A2A_V1' | 'A2A_V2' | 'MCP';
  timeout?: number;
}

@Injectable()
export class AgentCommunicationManager extends EventEmitter {
  private readonly logger = new Logger(AgentCommunicationManager.name);
  private readonly channels = new Map<string, CommunicationChannel>();
  private readonly config: CommunicationConfig;

  constructor(
    private readonly communicationBridge: AgentCommunicationBridge,
    private readonly metricsProcessor: MetricsProcessor
  ) {
    super();
    this.config = {
      level: 'info',
      type: 'direct',
      enabledProtocols: ['A2A_V2', 'MCP'],
      securityLevel: 'enhanced'
    };
    this.logger.log('AgentCommunicationManager initialized');
  }

  async createChannel(
    channelId: string,
    channelType: 'direct' | 'broadcast' | 'group',
    participants: string[]
  ): Promise<CommunicationChannel> {
    try {
      const channel: CommunicationChannel = {
        id: channelId,
        name: `Channel_${channelId}`,
        channelType,
        participants,
        createdAt: new Date(),
        createdBy: 'system',
        isActive: true
      };

      this.channels.set(channelId, channel);
      this.emit('channelCreated', channel);
      this.logger.log('Communication channel created', { channelId, channelType });
      
      return channel;
    } catch (error) {
      this.logger.error('Failed to create channel', { error, channelId });
      throw error;
    }
  }

  async sendMessage(
    message: Omit<AgentMessage, 'id' | 'timestamp'>,
    options: SendMessageOptions = {}
  ): Promise<void> {
    try {
      const priority = options.priority || 'medium';
      const protocol = options.protocol || 'A2A_V2';
      
      const fullMessage: AgentMessage = {
        ...message,
        id: this.generateMessageId(),
        timestamp: new Date().toISOString(),
        priority
      };

      if (message.type === 'direct') {
        await this.communicationBridge.sendDirectMessage(fullMessage);
      } else {
        await this.communicationBridge.broadcastMessage(fullMessage);
      }

      this.logger.log('Message sent successfully', { messageId: fullMessage.id });
      this.emit('messageSent', fullMessage);
      
      // Track metrics
      await this.metricsProcessor.trackEvent('message_sent', {
        messageId: fullMessage.id,
        type: message.type,
        priority,
        protocol
      });
    } catch (error) {
      this.logger.error('Failed to send message', { error, message });
      this.emit('messageError', { error, message });
      throw error;
    }
  }

  async broadcastMessage(
    message: Omit<AgentMessage, 'id' | 'timestamp'>,
    options: SendMessageOptions = {}
  ): Promise<void> {
    try {
      const priority = options.priority || 'medium';
      const protocol = options.protocol || 'A2A_V2';
      
      const broadcastMessage: AgentMessage = {
        ...message,
        id: this.generateMessageId(),
        timestamp: new Date().toISOString(),
        type: 'broadcast',
        priority
      };

      await this.communicationBridge.broadcastMessage(broadcastMessage);
      this.logger.log('Broadcast message sent', { messageId: broadcastMessage.id });
      this.emit('messageBroadcast', broadcastMessage);
    } catch (error) {
      this.logger.error('Failed to broadcast message', { error, message });
      this.emit('broadcastError', { error, message });
      throw error;
    }
  }

  async closeChannel(channelId: string): Promise<void> {
    try {
      const channel = this.channels.get(channelId);
      if (channel) {
        channel.isActive = false;
        this.channels.set(channelId, channel);
        this.logger.log('Channel closed', { channelId });
        this.emit('channelClosed', channel);
      }
    } catch (error) {
      this.logger.error('Failed to close channel', { error, channelId });
      throw error;
    }
  }

  getChannel(channelId: string): CommunicationChannel | undefined {
    return this.channels.get(channelId);
  }

  getActiveChannels(): CommunicationChannel[] {
    return Array.from(this.channels.values()).filter(channel => channel.isActive);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}