import { EventEmitter2 } from '@nestjs/event-emitter';
/**
 * Base class for all events in the system
 */
export declare abstract class BaseEvent {
    readonly timestamp: Date;
    constructor(timestamp?: Date);
}
/**
 * Event bus service for publishing and subscribing to events
 */
export declare class EventBus {
    private eventEmitter;
    constructor(eventEmitter: EventEmitter2);
    /** Publish an event */
    publish<T extends BaseEvent>(event: T): Promise<void>;
    /** Subscribe to an event */
    on<T extends BaseEvent>(eventName: string, handler: (event: T) => void): void;
    /** Unsubscribe from an event */
    off<T extends BaseEvent>(eventName: string, handler: (event: T) => void): void;
}
//# sourceMappingURL=event-bus.service.d.ts.map