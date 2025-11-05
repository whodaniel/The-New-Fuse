"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetEvent = exports.UserRegisteredEvent = exports.UserLogoutEvent = exports.UserLoginEvent = void 0;
const event_bus_service_1 = require("../../events/event-bus.service");
/**
 * Event emitted when a user logs in
 */
class UserLoginEvent extends event_bus_service_1.BaseEvent {
    user;
    constructor(user) {
        super();
        this.user = user;
    }
}
exports.UserLoginEvent = UserLoginEvent;
/**
 * Event emitted when a user logs out
 */
class UserLogoutEvent extends event_bus_service_1.BaseEvent {
    userId;
    constructor(userId) {
        super();
        this.userId = userId;
    }
}
exports.UserLogoutEvent = UserLogoutEvent;
/**
 * Event emitted when a user registers
 */
class UserRegisteredEvent extends event_bus_service_1.BaseEvent {
    user;
    constructor(user) {
        super();
        this.user = user;
    }
}
exports.UserRegisteredEvent = UserRegisteredEvent;
/**
 * Event emitted when a user's password is reset
 */
class PasswordResetEvent extends event_bus_service_1.BaseEvent {
    userId;
    constructor(userId) {
        super();
        this.userId = userId;
    }
}
exports.PasswordResetEvent = PasswordResetEvent;
//# sourceMappingURL=auth.events.js.map