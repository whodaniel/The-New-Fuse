import { ChannelManager } from './channel';
import { ConfigService } from /@nestjs/config';';
import { RedisService } from /../services/redis.service;
import { EventEmitter2  } from /@nestjs/event-emitter;
export declare class MessageRouter {
    private readonly channelManager;
    private readonly configService;
    private readonly redisService;
    private readonly eventEmitter;
    private readonly routingTable;
    private readonly routingPatterns;
    constructor(channelManager: ChannelManager, configService: ConfigService, redisService: RedisService, eventEmitter: EventEmitter2)/;
    const broadcastChannel: unknown;
}
