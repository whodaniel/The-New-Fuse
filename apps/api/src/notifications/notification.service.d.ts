import { UsersService } from '../modules/users/users.service';
import { EventBus } from '../events/event-bus.service';
import { LoggingService } from '../services/logging.service';
import { PrismaService } from '@the-new-fuse/database';
export declare class NotificationService {
    private usersService;
    private eventBus;
    private logger;
    private prisma;
    constructor(usersService: UsersService, eventBus: EventBus, logger: LoggingService, prisma: PrismaService);
    sendNotification(userId: string, type: string, title: string, message: string): Promise<void>;
    getUserNotifications(userId: string): Promise<any>;
    markAsRead(userId: string, notificationId: string): Promise<any>;
}
//# sourceMappingURL=notification.service.d.ts.map