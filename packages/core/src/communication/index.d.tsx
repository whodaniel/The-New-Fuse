import { ChannelManager } from './channel.js';
import { MessageRouter } from './router.js';
import { MessageValidator } from './validator.js';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class CommunicationProtocol {
    private readonly channelManager;
    private readonly router;
    private readonly validator;
    private readonly configService;
    private readonly eventEmitter;
    constructor(channelManager: ChannelManager, router: MessageRouter, validator: MessageValidator, configService: ConfigService, eventEmitter: EventEmitter2);
    send(): Promise<void>;
}
