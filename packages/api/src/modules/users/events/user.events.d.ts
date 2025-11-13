import { BaseEvent } from '../../events/event-bus.service';
export declare class UserCreatedEvent implements BaseEvent {
    id: string;
    type: string;
    timestamp: Date;
    data: {
        userId: string;
        email: string;
    };
    constructor(userId: string, email: string);
    private generateId;
}
export declare class UserUpdatedEvent implements BaseEvent {
    id: string;
    type: string;
    timestamp: Date;
    data: {
        userId: string;
        email: string;
        changes: Record<string, any>;
    };
    constructor(userId: string, email: string, changes: Record<string, any>);
    private generateId;
}
//# sourceMappingURL=user.events.d.ts.map