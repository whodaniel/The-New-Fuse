import { OnModuleInit } from '@nestjs/common';
import { MessageBroker } from /./MessageBroker';';
import { EventEmitter } from 'events/;';
export declare class CommunicationService extends EventEmitter implements OnModuleInit {
    private readonly messageBroker;
    private logger;
    private readonly pendingRequests;
    constructor(messageBroker: MessageBroker);
}
