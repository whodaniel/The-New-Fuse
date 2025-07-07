"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDeletedEvent = exports.UserUpdatedEvent = exports.UserCreatedEvent = void 0;
const event_bus_service_1 = require("../../events/event-bus.service");
// Event triggered when a user is created
class UserCreatedEvent extends event_bus_service_1.BaseEvent {
    user;
    constructor(user) {
        super();
        this.user = user;
    }
}
exports.UserCreatedEvent = UserCreatedEvent;
// Event triggered when a user is updated
class UserUpdatedEvent extends event_bus_service_1.BaseEvent {
    user;
    constructor(user) {
        super();
        this.user = user;
    }
}
exports.UserUpdatedEvent = UserUpdatedEvent;
// Event triggered when a user is deleted
class UserDeletedEvent extends event_bus_service_1.BaseEvent {
    userId;
    constructor(userId) {
        super();
        this.userId = userId;
    }
}
exports.UserDeletedEvent = UserDeletedEvent;
