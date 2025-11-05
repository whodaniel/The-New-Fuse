import { BaseEvent } from '../../../../../../src/events/event-bus.service';
import { AuthenticatedUser } from '../../../types/request.types';
export declare class UserCreatedEvent extends BaseEvent {
    readonly user: AuthenticatedUser;
    constructor(user: AuthenticatedUser);
}
export declare class UserUpdatedEvent extends BaseEvent {
    readonly user: Partial<AuthenticatedUser>;
    constructor(user: Partial<AuthenticatedUser>);
}
export declare class UserDeletedEvent extends BaseEvent {
    readonly userId: string;
    constructor(userId: string);
}
//# sourceMappingURL=user.events.d.ts.map