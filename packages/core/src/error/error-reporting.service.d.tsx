import { Db } from 'mongodb';
import { NotificationService } from './notification.service.js';
export declare class ErrorReportingService {
    private readonly logger;
    Db: any;
    private readonly notificationService;
    constructor(db: Db, notificationService: NotificationService);
    reportError(): Promise<void>;
}
