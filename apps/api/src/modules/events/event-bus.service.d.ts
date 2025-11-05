export interface BaseEvent {
    id: string;
    type: string;
    timestamp: Date;
    data: any;
}
export declare class EventBus {
    private eventEmitter;
    private logger;
    /**
     * Publish an event to all subscribers
     */
    publish(event: BaseEvent): Promise<void>;
    /**
     * Subscribe to events of a specific type
     */
    subscribe(eventType: string, handler: (event: BaseEvent) => void): void;
    /**
     * Subscribe to all events
     */
    subscribeAll(handler: (event: BaseEvent) => void): void;
    /**
     * Unsubscribe from events of a specific type
     */
    unsubscribe(eventType: string, handler: (event: BaseEvent) => void): void;
    /**
     * Unsubscribe from all events
     */
    unsubscribeAll(handler: (event: BaseEvent) => void): void;
    /**
     * Get all registered event types
     */
    getEventTypes(): string[];
    /**
     * Clear all subscriptions
     */
    clear(): void;
}
//# sourceMappingURL=event-bus.service.d.ts.map