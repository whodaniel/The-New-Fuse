import { UsersService } from '../users/users.service';
import { EventBus } from '../events/event-bus.service';
import { LoggingService } from '../services/logging.service';
import { EmailService } from '../services/email.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationService {
    private usersService;
    private eventBus;
    private logger;
    private emailService;
    private prisma;
    constructor(usersService: UsersService, eventBus: EventBus, logger: LoggingService, emailService: EmailService, prisma: PrismaService);
    sendNotification(userId: string, type: string, title: string, message: string): Promise<void>;
    getUserNotifications(userId: string): Promise<any>;
    markAsRead(userId: string, notificationId: string): Promise<any>;
}
//# sourceMappingURL=notification.service.d.ts.map