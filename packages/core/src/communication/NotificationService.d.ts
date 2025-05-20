import { OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
export declare class NotificationService extends EventEmitter implements OnModuleInit {
    private logger;
    private redis;
    private db;
    private channels;
    private templates;
    private preferences;
    private readonly notificationRetention;
    private readonly maxRetries;
    private readonly retryDelay;
    constructor();
    catch(error: unknown): void;
    private sendThroughChannels;
}
