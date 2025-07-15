import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';

export interface Message {
  id: string;
  senderId: string;
  recipients: string[];
  content: string;
  type: 'direct' | 'group' | 'broadcast';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  members: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface Subscription {
  id: string;
  userId: string;
  channelId: string;
  status: 'active' | 'muted' | 'blocked';
  createdAt: Date;
}

@Injectable()
export class MessagingService extends EventEmitter implements OnModuleInit {
  private messageRetention: number;
  private maxRecipientsPerMessage: number;
  private maxMessageLength: number;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @InjectRedis() private readonly redis: Redis,
    private readonly db: PrismaClient
  ) {
    super();
    this.messageRetention = parseInt(process.env.MESSAGE_RETENTION_SECONDS || '86400');
    this.maxRecipientsPerMessage = parseInt(process.env.MAX_RECIPIENTS_PER_MESSAGE || '100');
    this.maxMessageLength = parseInt(process.env.MAX_MESSAGE_LENGTH || '10000');
  }

  async onModuleInit() {
    this.logger.info('MessagingService initialized');
  }

  async sendMessage(
    senderId: string,
    recipients: string[],
    content: string,
    options: { type?: 'direct' | 'group' | 'broadcast'; metadata?: Record<string, any> } = {}
  ): Promise<Message> {
    try {
      if (!senderId || !recipients || !recipients.length || !content) {
        throw new Error('Missing required fields: senderId, recipients, and content must be provided.');
      }

      if (content.length > this.maxMessageLength) {
        throw new Error(`Message content exceeds maximum length of ${this.maxMessageLength}`);
      }

      if (recipients.length > this.maxRecipientsPerMessage) {
        throw new Error(`Too many recipients. Maximum allowed: ${this.maxRecipientsPerMessage}`);
      }

      const message: Message = {
        id: uuidv4(),
        senderId,
        recipients,
        content,
        type: options.type || 'direct',
        status: 'pending',
        timestamp: new Date(),
        metadata: options.metadata
      };

      await this.db.message.create({
        data: {
          id: message.id,
          senderId: message.senderId,
          recipients: JSON.stringify(message.recipients),
          content: message.content,
          type: message.type,
          status: message.status,
          timestamp: message.timestamp,
          metadata: JSON.stringify(message.metadata || {})
        }
      });

      message.status = 'sent';
      await this.updateMessageStatus(message.id, 'sent');
      
      await this.redis.set(
        `message:${message.id}`,
        JSON.stringify(message),
        'EX',
        this.messageRetention
      );

      await this.redis.publish(
        'messages:new',
        JSON.stringify({ type: 'newMessage', message })
      );

      this.emit('messageSent', message);
      return message;
    } catch (error) {
      this.logger.error('Failed to send message:', error);
      throw error;
    }
  }

  async createChannel(
    name: string,
    options: { type?: 'public' | 'private' | 'direct'; description?: string; members?: string[] } = {}
  ): Promise<Channel> {
    try {
      const channel: Channel = {
        id: uuidv4(),
        name,
        description: options.description || '',
        type: options.type || 'public',
        members: options.members || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.db.channel.create({
        data: {
          id: channel.id,
          name: channel.name,
          description: channel.description,
          type: channel.type,
          members: JSON.stringify(channel.members),
          createdAt: channel.createdAt,
          updatedAt: channel.updatedAt
        }
      });

      this.emit('channelCreated', channel);
      return channel;
    } catch (error) {
      this.logger.error('Failed to create channel:', error);
      throw error;
    }
  }

  async createSubscription(userId: string, channelId: string, options: { status?: 'active' | 'muted' | 'blocked' } = {}): Promise<Subscription> {
    try {
      const subscription: Subscription = {
        id: uuidv4(),
        userId,
        channelId,
        status: options.status || 'active',
        createdAt: new Date()
      };

      const channel = await this.db.channel.findUnique({ where: { id: channelId } });
      if (channel) {
        const members = JSON.parse((channel.members as string) || '[]');
        if (!members.includes(userId)) {
          members.push(userId);
          await this.db.channel.update({
            where: { id: channelId },
            data: { members: JSON.stringify(members) }
          });
        }
      }

      await this.db.subscription.create({
        data: {
          id: subscription.id,
          userId: subscription.userId,
          channelId: subscription.channelId,
          status: subscription.status,
          createdAt: subscription.createdAt
        }
      });

      this.emit('subscriptionCreated', subscription);
      return subscription;
    } catch (error) {
      this.logger.error('Failed to create subscription:', error);
      throw error;
    }
  }

  async deleteSubscription(userId: string, channelId: string): Promise<void> {
    try {
      const channel = await this.db.channel.findUnique({ where: { id: channelId } });
      if (channel) {
        const members = JSON.parse((channel.members as string) || '[]');
        const updatedMembers = members.filter((id: string) => id !== userId);
        await this.db.channel.update({
          where: { id: channelId },
          data: { members: JSON.stringify(updatedMembers) }
        });
      }

      await this.db.subscription.deleteMany({
        where: { userId, channelId }
      });

      this.emit('subscriptionDeleted', { userId, channelId });
    } catch (error) {
      this.logger.error('Failed to delete subscription:', error);
      throw error;
    }
  }

  async getMessages(userId: string, options: { limit?: number; offset?: number; status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' } = {}): Promise<Message[]> {
    try {
      const limit = options.limit || 50;
      const offset = options.offset || 0;

      const whereClause: any = {
        recipients: { contains: `"${userId}"` }
      };

      if (options.status) {
        whereClause.status = options.status;
      }

      const messages = await this.db.message.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit
      });

      return messages.map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        recipients: JSON.parse((msg.recipients as string) || '[]'),
        content: msg.content,
        type: msg.type as 'direct' | 'group' | 'broadcast',
        status: msg.status as 'pending' | 'sent' | 'delivered' | 'read' | 'failed',
        timestamp: msg.timestamp,
        metadata: JSON.parse((msg.metadata as string) || '{}')
      }));
    } catch (error) {
      this.logger.error('Failed to get messages:', error);
      throw error;
    }
  }

  async getChannels(userId: string, options: { type?: 'public' | 'private' | 'direct'; limit?: number; offset?: number } = {}): Promise<Channel[]> {
    try {
      const limit = options.limit || 50;
      const offset = options.offset || 0;

      const whereClause: any = {};
      
      if (options.type) {
        whereClause.type = options.type;
      }

      if (userId) {
        whereClause.members = { contains: `"${userId}"` };
      }

      const channels = await this.db.channel.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit
      });

      return channels.map(ch => ({
        id: ch.id,
        name: ch.name,
        description: ch.description || '',
        type: ch.type as 'public' | 'private' | 'direct',
        members: JSON.parse((ch.members as string) || '[]'),
        createdAt: ch.createdAt,
        updatedAt: ch.updatedAt,
        metadata: JSON.parse((ch.metadata as string) || '{}')
      }));
    } catch (error) {
      this.logger.error('Failed to get channels:', error);
      throw error;
    }
  }

  async updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read' | 'failed'): Promise<void> {
    try {
      await this.db.message.update({
        where: { id: messageId },
        data: { status }
      });

      this.emit('messageStatusUpdated', { messageId, status });
    } catch (error) {
      this.logger.error('Failed to update message status:', error);
      throw error;
    }
  }

  async markMessagesAsRead(userId: string, messageIds: string[]): Promise<void> {
    try {
      await Promise.all(messageIds.map(id => this.updateMessageStatus(id, 'read')));
      this.emit('messagesRead', { userId, messageIds });
    } catch (error) {
      this.logger.error('Failed to mark messages as read:', error);
      throw error;
    }
  }

  async cleanupExpiredMessages(): Promise<void> {
    try {
      const expiredMessages = await this.db.message.findMany({
        where: {
          timestamp: {
            lt: new Date(Date.now() - this.messageRetention * 1000)
          }
        }
      });

      await this.db.message.deleteMany({
        where: {
          timestamp: {
            lt: new Date(Date.now() - this.messageRetention * 1000)
          }
        }
      });

      this.logger.info(`Expired messages cleaned up. Count: ${expiredMessages.length}`);
    } catch (error) {
      this.logger.error('Failed to clean up expired messages:', error);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.db.message.delete({
        where: { id: messageId }
      });

      await this.redis.del(`message:${messageId}`);
      this.logger.info(`Message deleted: ${messageId}`);
    } catch (error) {
      this.logger.error('Failed to delete message:', error);
      throw error;
    }
  }
}