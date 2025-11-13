/**
 * Entity Event Store
 * Handles event sourcing for unified entities
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
export interface EntityEvent {
    id: string;
    entityId: string;
    type: string;
    data: any;
    timestamp: Date;
    version: number;
}
export declare class EntityEventStore {
    private eventEmitter;
    private readonly logger;
    private events;
    constructor(eventEmitter: EventEmitter2);
    saveEvent(event: EntityEvent): Promise<void>;
}
//# sourceMappingURL=EntityEventStore.d.ts.map