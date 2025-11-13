/**
 * Entity Discovered Event Handler
 */
import { IEventHandler } from '@nestjs/cqrs';
export declare class EntityDiscoveredEvent {
    readonly entityId: string;
    readonly entityType: string;
    readonly metadata: any;
    constructor(entityId: string, entityType: string, metadata: any);
}
export declare class EntityDiscoveredHandler implements IEventHandler<EntityDiscoveredEvent> {
    private readonly logger;
    handle(event: EntityDiscoveredEvent): void;
}
//# sourceMappingURL=EntityDiscoveredHandler.d.ts.map