export declare class NotificationProcessor {
  private readonly eventEmitter;
  private readonly logger;
  constructor(eventEmitter: EventEmitter2);
  process(message: AgentMessage): Promise<void>;
  private handleNotification;
}
