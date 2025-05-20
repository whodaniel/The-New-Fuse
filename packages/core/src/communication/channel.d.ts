import { RedisManager } from '../redis_manager.js';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class ChannelManager {
    private readonly redisManager;
    private readonly configService;
    private readonly eventEmitter;
    private readonly channels;
    private readonly subscriptions;
    private readonly options;
    private readonly logger;
    ';: any;
    constructor(redisManager: RedisManager, configService: ConfigService, eventEmitter: EventEmitter2);
    if(type: any): any;
}
