export declare class NotificationSentEvent {
    readonly userId: string;
    readonly type: string;
    readonly data: any;
    readonly timestamp: Date;
    constructor(userId: string, type: string, data: any, timestamp?: Date);
}
export declare class NotificationReadEvent {
    readonly notificationId: string;
    readonly userId: string;
    readonly timestamp: Date;
    constructor(notificationId: string, userId: string, timestamp?: Date);
}
export declare class NotificationDeletedEvent {
    readonly notificationId: string;
    readonly userId: string;
    readonly timestamp: Date;
    constructor(notificationId: string, userId: string, timestamp?: Date);
}
//# sourceMappingURL=notification.events.d.ts.map