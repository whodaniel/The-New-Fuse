import { BaseService } from '../core/BaseService';
import { Logger } from '@the-new-fuse/core';
import { UUID, Message, MessageType } from '@the-new-fuse/types';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface ChatMessage extends Message {
  senderAgentId: UUID;
  recipientAgentId: UUID;
  conversationId?: UUID;
  sender: string;
}

export interface BroadcastMessage extends Message {
  senderAgentId: UUID;
  topic?: string;
  sender: string;
}

export interface ChatTransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: ChatMessage): Promise<void>;
  broadcastMessage(message: BroadcastMessage): Promise<void>;
  onMessage(handler: (message: ChatMessage | BroadcastMessage) => void): void;
  subscribeToAgent(agentId: UUID): Promise<void>;
  unsubscribeFromAgent(agentId: UUID): Promise<void>;
  subscribeToTopic?(topic: string): Promise<void>;
  unsubscribeFromTopic?(topic: string): Promise<void>;
}

export class InterAgentChatService extends BaseService {
  private logger: Logger;
  private transport: ChatTransport;
  private currentAgentId: UUID;
  private eventEmitter: EventEmitter2;

  constructor(transport: ChatTransport, agentId: UUID, eventEmitter: EventEmitter2) {
    super({ name: 'InterAgentChatService' });
    this.logger = new Logger('InterAgentChatService');
    this.transport = transport;
    this.currentAgentId = agentId;
    this.eventEmitter = eventEmitter;

    this.transport.onMessage(this.handleIncomingMessage.bind(this));

    this.logger.info(`InterAgentChatService initialized for Agent ${agentId}.`);
    this.initializeTransport();
  }

  private async initializeTransport(): Promise<void> {
    try {
      await this.transport.connect();
      await this.transport.subscribeToAgent(this.currentAgentId);
      this.logger.info(`Transport connected and subscribed to Agent ${this.currentAgentId}.`);
    } catch (error) {
      this.logger.error(`Failed to initialize chat transport: ${(error as Error).message}`);
    }
  }

  async sendMessage(
    recipientAgentId: UUID,
    content: string | Record<string, unknown>,
    type: MessageType = MessageType.CHAT,
    conversationId?: UUID
  ): Promise<void> {
    const message: ChatMessage = {
      id: uuidv4(),
      senderAgentId: this.currentAgentId,
      recipientAgentId: recipientAgentId,
      timestamp: Date.now(),
      type,
      content: content,
      conversationId: conversationId,
      sender: this.currentAgentId,
    };

    try {
      await this.transport.sendMessage(message);
      this.logger.debug(`Sent message ${message.id} to Agent ${recipientAgentId}.`);
    } catch (error) {
      this.logger.error(`Failed to send message to Agent ${recipientAgentId}: ${(error as Error).message}`);
      throw error;
    }
  }

  async broadcast(
    content: string | Record<string, unknown>,
    topic?: string
  ): Promise<void> {
     const message: BroadcastMessage = {
      id: uuidv4(),
      senderAgentId: this.currentAgentId,
      timestamp: Date.now(),
      type: MessageType.BROADCAST,
      content: content,
      topic: topic,
      sender: this.currentAgentId,
    };

    try {
      await this.transport.broadcastMessage(message);
      this.logger.debug(`Broadcasted message ${message.id}${topic ? ` on topic ${topic}` : ''}.`);
    } catch (error) {
      this.logger.error(`Failed to broadcast message: ${(error as Error).message}`);
      throw error;
    }
  }

  private handleIncomingMessage(message: ChatMessage | BroadcastMessage): void {
    if (message.senderAgentId === this.currentAgentId) {
      return;
    }

    this.logger.debug(`Received message ${message.id} from Agent ${message.senderAgentId}. Type: ${message.type}`);
    this.eventEmitter.emit('chat.message.received', message);
  }

  async subscribeToTopic(topic: string): Promise<void> {
    if (!this.transport.subscribeToTopic) {
      this.logger.warn('Transport does not support topic subscriptions.');
      return;
    }
    try {
      await this.transport.subscribeToTopic(topic);
      this.logger.info(`Subscribed to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic ${topic}: ${(error as Error).message}`);
    }
  }

  async unsubscribeFromTopic(topic: string): Promise<void> {
     if (!this.transport.unsubscribeFromTopic) {
      this.logger.warn('Transport does not support topic unsubscriptions.');
      return;
    }
    try {
      await this.transport.unsubscribeFromTopic(topic);
      this.logger.info(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from topic ${topic}: ${(error as Error).message}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.transport.disconnect();
      this.logger.info('Chat transport disconnected.');
    } catch (error) {
      this.logger.error(`Error disconnecting chat transport: ${(error as Error).message}`);
    }
  }
}
