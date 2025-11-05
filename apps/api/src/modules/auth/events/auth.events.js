import { BaseEvent } from '../../events/event-bus.service';
/**
 * Event emitted when a user logs in
 */
export class UserLoginEvent extends BaseEvent {
    user;
    constructor(user) {
        super();
        this.user = user;
    }
}
/**
 * Event emitted when a user logs out
 */
export class UserLogoutEvent extends BaseEvent {
    userId;
    constructor(userId) {
        super();
        this.userId = userId;
    }
}
/**
 * Event emitted when a user registers
 */
export class UserRegisteredEvent extends BaseEvent {
    user;
    constructor(user) {
        super();
        this.user = user;
    }
}
/**
 * Event emitted when a user's password is reset
 */
export class PasswordResetEvent extends BaseEvent {
    userId;
    constructor(userId) {
        super();
        this.userId = userId;
    }
}
//# sourceMappingURL=auth.events.js.map