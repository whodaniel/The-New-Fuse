import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  type: 'direct' | 'group' | 'broadcast';
  senderId: string;
  recipients: string[];
  content: string;
  metadata: Record<string, unknown>;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  expiresAt?: Date;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'direct';
  members: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface Subscription {
  id: string;
  userId: string;
  channelId: string;
  status: 'active' | 'muted' | 'blocked';
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MessagingService extends EventEmitter implements OnModuleInit {
  private logger: Logger;
  private redis: Redis;
  private db: DatabaseService;
  private readonly messageRetention: number;
  private readonly maxRecipientsPerMessage: number;
  private readonly maxMessageLength: number;

  constructor(db: DatabaseService, redis: Redis) { // Added db and redis to constructor parameters
    super();
    this.logger = new Logger(MessagingService.name);
    this.db = db;
    this.redis = redis;
    // Initialize these from config or defaults
    this.messageRetention = parseInt(process.env.MESSAGE_RETENTION_SECONDS || '604800', 10); // 7 days
    this.maxRecipientsPerMessage = parseInt(process.env.MAX_RECIPIENTS_PER_MESSAGE || '100', 10);
    this.maxMessageLength = parseInt(process.env.MAX_MESSAGE_LENGTH || '10000', 10);
  }

  async onModuleInit(): Promise<void> {
    if (!this.db || !this.redis) {
      const errorMessage = 'DatabaseService or Redis client is not initialized. Check dependency injection setup.';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    // Initial cleanup
    await this.cleanupExpiredMessages();
    // Schedule periodic cleanup
    setInterval(async () => {
      await this.cleanupExpiredMessages();
    }, this.messageRetention * 1000 / 2); // Run cleanup periodically (e.g., half of retention time)
  }

  async sendMessage(
    senderId: string,
    recipients: string[],
    content: string,
    options: {
      type?: 'direct' | 'group' | 'broadcast';
      metadata?: Record<string, unknown>;
      expiresIn?: number; // in seconds
    } = {}
  ): Promise<Message> {
    try {
      // Validate input
      if (!senderId || !recipients || recipients.length === 0 || !content) {
        throw new Error('Missing required fields: senderId, recipients, and content must be provided.');
      }
      if (content.length > this.maxMessageLength) {
        throw new Error(`Message exceeds maximum length of ${this.maxMessageLength} characters.`);
      }
      if (recipients.length > this.maxRecipientsPerMessage) {
        throw new Error(`Too many recipients. Maximum is ${this.maxRecipientsPerMessage}.`);
      }

      const message: Message = {
        id: uuidv4(),
        type: options.type || 'direct',
        senderId,
        recipients,
        content,
        metadata: options.metadata || {},
        status: 'pending',
        timestamp: new Date(),
        expiresAt: options.expiresIn
          ? new Date(Date.now() + options.expiresIn * 1000)
          : undefined,
      };

      // Store message in DB
      await this.db.messages.create({
        data: {
          ...message,
          recipients: JSON.stringify(recipients), // Store as JSON string
          metadata: JSON.stringify(message.metadata), // Store as JSON string
        },
      });

      // Cache message for quick access
      await this.cacheMessage(message);

      // Update message status
      message.status = 'sent';
      await this.updateMessageStatus(message.id, 'sent');

      // Notify recipients (e.g., via Redis pub/sub or WebSocket)
      await this.notifyRecipients(message);

      // Emit event
      this.emit('messageSent', {
        messageId: message.id,
        senderId: message.senderId,
        recipientCount: recipients.length,
      });

      return message;
    } catch (error: unknown) {
      this.logger.error('Failed to send message:', error);
      // Optionally, update message status to 'failed' in DB
      // Rethrow or handle as appropriate for your application
      throw error; // Rethrowing for now
    }
  }

  private async cacheMessage(message: Message): Promise<void> {
    const key = `message:${message.id}`;
    await this.redis.set(
      key,
      JSON.stringify(message),
      'EX', // Set expiration
      this.messageRetention // Use configured retention time
    );
  }

  private async notifyRecipients(message: Message): Promise<void> {
    for (const recipientId of message.recipients) {
      // Example: Push to a Redis list for each recipient (could be a notification queue)
      const key = `notifications:${recipientId}`;
      await this.redis.lpush(key, JSON.stringify({
        type: 'newMessage', // Differentiate notification types
        messageId: message.id,
        senderId: message.senderId,
        timestamp: message.timestamp,
      }));
      // Additionally, you might publish to a channel if using Redis Pub/Sub
      // await this.redis.publish(`user:${recipientId}`, JSON.stringify({ type: 'newMessage', messageId: message.id }));
    }
  }

  async createChannel(
    name: string,
    options: {
      description?: string;
      type?: 'public' | 'private' | 'direct';
      members?: string[];
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<Channel> {
    try {
      const channel: Channel = {
        id: uuidv4(),
        name,
        description: options.description || '',
        type: options.type || 'public',
        members: options.members || [],
        metadata: options.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.db.channels.create({
        data: {
          ...channel,
          members: JSON.stringify(channel.members), // Store as JSON string
          metadata: JSON.stringify(channel.metadata), // Store as JSON string
        },
      });

      if (channel.members.length > 0) {
        await Promise.all(
          channel.members.map(userId =>
            this.subscribe(userId, channel.id)
          )
        );
      }

      this.emit('channelCreated', {
        channelId: channel.id,
        name: channel.name,
        type: channel.type,
      });

      return channel;
    } catch (error: unknown) {
      this.logger.error('Failed to create channel:', error);
      throw error;
    }
  }

  async subscribe(
    userId: string,
    channelId: string,
    options: {
      status?: 'active' | 'muted' | 'blocked';
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<Subscription> {
    try {
      const subscription: Subscription = {
        id: uuidv4(),
        userId,
        channelId,
        status: options.status || 'active',
        metadata: options.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.db.subscriptions.create({
        data: {
          ...subscription,
          metadata: JSON.stringify(subscription.metadata), // Store as JSON string
        },
      });

      // Add user to channel members list if not already present
      // This requires reading the current members, adding, then updating.
      // Prisma specific update for JSON array:
      const channel = await this.db.channels.findUnique({ where: { id: channelId } });
      if (channel) {
        const members = JSON.parse(channel.members as string || '[]') as string[];
        if (!members.includes(userId)) {
          members.push(userId);
          await this.db.channels.update({
            where: { id: channelId },
            data: { members: JSON.stringify(members) },
          });
        }
      }

      this.emit('subscriptionCreated', {
        subscriptionId: subscription.id,
        userId,
        channelId,
      });
      return subscription;
    } catch (error: unknown) {
      this.logger.error('Failed to create subscription:', error);
      throw error;
    }
  }

  async unsubscribe(userId: string, channelId: string): Promise<void> {
    try {
      await this.db.subscriptions.deleteMany({
        where: {
          userId,
          channelId,
        },
      });

      // Remove user from channel members list
      const channel = await this.db.channels.findUnique({ where: { id: channelId } });
      if (channel) {
        let members = JSON.parse(channel.members as string || '[]') as string[];
        members = members.filter(id => id !== userId);
        await this.db.channels.update({
          where: { id: channelId },
          data: { members: JSON.stringify(members) },
        });
      }

      this.emit('subscriptionDeleted', {
        userId,
        channelId,
      });
    } catch (error: unknown) {
      this.logger.error('Failed to delete subscription:', error);
      throw error;
    }
  }

  async getMessages(
    options: {
      channelId?: string;
      userId?: string; // To get messages for a specific user (sent or received)
      status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
      startTime?: Date;
      endTime?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Message[]> {
    // Constructing the where clause carefully
    const whereClause: any = {};
    if (options.channelId) whereClause.channelId = options.channelId; 
    if (options.status) whereClause.status = options.status;
    if (options.startTime || options.endTime) {
      whereClause.timestamp = {};
      if (options.startTime) whereClause.timestamp.gte = options.startTime;
      if (options.endTime) whereClause.timestamp.lte = options.endTime;
    }
    if (options.userId) {
      whereClause.OR = [
        { senderId: options.userId },
        { recipients: { contains: `\"${options.userId}\"` } } // searching for "userId" in JSON string array
      ];
    }

    const dbMessages = await this.db.messages.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' }, // Prisma syntax for order
      skip: options.offset,
      take: options.limit,
    });
    // Parse recipients and metadata back to objects
    return dbMessages.map(msg => ({
        ...msg,
        recipients: JSON.parse(msg.recipients as string || '[]'),
        metadata: JSON.parse(msg.metadata as string || '{}'),
    })) as Message[];
  }

  async getChannels(
    options: {
      userId?: string; // Get channels a user is a member of
      type?: 'public' | 'private' | 'direct';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Channel[]> {
    const whereClause: any = {};
    if (options.type) whereClause.type = options.type;
    if (options.userId) {
        whereClause.members = { contains: `\"${options.userId}\"` }; // searching for "userId" in JSON string array
    }

    const dbChannels = await this.db.channels.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      skip: options.offset,
      take: options.limit,
    });
    return dbChannels.map(ch => ({
        ...ch,
        members: JSON.parse(ch.members as string || '[]'),
        metadata: JSON.parse(ch.metadata as string || '{}'),
    })) as Channel[];
  }

  async updateMessageStatus(
    messageId: string,
    status: 'sent' | 'delivered' | 'read' | 'failed'
  ): Promise<void> {
    try {
      await this.db.messages.update({
        where: { id: messageId },
        data: { status },
      });

      const cached = await this.redis.get(`message:${messageId}`);
      if (cached) {
        const message = JSON.parse(cached) as Message;
        message.status = status;
        await this.cacheMessage(message); // Re-cache with updated status and TTL
      }

      this.emit('messageStatusUpdated', {
        messageId,
        status,
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to update message status for ${messageId}:`, error);
      throw error;
    }
  }

  async markMessagesAsRead(userId: string, messageIds: string[]): Promise<void> {
    try {
      await Promise.all(
        messageIds.map(id =>
          this.updateMessageStatus(id, 'read')
        )
      );

      this.emit('messagesRead', {
        userId,
        messageCount: messageIds.length,
      });
    } catch (error: unknown) {
      this.logger.error('Failed to mark messages as read:', error);
      throw error;
    }
  }

  private async cleanupExpiredMessages(): Promise<void> {
    try {
      const now = new Date();
      // Delete messages that have an expiresAt in the past
      // OR messages older than retention period if expiresAt is null
      await this.db.messages.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            {
              AND: [
                { expiresAt: null },
                { timestamp: { lt: new Date(now.getTime() - this.messageRetention * 1000) } },
              ],
            },
          ],
        },
      });
      this.logger.info('Expired messages cleaned up.');
    } catch (error: unknown) {
      this.logger.error('Failed to cleanup expired messages:', error);
      // Do not rethrow, as this is a background task
    }
  }

  async clearHistory(
    options: {
      olderThan?: Date;
      status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
      channelId?: string; // Optional: clear history for a specific channel
    } = {}
  ): Promise<void> {
    const whereClause: any = {};
    if (options.olderThan) whereClause.timestamp = { lt: options.olderThan };
    if (options.status) whereClause.status = options.status;
    if (options.channelId) whereClause.channelId = options.channelId; // Assuming messages have channelId
    
    await this.db.messages.deleteMany({ where: whereClause });

    // It might be too aggressive to call cleanupExpiredMessages here again
    // unless there's a specific reason. The periodic cleanup should handle general expiration.
    this.logger.info('Message history cleared based on criteria.');
  }
}
