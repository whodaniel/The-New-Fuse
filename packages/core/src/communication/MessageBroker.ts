import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface Message {
  id: string;
  topic: string;
  payload: any;
  timestamp: Date;
}

export interface MessageHandler {
  topic: string;
  handle(message: Message): Promise<void>;
}

@Injectable()
export class MessageBroker {
  private handlers: Map<string, MessageHandler[]> = new Map();
  private messageQueue: Message[] = [];

  constructor(private eventEmitter: EventEmitter2) {}

  async publish(topic: string, payload: any): Promise<void> {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topic,
      payload,
      timestamp: new Date(),
    };

    this.messageQueue.push(message);
    await this.processMessage(message);
  }

  async subscribe(topic: string, handler: MessageHandler): Promise<void> {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, []);
    }
    
    const handlers = this.handlers.get(topic)!;
    handlers.push(handler);
  }

  async unsubscribe(topic: string, handler: MessageHandler): Promise<void> {
    const handlers = this.handlers.get(topic);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private async processMessage(message: Message): Promise<void> {
    const handlers = this.handlers.get(message.topic) || [];
    
    for (const handler of handlers) {
      try {
        await handler.handle(message);
      } catch (error) {
        this.eventEmitter.emit('message.error', {
          message,
          error: error.message,
        });
      }
    }
  }

  async getMessageHistory(topic?: string): Promise<Message[]> {
    if (topic) {
      return this.messageQueue.filter(msg => msg.topic === topic);
    }
    return [...this.messageQueue];
  }

  async clearMessages(): Promise<void> {
    this.messageQueue = [];
  }
}