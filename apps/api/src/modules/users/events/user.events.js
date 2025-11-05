import { BaseEvent } from '../../../../../../src/events/event-bus.service';
// Event triggered when a user is created
export class UserCreatedEvent extends BaseEvent {
    user;
    constructor(user) {
        super();
        this.user = user;
    }
}
// Event triggered when a user is updated
export class UserUpdatedEvent extends BaseEvent {
    user;
    constructor(user) {
        super();
        this.user = user;
    }
}
// Event triggered when a user is deleted
export class UserDeletedEvent extends BaseEvent {
    userId;
    constructor(userId) {
        super();
        this.userId = userId;
    }
}
//# sourceMappingURL=user.events.js.map