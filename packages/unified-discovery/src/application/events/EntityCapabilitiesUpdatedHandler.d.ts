/**
 * Entity Capabilities Updated Event Handler
 */
import { IEventHandler } from '@nestjs/cqrs';
export declare class EntityCapabilitiesUpdatedEvent {
    readonly entityId: string;
    readonly capabilities: any;
    readonly previousCapabilities?: any | undefined;
    constructor(entityId: string, capabilities: any, previousCapabilities?: any | undefined);
}
export declare class EntityCapabilitiesUpdatedHandler implements IEventHandler<EntityCapabilitiesUpdatedEvent> {
    private readonly logger;
    handle(event: EntityCapabilitiesUpdatedEvent): void;
}
//# sourceMappingURL=EntityCapabilitiesUpdatedHandler.d.ts.map