export class NotificationSentEvent {
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
export class NotificationReadEvent {
    notificationId;
    userId;
    timestamp;
    constructor(notificationId, userId, timestamp = new Date()) {
        this.notificationId = notificationId;
        this.userId = userId;
        this.timestamp = timestamp;
    }
}
export class NotificationDeletedEvent {
    notificationId;
    userId;
    timestamp;
    constructor(notificationId, userId, timestamp = new Date()) {
        this.notificationId = notificationId;
        this.userId = userId;
        this.timestamp = timestamp;
    }
}
//# sourceMappingURL=notification.events.js.map