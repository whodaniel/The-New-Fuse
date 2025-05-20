import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  AgentMessage,
  AgentMessageType,
  AgentErrorContext,
} from '../types/agent.types.js';
import { CacheService } from '../cache/CacheService.js';
import { ErrorRecoveryService } from '../error/ErrorRecoveryService.js';
import { AgentProcessorConfig } from './config/AgentProcessorConfig.js';
import { TaskProcessor } from './processors/TaskProcessor.js';

interface ProcessingOptions {
  timeout?: number;
  retryAttempts?: number;
  priority?: AgentMessage["priority"];
}

interface ProcessingError {
  error: string;
  messageId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AgentProcessor {
  private readonly logger = new Logger(AgentProcessor.name);
  private readonly processingQueue = new Map<string, AgentMessage>();
  private isProcessing = false;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheService: CacheService,
    private readonly errorRecovery: ErrorRecoveryService,
    private readonly config: AgentProcessorConfig,
    private readonly taskProcessor: TaskProcessor,
  ) {}

  async processMessage(
    message: AgentMessage,
    options: ProcessingOptions = {},
  ): Promise<void> {
    try {
      const timeout = options.timeout ?? this.config.defaultTimeout;
      const retryAttempts = options.retryAttempts ?? this.config.maxRetryAttempts;

      await this.validateMessage(message);
      await this.queueMessage(message);
      await this.startProcessing(timeout, retryAttempts);
    } catch (error) {
      await this.handleProcessingError(error as Error, message);
    }
  }

  private async validateMessage(message: AgentMessage): Promise<void> {
    if (!message.id || !message.type || !message.timestamp) {
      throw new Error("Invalid message format: missing required fields");
    }

    if (!this.isValidMessageType(message.type)) {
      throw new Error(`Invalid message type: ${message.type}`);
    }

    const exists = await this.cacheService.get(`processed:${message.id}`, "agent");
    if (exists) {
      throw new Error(`Message ${message.id} has already been processed`);
    }
  }

  private isValidMessageType(type: string): type is AgentMessageType {
    return ["task", "notification", "command"].includes(type);
  }

  private async queueMessage(message: AgentMessage): Promise<void> {
    this.processingQueue.set(message.id, message);
    await this.cacheService.set(`queued:${message.id}`, message, {
      namespace: "agent",
      ttl: this.config.queueTtl,
    });
  }

  private async startProcessing(
    timeout: number,
    retryAttempts: number,
  ): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.processingQueue.size > 0) {
        const [messageId, message] = Array.from(this.processingQueue.entries())[0];
        await this.processWithRetry(message, retryAttempts);
        this.processingQueue.delete(messageId);
        await this.cacheService.set(`processed:${messageId}`, true, {
          namespace: "agent",
          ttl: 86400,
        });
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processWithRetry(
    message: AgentMessage,
    retryAttempts: number,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        await this.executeProcessing(message);
        return;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Processing attempt ${attempt} failed for message ${message.id}: ${lastError.message}`,
        );
      }
    }

    if (lastError) {
      throw lastError;
    }
  }

  private async executeProcessing(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case "task":
        await this.taskProcessor.process(message);
        break;
      case "notification":
        await this.processNotification(message);
        break;
      case "command":
        await this.processCommand(message);
        break;
      default:
        throw new Error(`Unsupported message type: ${message.type}`);
    }
  }

  private async handleProcessingError(
    error: Error,
    message: AgentMessage,
  ): Promise<void> {
    const errorContext: AgentErrorContext = {
      messageId: message.id,
      messageType: message.type,
      timestamp: new Date().toISOString(),
      metadata: message.metadata,
    };

    await this.errorRecovery.handleError({ error, context: errorContext });

    const processingError: ProcessingError = {
      error: error.message,
      messageId: message.id,
      timestamp: new Date().toISOString(),
      metadata: message.metadata,
    };

    this.eventEmitter.emit("agent.processing.error", processingError);
  }

  private async processNotification(message: AgentMessage): Promise<void> {
    // Implementation details for notification processing
    this.eventEmitter.emit("agent.notification.processed", message);
  }

  private async processCommand(message: AgentMessage): Promise<void> {
    // Implementation details for command processing
    this.eventEmitter.emit("agent.command.processed", message);
  }
}
