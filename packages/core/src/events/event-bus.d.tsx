export type EventHandler = (data: unknown) => void | Promise<void>;
export declare class EventBus {
    private eventHandlers;
    private logger;
    constructor();
    off(eventName: string, handler: EventHandler): void;
    emit(eventName: any, this: any, eventHandlers: any, get: any): any;
}
