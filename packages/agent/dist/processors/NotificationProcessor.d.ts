import { BaseProcessor } from './BaseProcessor';
import { Logger } from '../types/core';
import { Message, UUID } from '@the-new-fuse/types';
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
    /**
     * Processes an incoming message, expecting it to be a notification.
     * @param message The incoming message.
     * @returns A Promise resolving to void or null if the message is not a notification.
     */
    process(message: Message): Promise<void | null>;
}
//# sourceMappingURL=NotificationProcessor.d.ts.map