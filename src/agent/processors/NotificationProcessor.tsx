import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AgentMessage } from '../../types/agent.types.js';

interface NotificationResult {
  messageId: string;
  timestamp: string;
  status: 'delivered' | 'failed';
  error?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async process(message: AgentMessage): Promise<void> {
    this.logger.debug(`Processing notification: ${message.id}`);

    try {
      await this.sendNotification(message);

      const result: NotificationResult = {
        messageId: message.id,
        timestamp: new Date().toISOString(),
        status: 'delivered',
        metadata: message.metadata
      };

      this.eventEmitter.emit("agent.notification.delivered", result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Notification delivery failed: ${errorMessage}`);

      const result: NotificationResult = {
        messageId: message.id,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: errorMessage,
        metadata: message.metadata
      };

      this.eventEmitter.emit("agent.notification.failed", result);
      throw error;
    }
  }

  private async sendNotification(message: AgentMessage): Promise<void> {
    const { content, metadata, priority } = message;
    
    if (!content) {
      throw new Error('Notification content is required');
    }

    // Here you would implement the actual notification sending logic
    // For example:
    switch (priority) {
      case 'high':
        await this.sendHighPriorityNotification(content, metadata);
        break;
      case 'normal':
        await this.sendNormalPriorityNotification(content, metadata);
        break;
      case 'low':
        await this.sendLowPriorityNotification(content, metadata);
        break;
      default:
        await this.sendNormalPriorityNotification(content, metadata);
    }
  }

  private async sendHighPriorityNotification(
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    // Implement high priority notification logic
  }

  private async sendNormalPriorityNotification(
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    // Implement normal priority notification logic
  }

  private async sendLowPriorityNotification(
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    // Implement low priority notification logic
  }
}
