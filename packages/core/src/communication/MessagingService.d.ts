import { OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
export declare class MessagingService extends EventEmitter implements OnModuleInit {
    private logger;
    private redis;
    private db;
    private readonly messageRetention;
    private readonly maxRecipientsPerMessage;
    private readonly maxMessageLength;
    constructor();
}
