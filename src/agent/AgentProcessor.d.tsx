import { AgentProcessorConfig } from './config/AgentProcessorConfig.js';
import { TaskProcessor } from './processors/TaskProcessor.js';
interface ProcessingOptions {
  timeout?: number;
  retryAttempts?: number;
  priority?: AgentMessage["priority"];
}
export declare class AgentProcessor {
  private readonly eventEmitter;
  private readonly cacheService;
  private readonly errorRecovery;
  private readonly config;
  private readonly taskProcessor;
  private readonly logger;
  private readonly processingQueue;
  private isProcessing;
  constructor(
    eventEmitter: EventEmitter2,
    cacheService: CacheService,
    errorRecovery: ErrorRecoveryService,
    config: AgentProcessorConfig,
    taskProcessor: TaskProcessor,
  );
  processMessage(
    message: AgentMessage,
    options?: ProcessingOptions,
  ): Promise<void>;
  private validateMessage;
  private isValidMessageType;
  private enqueueMessage;
  private startProcessing;
  private processWithRetry;
  private executeProcessing;
  private handleProcessingError;
  private processTask;
  private processNotification;
  private processCommand;
}
export {};
