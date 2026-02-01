import { Injectable } from '@nestjs/common';
import { db, desc, eq, notifications } from '@the-new-fuse/database';
import axios from 'axios';
import { EventBus } from '../events/event-bus.service';
import { EmailService } from '../services/email.service';
import { LoggingService } from '../services/logging.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationService {
  constructor(
    private usersService: UsersService,
    private eventBus: EventBus,
    private logger: LoggingService,
    private emailService: EmailService
  ) {}

  async sendNotification(userId: string, type: string, title: string, message: string) {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        message,
        read: false,
      } as any)
      .returning();

    // Log notification sent
    console.log(`Notification sent to user ${userId}: ${type}`);

    return notification;
  }

  async sendMultiChannelNotification(
    channel: 'SLACK' | 'EMAIL' | 'WEBHOOK',
    config: any,
    message: string
  ) {
    try {
      switch (channel) {
        case 'SLACK':
          await this.sendSlackNotification(config, message);
          break;
        case 'EMAIL':
          await this.sendEmailNotification(config, message);
          break;
        case 'WEBHOOK':
          await this.sendWebhookNotification(config, message);
          break;
        default:
          this.logger.warn(`Unknown notification channel: ${channel}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send ${channel} notification: ${error}`);
      // Don't throw, just log
    }
  }

  async sendSlackNotification(config: { channelId: string }, message: string) {
    // Mock implementation or use a Slack client
    this.logger.log(`[MOCK] Sending Slack message to ${config.channelId}: ${message}`);
    // In real impl: await this.slackClient.chat.postMessage({ channel: config.channelId, text: message });
  }

  async sendEmailNotification(
    config: { recipientEmail: string; subject?: string },
    message: string
  ) {
    await this.emailService.sendEmail({
      to: config.recipientEmail,
      subject: config.subject || 'Workflow Notification',
      text: message,
    });
  }

  async sendWebhookNotification(
    config: { url: string; method?: string; headers?: Record<string, string> },
    message: string
  ) {
    await axios({
      method: config.method || 'POST',
      url: config.url,
      headers: config.headers,
      data: { message },
    });
  }

  async getUserNotifications(userId: string) {
    return db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const [updated] = await db
      .update(notifications)
      .set({ read: true, updatedAt: new Date() } as any)
      .where(eq(notifications.id, notificationId))
      .returning();

    return updated;
  }
}
