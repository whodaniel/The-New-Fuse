export declare class CommandProcessor {
  private readonly eventEmitter;
  private readonly logger;
  constructor(eventEmitter: EventEmitter2);
  process(message: AgentMessage): Promise<void>;
  private executeCommand;
}
