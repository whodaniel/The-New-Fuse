import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

interface Notification {
  id: string;
  type: string;
  userId: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: string[];
  metadata: Record<string, unknown>;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  expiresAt?: Date;
}

interface NotificationChannel {
  id: string;
  type: 'email' | 'sms' | 'push' | 'slack' | 'webhook';
  config: Record<string, unknown>;
  enabled: boolean;
  metadata: Record<string, unknown>;
}

interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  content: string;
  variables: string[];
  metadata: Record<string, unknown>;
}

interface NotificationPreference {
  id: string;
  userId: string;
  channelPreferences: Record<string, {
    enabled: boolean;
    schedule?: {
      start: string;
      end: string;
      timezone: string;
    };
  }>;
  filters: {
    types?: string[];
    priorities?: string[];
  };
  metadata: Record<string, unknown>;
}

@Injectable()
export class NotificationService extends EventEmitter implements OnModuleInit {
  private logger: Logger;
  private redis: Redis;
  private db: DatabaseService;
  private channels: Map<string, NotificationChannel>;
  private templates: Map<string, NotificationTemplate>;
  private preferences: Map<string, NotificationPreference>;
  private readonly notificationRetention: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor() {
    super();
    this.logger = new Logger('NotificationService');
    this.redis = new Redis();
    this.db = new DatabaseService();
    this.channels = new Map();
    this.templates = new Map();
    this.preferences = new Map();
    this.notificationRetention = 3600; // 1 hour
    this.maxRetries = 3;
    this.retryDelay = 60; // 1 minute
  }

  async onModuleInit(): Promise<void> {
    await Promise.all([
      this.loadChannels(),
      this.loadTemplates(),
      this.loadPreferences(),
    ]);
  }

  private async loadChannels(): Promise<void> {
    try {
      const channels = await this.db.notificationChannels.findMany();
      for (const channel of channels) {
        this.channels.set(channel.id, {
          ...channel,
          config: JSON.parse(channel.config),
          metadata: JSON.parse(channel.metadata),
        });
      }
    } catch (error) {
      this.logger.error('Failed to load notification channels:', error);
    }
  }

  private async loadTemplates(): Promise<void> {
    try {
      const templates = await this.db.notificationTemplates.findMany();
      for (const template of templates) {
        this.templates.set(template.id, {
          ...template,
          variables: JSON.parse(template.variables),
          metadata: JSON.parse(template.metadata),
        });
      }
    } catch (error) {
      this.logger.error('Failed to load notification templates:', error);
    }
  }

  private async loadPreferences(): Promise<void> {
    try {
      const preferences = await this.db.notificationPreferences.findMany();
      for (const preference of preferences) {
        this.preferences.set(preference.userId, {
          ...preference,
          channelPreferences: JSON.parse(preference.channelPreferences),
          filters: JSON.parse(preference.filters),
          metadata: JSON.parse(preference.metadata),
        });
      }
    } catch (error) {
      this.logger.error('Failed to load notification preferences:', error);
    }
  }

  async createNotification(
    userId: string,
    type: string,
    data: {
      title: string;
      message: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      channels?: string[];
      metadata?: Record<string, unknown>;
      expiresIn?: number;
    }
  ): Promise<Notification> {
    try {
      // Create notification
      const notification: Notification = {
        id: uuidv4(),
        type,
        userId,
        title: data.title,
        message: data.message,
        priority: data.priority || 'medium',
        channels: data.channels || ['email'],
        metadata: data.metadata || {},
        status: 'pending',
        timestamp: new Date(),
        expiresAt: data.expiresIn
          ? new Date(Date.now() + data.expiresIn * 1000)
          : undefined,
      };

      // Check user preferences
      const preferences = await this.getUserPreferences(userId);
      if (!this.shouldSendNotification(notification, preferences)) {
        this.logger.debug(`Notification blocked by user preferences ${notification.id}`);
        return notification;
      }

      // Store notification
      await this.db.notifications.create({
        data: {
          ...notification,
          channels: JSON.stringify(notification.channels),
          metadata: JSON.stringify(notification.metadata),
        },
      });

      // Cache notification
      await this.cacheNotification(notification);

      // Send through channels
      await this.sendThroughChannels(notification);

      return notification;
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  private async cacheNotification(notification: Notification): Promise<void> {
    const key = `notification:${notification.id}`;
    await this.redis.set(
      key,
      JSON.stringify(notification),
      'EX',
      this.notificationRetention
    );
  }

  private async sendThroughChannels(notification: Notification): Promise<void> {
    for (const channelId of notification.channels) {
      const channel = this.channels.get(channelId);
      if (!channel || !channel.enabled) continue;

      try {
        await this.sendThroughChannel(notification, channel);
      } catch (error) {
        this.logger.error(`Failed to send notification through channel ${channelId}:`, error);
        notification.status = 'failed';
      }
    }
  }

  private async sendThroughChannel(
    notification: Notification,
    channel: NotificationChannel
  ): Promise<void> {
    switch (channel.type) {
      case 'email':
        await this.sendEmail(notification, channel.config);
        break;
      case 'sms':
        await this.sendSMS(notification, channel.config);
        break;
      case 'push':
        await this.sendPushNotification(notification, channel.config);
        break;
      case 'slack':
        await this.sendSlackMessage(notification, channel.config);
        break;
      case 'webhook':
        await this.sendWebhook(notification, channel.config);
        break;
      default:
        throw new Error(`Unknown channel type: ${channel.type}`);
    }
  }

  private async sendEmail(
    notification: Notification,
    config: Record<string, unknown>
  ): Promise<void> {
    const transporter = nodemailer.createTransport(config.smtp);
    await transporter.sendMail({
      from: config.from,
      to: config.to,
      subject: notification.title,
      text: notification.message,
      html: this.renderTemplate(notification),
    });
  }

  private async sendSMS(
    notification: Notification,
    config: Record<string, unknown>
  ): Promise<void> {
    // Implement SMS sending logic
  }

  private async sendPushNotification(
    notification: Notification,
    config: Record<string, unknown>
  ): Promise<void> {
    // Implement push notification logic
  }

  private async sendSlackMessage(
    notification: Notification,
    config: Record<string, unknown>
  ): Promise<void> {
    await axios.post(config.webhookUrl, {
      text: `${notification.title}\n${notification.message}`,
    });
  }

  private async sendWebhook(
    notification: Notification,
    config: Record<string, unknown>
  ): Promise<void> {
    await axios.post(config.url, {
      notification,
      timestamp: new Date(),
      signature: this.generateWebhookSignature(notification, config.secret),
    });
  }

  private generateWebhookSignature(
    notification: Notification,
    secret: string
  ): string {
    // Implement webhook signature generation
    return '';
  }

  private renderTemplate(notification: Notification): string {
    const template = this.templates.get(notification.type);
    if (!template) return notification.message;

    let content = template.content;
    for (const variable of template.variables) {
      const value = notification.metadata[variable] || '';
      content = content.replace(`{{${variable}}}`, value);
    }
    return content;
  }

  private async retryNotification(
    notification: Notification,
    channel: NotificationChannel,
    retryCount: number
  ): Promise<void> {
    if (retryCount >= this.maxRetries) {
      this.logger.warn(`Max retries reached for notification ${notification.id}`);
      return;
    }

    await this.redis.zadd(
      'notification:retries',
      Date.now() + this.retryDelay * Math.pow(2, retryCount - 1),
      JSON.stringify({ notification, channel })
    );
  }

  async processRetries(): Promise<void> {
    const now = Date.now();
    const items = await this.redis.zrangebyscore('notification:retries', 0, now);

    for (const item of items) {
      const { notification, channel } = JSON.parse(item);
      try {
        await this.sendThroughChannel(notification, channel);
        await this.redis.zrem('notification:retries', item);
      } catch (error) {
        this.logger.error(`Retry failed for notification ${notification.id}:`, error);
        await this.retryNotification(notification, channel, retryCount + 1);
      }
    }
  }

  private shouldSendNotification(
    notification: Notification,
    preferences: NotificationPreference
  ): boolean {
    // Check if notification type is filtered
    if (
      preferences.filters.types &&
      !preferences.filters.types.includes(notification.type)
    ) {
      return false;
    }

    // Check if priority is filtered
    if (
      preferences.filters.priorities &&
      !preferences.filters.priorities.includes(notification.priority)
    ) {
      return false;
    }

    // Check channel preferences
    for (const channelId of notification.channels) {
      const channelPrefs = preferences.channelPreferences[channelId];
      if (!channelPrefs || !channelPrefs.enabled) {
        return false;
      }

      // Check schedule if defined
      if (channelPrefs.schedule) {
        const { start, end, timezone } = channelPrefs.schedule;
        const now = new Date().toLocaleTimeString('en-US', { timeZone: timezone });
        if (now < start || now > end) {
          return false;
        }
      }
    }

    return true;
  }

  async getUserPreferences(userId: string): Promise<NotificationPreference> {
    let preferences = this.preferences.get(userId);
    if (!preferences) {
      // Create default preferences
      preferences = {
        id: uuidv4(),
        userId,
        channelPreferences: {},
        filters: {},
        metadata: {},
      };
      await this.updateUserPreferences(userId, preferences);
    }
    return preferences;
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreference>
  ): Promise<NotificationPreference> {
    const current = this.preferences.get(userId) || {
      id: uuidv4(),
      userId,
      channelPreferences: {},
      filters: {},
      metadata: {},
    };

    const updated = {
      ...current,
      ...preferences,
      channelPreferences: {
        ...current.channelPreferences,
        ...preferences.channelPreferences,
      },
      filters: {
        ...current.filters,
        ...preferences.filters,
      },
      metadata: {
        ...current.metadata,
        ...preferences.metadata,
      },
    };

    await this.db.notificationPreferences.upsert({
      where: { userId },
      create: {
        ...updated,
        channelPreferences: JSON.stringify(updated.channelPreferences),
        filters: JSON.stringify(updated.filters),
        metadata: JSON.stringify(updated.metadata),
      },
      update: {
        channelPreferences: JSON.stringify(updated.channelPreferences),
        filters: JSON.stringify(updated.filters),
        metadata: JSON.stringify(updated.metadata),
      },
    });

    this.preferences.set(userId, updated);
    return updated;
  }

  async updateNotificationStatus(
    notificationId: string,
    status: 'sent' | 'delivered' | 'read' | 'failed'
  ): Promise<void> {
    try {
      await this.db.notifications.update({
        where: { id: notificationId },
        data: { status },
      });
      this.logger.info(`Notification updated: ${notificationId}`);

      // Update cache if exists
      const cached = await this.redis.get(`notification:${notificationId}`);
      if (cached) {
        const notification = JSON.parse(cached);
        notification.status = status;
        await this.cacheNotification(notification);
      }

      // Emit event
      this.emit('notificationStatusUpdated', {
        notificationId,
        status,
      });
    } catch (error: unknown) {
      this.logger.error('Failed to update notification status:', error);
    }
  }

  async markNotificationsAsRead(
    userId: string,
    notificationIds: string[]
  ): Promise<void> {
    try {
      await Promise.all(
        notificationIds.map((id) =>
          this.updateNotificationStatus(id, 'read')
        )
      );

      // Emit event
      this.emit('notificationsRead', {
        userId,
        notificationCount: notificationIds.length,
      });
    } catch (error: unknown) {
      this.logger.error('Failed to mark notifications as read:', error);
    }
  }

  async getNotifications(
    options: {
      userId?: string;
      type?: string;
      status?: string;
      priority?: string;
      startTime?: Date;
      endTime?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Notification[]> {
    return this.db.notifications.findMany({
      where: {
        userId: options.userId,
        type: options.type,
        status: options.status,
        priority: options.priority,
        timestamp: {
          gte: options.startTime,
          lte: options.endTime,
        },
      },
      orderBy: { timestamp: 'desc' },
      skip: options.offset,
      take: options.limit,
    });
  }

  async cleanupExpiredNotifications(): Promise<void> {
    try {
      // Delete expired notifications from database
      await this.db.notifications.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            {
              AND: [
                { expiresAt: null },
                {
                  timestamp: {
                    lt: new Date(
                      Date.now() - this.notificationRetention * 1000
                    ),
                  },
                },
              ],
            },
          ],
        },
      });
    } catch (error: unknown) {
      this.logger.error('Failed to cleanup expired notifications:', error);
    }
  }

  private startCleanupInterval(): void {
    // Schedule periodic cleanup
    setInterval(async () => {
      try {
        await this.cleanupExpiredNotifications();
      } catch (error: unknown) {
        this.logger.error('Error during scheduled cleanup:', error);
      }
    }, this.cleanupInterval * 1000);
  }

  async cleanupNotifications(
    options: {
      olderThan?: Date;
      status?: string;
    } = {}
  ): Promise<void> {
    try {
      // Clear old notifications based on options
      await this.db.notifications.deleteMany({
        where: {
          timestamp: options.olderThan ? { lt: options.olderThan } : undefined,
          status: options.status,
        },
      });

      // Also run the standard expired cleanup
      await this.cleanupExpiredNotifications();
    } catch (error: unknown) {
      this.logger.error('Failed to cleanup notifications:', error);
    }
  }
}
