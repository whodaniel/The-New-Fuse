import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { EventBus } from '../events/event-bus.service.js';
import { LoggingService } from '../services/logging.service.js';
import { EmailService } from '../services/email.service.js';
import { NotificationSentEvent } from './events/notification.events.js';

@Injectable()
export class NotificationService {
  constructor(
    private usersService: UsersService,
    private eventBus: EventBus,
    private logger: LoggingService,
    private emailService: EmailService
  ) {}

  async sendNotification(userId: string, type: string, data: any) {
    const user = await this.usersService.findOne(userId);
    
    await this.prisma.notification.create({
      data: {
        userId: user.id,
        type,
        data,
        read: false
      }
    });

    if (user.emailNotifications) {
      await this.emailService.sendEmail(user.email, type, data);
    }

    await this.eventBus.publish(new NotificationSentEvent(user, type, data));
    this.logger.info(`Notification sent to user ${userId}: ${type}`);
  }

  async getUserNotifications(userId: string) {
    await this.usersService.findOne(userId); // Verify user exists
    
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId, userId },
      data: { read: true }
    });
  }
}