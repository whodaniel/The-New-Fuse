"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDeletedEvent = exports.NotificationReadEvent = exports.NotificationSentEvent = void 0;
class NotificationSentEvent {
    userId;
    type;
    data;
    timestamp;
    constructor(userId, type, data, timestamp = new Date()) {
        this.userId = userId;
        this.type = type;
        this.data = data;
        this.timestamp = timestamp;
    }
}
exports.NotificationSentEvent = NotificationSentEvent;
class NotificationReadEvent {
    notificationId;
    userId;
    timestamp;
    constructor(notificationId, userId, timestamp = new Date()) {
        this.notificationId = notificationId;
        this.userId = userId;
        this.timestamp = timestamp;
    }
}
exports.NotificationReadEvent = NotificationReadEvent;
class NotificationDeletedEvent {
    notificationId;
    userId;
    timestamp;
    constructor(notificationId, userId, timestamp = new Date()) {
        this.notificationId = notificationId;
        this.userId = userId;
        this.timestamp = timestamp;
    }
}
exports.NotificationDeletedEvent = NotificationDeletedEvent;
//# sourceMappingURL=notification.events.js.map