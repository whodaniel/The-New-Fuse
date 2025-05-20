import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '../utils/logger.js';
import { AgentCardService } from '../services/AgentCardService.js';

export interface A2AMessageContent {
  task?: string;
  parameters?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  [key: string]: unknown;
}

export interface A2AMessage {
  header: {
    id: string;
    type: string;
    version: string;
    priority: 'low' | 'medium' | 'high';
    source: string;
    target?: string;
  };
  body: {
    content: A2AMessageContent;
    metadata: {
      sent_at: number;
      timeout?: number;
      retries?: number;
      trace_id?: string;
    };
  };
}

@Injectable()
export class A2AProtocolHandler {
  private logger = new Logger(A2AProtocolHandler.name);
  private messageHandlers = new Map<string, (message: A2AMessage) => Promise<void>>();

  constructor(
    private eventEmitter: EventEmitter2,
    private agentCardService: AgentCardService
  ) {}

  async handleMessage(message: A2AMessage): Promise<void> {
    try {
      // Validate message format
      this.validateMessage(message);

      // Check if target agent exists
      if (message.header.target) {
        const targetAgent = this.agentCardService.getAgentById(message.header.target);
        if (!targetAgent) {
          throw new Error(`Target agent ${message.header.target} not found`);
        }
      }

      // Get handler for message type
      const handler = this.messageHandlers.get(message.header.type);
      if (!handler) {
        throw new Error(`No handler registered for message type ${message.header.type}`);
      }

      // Handle message
      await handler(message);

      // Emit event for message handled
      this.eventEmitter.emit('a2a.message.handled', message);
    } catch (error) {
      this.logger.error('Failed to handle A2A message', error);
      throw error;
    }
  }

  registerHandler(type: string, handler: (message: A2AMessage) => Promise<void>): void {
    this.messageHandlers.set(type, handler);
    this.logger.debug(`Registered handler for message type ${type}`);
  }

  private validateMessage(message: A2AMessage): void {
    if (!message.header?.id || !message.header?.type || !message.header?.version) {
      throw new Error('Invalid message format: missing required header fields');
    }
    if (!message.body?.content || !message.body?.metadata?.sent_at) {
      throw new Error('Invalid message format: missing required body fields');
    }
  }
}