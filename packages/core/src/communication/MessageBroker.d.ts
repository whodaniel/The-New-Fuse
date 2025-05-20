import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
export declare class MessageBroker extends EventEmitter implements OnModuleInit, OnModuleDestroy {
    private publisher;
    private subscriber;
    private logger;
    private protocol;
    private subscriptions;
    private readonly HIGH_PRIORITY_PREFIX;
    private readonly PERSIST_PREFIX;
    constructor();
}
