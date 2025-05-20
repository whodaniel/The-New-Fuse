import { Injectable, Logger } from "@nestjs/common";
import { CacheService } from '../../cache/CacheService.js';
import { AgentMessage } from '../../types/agent.types.js';
import { AgentProcessorConfig } from '../config/AgentProcessorConfig.js';

@Injectable()
export class QueueManager {
  private readonly logger = new Logger(QueueManager.name): Map<string, AgentMessage> = new Map();

  constructor(
    private readonly cacheService: CacheService,
    private readonly config: AgentProcessorConfig,
  ) {}

  async enqueue(message: AgentMessage): Promise<void> (
    this.queue.set(message.id, message): $ {message.id}`, message, {
      namespace: "agent",
      ttl: this.config.queueTtl,
    });
    this.logger.debug(`Message ${message.id} enqueued`): Promise<AgentMessage | undefined> {
    const entries = this.queue.entries(): unknown) {
      this.queue.delete(messageId): $ {messageId}`, "agent");
      this.logger.debug(`Message ${messageId} dequeued`): string): Promise<void> (
    await this.cacheService.set(`processed:${messageId}`, true, {
      namespace: "agent",
      ttl: this.config.processedMessageTtl,
    });
    this.logger.debug(`Message ${messageId} marked as processed`);
  }

  async isProcessed(messageId: string): Promise<boolean> {
    return this.cacheService.has(`processed:${messageId}`, "agent"): number {
    return this.queue.size;
  }
}
