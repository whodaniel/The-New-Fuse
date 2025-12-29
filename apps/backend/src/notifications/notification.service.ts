import { Injectable } from '@nestjs/common';
import { db, desc, eq, notifications } from '@the-new-fuse/database';
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
      .set({ read: true, updatedAt: new Date() })
      .where(eq(notifications.id, notificationId))
      .returning();

    return updated;
  }
}
