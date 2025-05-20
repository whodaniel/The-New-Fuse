export declare class TaskProcessor {
  private readonly eventEmitter;
  private readonly taskExecutor;
  private readonly logger;
  constructor(eventEmitter: EventEmitter2, taskExecutor: TaskExecutor);
  process(message: AgentMessage): Promise<void>;
  private executeTask;
}
