export class NotificationSentEvent {
  constructor(
    public readonly userId: string,
    public readonly type: string,
    public readonly data: any,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class NotificationReadEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class NotificationDeletedEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly timestamp: Date = new Date()
  ) {}
}
