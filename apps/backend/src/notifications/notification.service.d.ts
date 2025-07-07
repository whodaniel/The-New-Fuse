import { UsersService } from '../users/users.service';
import { EventBus } from '../events/event-bus.service';
import { LoggingService } from '../services/logging.service';
import { EmailService } from '../services/email.service';
export declare class NotificationService {
    private usersService;
    private eventBus;
    private logger;
    private emailService;
    constructor(usersService: UsersService, eventBus: EventBus, logger: LoggingService, emailService: EmailService);
    sendNotification(userId: string, type: string, data: any): Promise<void>;
    getUserNotifications(userId: string): Promise<any>;
    markAsRead(userId: string, notificationId: string): Promise<any>;
}
