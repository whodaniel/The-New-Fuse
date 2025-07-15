import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { EventBus } from '../events/event-bus.service';
import { LoggingService } from '../services/logging.service';
import { EmailService } from '../services/email.service';
import { NotificationSentEvent } from './events/notification.events';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(
    private usersService: UsersService,
    private eventBus: EventBus,
    private logger: LoggingService,
    private emailService: EmailService,
    private prisma: PrismaService
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
      await this.emailService.sendNotificationEmail(user.email, type, data);
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