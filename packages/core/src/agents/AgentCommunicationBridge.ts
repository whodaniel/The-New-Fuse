import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface AgentMessage {
  id: string;
  sender: string;
  recipient: string;
  content: unknown;
  metadata?: Record<string, unknown>;
  timestamp: string;
  type: 'direct' | 'broadcast' | 'task_request' | 'task_response' | 'status_update' | 'error';
  priority: 'low' | 'medium' | 'high';
}

interface MessageValidator {
  validate(message: AgentMessage): Promise<boolean>;
}

@Injectable()
export class AgentCommunicationBridge {
  private readonly channels = new Map<string, Subject<AgentMessage>>();
  private readonly logger = new Logger(AgentCommunicationBridge.name);
  private readonly messageQueue = new Map<string, AgentMessage[]>();
  private circuitBreaker?: any; // CircuitBreaker type

  constructor() {
    this.logger.log('AgentCommunicationBridge initialized');
  }

  async sendMessage(message: AgentMessage): Promise<void> {
    try {
      this.logger.debug(`Sending message from ${message.sender} to ${message.recipient}`);

      // Get or create channel for recipient
      const channel = this.getOrCreateChannel(message.recipient);

      // Add timestamp if not provided
      if (!message.timestamp) {
        message.timestamp = new Date().toISOString();
      }

      // Emit message to channel
      channel.next(message);

      this.logger.debug(`Message sent successfully: ${message.id}`);
    } catch (error) {
      this.logger.error(`Failed to send message: ${message.id}`, error);
      throw error;
    }
  }

  subscribeToMessages(agentId: string): Observable<AgentMessage> {
    const channel = this.getOrCreateChannel(agentId);
    this.logger.debug(`Agent ${agentId} subscribed to messages`);
    return channel.asObservable();
  }

  async sendDirectMessage(message: AgentMessage): Promise<void> {
    return this.sendMessage(message);
  }

  async broadcastMessage(message: Omit<AgentMessage, 'recipient'>): Promise<void> {
    const broadcastMessage: AgentMessage = {
      ...message,
      recipient: 'all',
      type: 'broadcast',
    };

    return this.sendMessage(broadcastMessage);
  }

  async validateMessage(message: AgentMessage): Promise<boolean> {
    // Basic validation
    if (!message.id || !message.sender || !message.recipient) {
      return false;
    }

    if (
      !message.type ||
      !['direct', 'broadcast', 'task_request', 'task_response', 'status_update', 'error'].includes(
        message.type,
      )
    ) {
      return false;
    }

    if (!message.priority || !['low', 'medium', 'high'].includes(message.priority)) {
      return false;
    }

    return true;
  }

  private getOrCreateChannel(agentId: string): Subject<AgentMessage> {
    if (!this.channels.has(agentId)) {
      this.channels.set(agentId, new Subject<AgentMessage>());
      this.logger.debug(`Created new channel for agent: ${agentId}`);
    }

    return this.channels.get(agentId)!;
  }

  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  closeChannel(agentId: string): void {
    const channel = this.channels.get(agentId);
    if (channel) {
      channel.complete();
      this.channels.delete(agentId);
      this.logger.debug(`Closed channel for agent: ${agentId}`);
    }
  }

  async shutdown(): Promise<void> {
    this.logger.log('Shutting down AgentCommunicationBridge...');

    // Close all channels
    for (const [agentId, channel] of this.channels) {
      channel.complete();
      this.logger.debug(`Closed channel for agent: ${agentId}`);
    }

    this.channels.clear();
    this.logger.log('AgentCommunicationBridge shutdown complete');
  }
}
