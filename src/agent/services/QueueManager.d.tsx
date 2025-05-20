import { AgentProcessorConfig } from '../config/AgentProcessorConfig.js';
export declare class QueueManager {
  private readonly cacheService;
  private readonly config;
  private readonly logger;
  private readonly queue;
  constructor(cacheService: CacheService, config: AgentProcessorConfig);
  enqueue(message: AgentMessage): Promise<void>;
  dequeue(): Promise<AgentMessage | undefined>;
  markProcessed(messageId: string): Promise<void>;
  isProcessed(messageId: string): Promise<boolean>;
  get size(): number;
}
