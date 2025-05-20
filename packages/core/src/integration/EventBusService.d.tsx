import { Logger } from '../logging/LoggingService.js';
import { RedisService } from '../redis/RedisService.js';
export interface EventMetadata {
    timestamp: number;
    source: string;
    correlationId?: string;
    userId?: string;
}
export interface Event<T = any> {
    type: string;
    payload: T;
    metadata: EventMetadata;
}
export type EventHandler<T = any> = (event: Event<T>) => Promise<void>;
export declare class EventBusService {
    private readonly redisService;
    private localEmitter;
    private handlers;
    private logger;
    constructor(redisService: RedisService, logger: Logger);
    private processEvent;
}
