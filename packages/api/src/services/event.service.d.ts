/**
 * Event Service
 * Centralized event bus for application-wide events
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class EventService {
    private eventEmitter;
    private readonly logger;
    constructor(eventEmitter: EventEmitter2);
    /**
     * Emit an event
     * @param eventName Name of the event
     * @param payload Event data
     */
    emit(eventName: string, payload: any): void;
    /**
     * Subscribe to an event once
     * @param eventName Name of the event
     * @param listener Event handler function
     * @returns Unsubscribe function
     */
    subscribeOnce(eventName: string, listener: (payload: any) => void): () => void;
}
//# sourceMappingURL=event.service.d.ts.map