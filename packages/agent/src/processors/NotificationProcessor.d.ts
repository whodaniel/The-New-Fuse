import { BaseProcessor } from './BaseProcessor';
import { Logger } from '@nestjs/common';
import { Notification, UUID } from '@the-new-fuse/types';
import { AlertService } from '../services/AlertService';
/**
 * Processes incoming notification messages for an agent.
 * Notifications are typically informational and may trigger alerts or UI updates.
 */
export declare class NotificationProcessor extends BaseProcessor {
    protected logger: Logger;
    private alertService;
    private agentId;
    constructor(agentId: UUID, alertService: AlertService);
    const notification: Notification;
    if(: any, notification: any, level: any): any;
}
//# sourceMappingURL=NotificationProcessor.d.ts.map