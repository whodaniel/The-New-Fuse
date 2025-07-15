import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  type: 'email' | 'sms' | 'push' | 'slack' | 'webhook';
  channels: string[];
  metadata?: Record<string, any>;
  timestamp: Date;
  expiresAt?: Date;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'slack' | 'webhook';
  config: Record<string, any>;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject?: string;
  body: string;
  variables: string[];
  metadata?: Record<string, any>;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  channelPreferences: Record<string, boolean>;
  filters: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationService extends EventEmitter implements OnModuleInit {
  private notificationRetention: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @InjectRedis() private readonly redis: Redis,
    private readonly db: PrismaClient
  ) {
    super();
    this.notificationRetention = parseInt(process.env.NOTIFICATION_RETENTION_SECONDS || '604800');
    this.maxRetries = parseInt(process.env.NOTIFICATION_MAX_RETRIES || '3');
    this.retryDelay = parseInt(process.env.NOTIFICATION_RETRY_DELAY_SECONDS || '300');
  }

  async onModuleInit() {
    this.logger.info('NotificationService initialized');
    this.startCleanupScheduler();
  }

  async loadNotificationChannels(): Promise<NotificationChannel[]> {
    try {
      const channels = await this.db.notificationChannel.findMany({
        where: { isActive: true }
      });

      return channels.map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type as 'email' | 'sms' | 'push' | 'slack' | 'webhook',
        config: JSON.parse((channel.config as string) || '{}'),
        isActive: channel.isActive,
        metadata: JSON.parse((channel.metadata as string) || '{}')
      }));
    } catch (error) {
      this.logger.error('Failed to load notification channels:', error);
      throw error;
    }
  }

  async loadNotificationTemplates(): Promise<NotificationTemplate[]> {
    try {
      const templates = await this.db.notificationTemplate.findMany();

      return templates.map(template => ({
        id: template.id,
        name: template.name,
        type: template.type,
        subject: template.subject || undefined,
        body: template.body,
        variables: JSON.parse((template.variables as string) || '[]'),
        metadata: JSON.parse((template.metadata as string) || '{}')
      }));
    } catch (error) {
      this.logger.error('Failed to load notification templates:', error);
      throw error;
    }
  }

  async loadNotificationPreferences(userId: string): Promise<NotificationPreference> {
    try {
      const preference = await this.db.notificationPreference.findUnique({
        where: { userId }
      });

      if (!preference) {
        return {
          id: uuidv4(),
          userId,
          channelPreferences: { email: true, push: true },
          filters: {},
          metadata: {}
        };
      }

      return {
        id: preference.id,
        userId: preference.userId,
        channelPreferences: JSON.parse((preference.channelPreferences as string) || '{}'),
        filters: JSON.parse((preference.filters as string) || '{}'),
        metadata: JSON.parse((preference.metadata as string) || '{}')
      };
    } catch (error) {
      this.logger.error('Failed to load notification preferences:', error);
      throw error;
    }
  }

  async sendNotification(
    userId: string,
    title: string,
    message: string,
    data: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      type?: 'email' | 'sms' | 'push' | 'slack' | 'webhook';
      channels?: string[];
      metadata?: Record<string, any>;
      expiresAt?: Date;
    } = {}
  ): Promise<Notification> {
    try {
      if (!userId || !title || !message) {
        throw new Error('Missing required fields: userId, title, and message must be provided.');
      }

      const notification: Notification = {
        id: uuidv4(),
        userId,
        title,
        message,
        priority: data.priority || 'medium',
        status: 'pending',
        type: data.type || 'push',
        channels: data.channels || ['push'],
        metadata: data.metadata,
        timestamp: new Date(),
        expiresAt: data.expiresAt
      };

      await this.db.notification.create({
        data: {
          id: notification.id,
          userId: notification.userId,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          status: notification.status,
          type: notification.type,
          channels: JSON.stringify(notification.channels),
          metadata: JSON.stringify(notification.metadata || {}),
          timestamp: notification.timestamp,
          expiresAt: notification.expiresAt
        }
      });

      await this.redis.set(
        `notification:${notification.id}`,
        JSON.stringify(notification),
        'EX',
        this.notificationRetention
      );

      await this.processNotification(notification);
      
      this.emit('notificationSent', notification);
      return notification;
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  async processNotification(notification: Notification): Promise<void> {
    try {
      const channels = await this.loadNotificationChannels();
      const preferences = await this.loadNotificationPreferences(notification.userId);

      for (const channelName of notification.channels) {
        const channel = channels.find(c => c.name === channelName);
        if (!channel || !channel.isActive) {
          continue;
        }

        if (!preferences.channelPreferences[channelName]) {
          continue;
        }

        await this.sendToChannel(notification, channel);
      }

      notification.status = 'sent';
      await this.updateNotificationStatus(notification.id, 'sent');
    } catch (error) {
      this.logger.error('Failed to process notification:', error);
      notification.status = 'failed';
      await this.updateNotificationStatus(notification.id, 'failed');
      await this.scheduleRetry(notification);
    }
  }

  async sendToChannel(notification: Notification, channel: NotificationChannel): Promise<void> {
    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmail(notification, channel);
          break;
        case 'sms':
          await this.sendSms(notification, channel);
          break;
        case 'push':
          await this.sendPush(notification, channel);
          break;
        case 'slack':
          await this.sendSlack(notification, channel);
          break;
        case 'webhook':
          await this.sendWebhook(notification, channel);
          break;
        default:
          throw new Error(`Unsupported notification type: ${channel.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send notification via ${channel.type}:`, error);
      throw error;
    }
  }

  async sendEmail(notification: Notification, channel: NotificationChannel): Promise<void> {
    const config = channel.config;
    const emailData = {
      to: config.recipients || [notification.userId],
      subject: notification.title,
      body: notification.message,
      ...config
    };

    if (config.webhookUrl) {
      await axios.post(config.webhookUrl, emailData);
    }
  }

  async sendSms(notification: Notification, channel: NotificationChannel): Promise<void> {
    const config = channel.config;
    const smsData = {
      to: config.recipients || [notification.userId],
      message: notification.message,
      ...config
    };

    if (config.webhookUrl) {
      await axios.post(config.webhookUrl, smsData);
    }
  }

  async sendPush(notification: Notification, channel: NotificationChannel): Promise<void> {
    const config = channel.config;
    const pushData = {
      title: notification.title,
      body: notification.message,
      priority: notification.priority,
      ...config
    };

    if (config.webhookUrl) {
      await axios.post(config.webhookUrl, pushData);
    }
  }

  async sendSlack(notification: Notification, channel: NotificationChannel): Promise<void> {
    const config = channel.config;
    const slackData = {
      text: notification.title,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${notification.title}*\n${notification.message}`
          }
        }
      ],
      ...config
    };

    if (config.webhookUrl) {
      await axios.post(config.webhookUrl, slackData);
    }
  }

  async sendWebhook(notification: Notification, channel: NotificationChannel): Promise<void> {
    const config = channel.config;
    const webhookData = {
      notificationId: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      type: notification.type,
      timestamp: notification.timestamp,
      ...config.payload
    };

    if (config.webhookUrl) {
      await axios.post(config.webhookUrl, webhookData, {
        headers: config.headers || {}
      });
    }
  }

  async scheduleRetry(notification: Notification): Promise<void> {
    const retryCount = await this.redis.get(`notification:retry:${notification.id}`);
    const count = parseInt(retryCount || '0');

    if (count < this.maxRetries) {
      const retryAt = Date.now() + this.retryDelay * 1000;
      await this.redis.zadd('notification:retries', retryAt.toString(), notification.id);
      await this.redis.set(`notification:retry:${notification.id}`, (count + 1).toString());
    }
  }

  async processRetries(): Promise<void> {
    try {
      const now = Date.now();
      const items = await this.redis.zrangebyscore('notification:retries', '0', now.toString());

      for (const notificationId of items) {
        await this.redis.zrem('notification:retries', notificationId);
        const notificationData = await this.redis.get(`notification:${notificationId}`);
        
        if (notificationData) {
          const notification = JSON.parse(notificationData);
          await this.processNotification(notification);
        }
      }
    } catch (error) {
      this.logger.error('Failed to process retries:', error);
    }
  }

  async updateNotificationStatus(
    notificationId: string,
    status: 'sent' | 'delivered' | 'read' | 'failed'
  ): Promise<void> {
    try {
      await this.db.notification.update({
        where: { id: notificationId },
        data: { status }
      });

      this.emit('notificationStatusUpdated', { notificationId, status });
    } catch (error) {
      this.logger.error('Failed to update notification status:', error);
      throw error;
    }
  }

  async markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void> {
    try {
      await Promise.all(notificationIds.map(id => this.updateNotificationStatus(id, 'read')));
      this.emit('notificationsRead', { userId, notificationIds });
    } catch (error) {
      this.logger.error('Failed to mark notifications as read:', error);
      throw error;
    }
  }

  async getNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    } = {}
  ): Promise<Notification[]> {
    try {
      const limit = options.limit || 50;
      const offset = options.offset || 0;

      const whereClause: any = { userId };
      if (options.status) {
        whereClause.status = options.status;
      }

      const notifications = await this.db.notification.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit
      });

      return notifications.map(notification => ({
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        priority: notification.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: notification.status as 'pending' | 'sent' | 'delivered' | 'read' | 'failed',
        type: notification.type as 'email' | 'sms' | 'push' | 'slack' | 'webhook',
        channels: JSON.parse((notification.channels as string) || '[]'),
        metadata: JSON.parse((notification.metadata as string) || '{}'),
        timestamp: notification.timestamp,
        expiresAt: notification.expiresAt || undefined
      }));
    } catch (error) {
      this.logger.error('Failed to get notifications:', error);
      throw error;
    }
  }

  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const expiredNotifications = await this.db.notification.findMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      await this.db.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      this.logger.info(`Expired notifications cleaned up. Count: ${expiredNotifications.length}`);
    } catch (error) {
      this.logger.error('Failed to clean up expired notifications:', error);
    }
  }

  private startCleanupScheduler(): void {
    setInterval(async () => {
      try {
        await this.cleanupExpiredNotifications();
        await this.processRetries();
      } catch (error) {
        this.logger.error('Error during scheduled cleanup:', error);
      }
    }, 3600000); // Run every hour
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.db.notification.delete({
        where: { id: notificationId }
      });

      await this.redis.del(`notification:${notificationId}`);
      await this.redis.del(`notification:retry:${notificationId}`);
      this.logger.info(`Notification deleted: ${notificationId}`);
    } catch (error) {
      this.logger.error('Failed to delete notification:', error);
      throw error;
    }
  }
}