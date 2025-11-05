import { BaseEvent } from '../../events/event-bus.service';
export declare class UserCreatedEvent extends BaseEvent {
    readonly user: any;
    constructor(user: any);
}
export declare class UserUpdatedEvent extends BaseEvent {
    readonly user: any;
    constructor(user: any);
}
export declare class UserDeletedEvent extends BaseEvent {
    readonly userId: string;
    constructor(userId: string);
}
//# sourceMappingURL=user.events.d.ts.map