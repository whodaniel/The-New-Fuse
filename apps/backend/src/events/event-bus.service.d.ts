export declare class BaseEvent {
    readonly timestamp: Date;
    constructor(timestamp?: Date);
}
type EventHandler = (event: BaseEvent) => void | Promise<void>;
export declare class EventBus {
    private handlers;
    subscribe(eventName: string, handler: EventHandler): void;
    unsubscribe(eventName: string, handler: EventHandler): void;
    publish(event: BaseEvent): Promise<void>;
}
export {};
