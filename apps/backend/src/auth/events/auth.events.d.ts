import { BaseEvent } from '../../events/event-bus.service';
/**
 * Event emitted when a user logs in
 */
export declare class UserLoginEvent extends BaseEvent {
    readonly user: any;
    constructor(user: any);
}
/**
 * Event emitted when a user logs out
 */
export declare class UserLogoutEvent extends BaseEvent {
    readonly userId: string;
    constructor(userId: string);
}
/**
 * Event emitted when a user registers
 */
export declare class UserRegisteredEvent extends BaseEvent {
    readonly user: any;
    constructor(user: any);
}
/**
 * Event emitted when a user's password is reset
 */
export declare class PasswordResetEvent extends BaseEvent {
    readonly userId: string;
    constructor(userId: string);
}
//# sourceMappingURL=auth.events.d.ts.map