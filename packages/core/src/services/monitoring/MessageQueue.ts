import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MessageQueue {
  private readonly logger = new Logger(MessageQueue.name);
  private queue: any[] = [];

  constructor(private eventEmitter: EventEmitter2) {}

  async enqueue(message: any): Promise<void> {
    this.queue.push(message);
    this.eventEmitter.emit('message.queued', message);
  }

  async dequeue(): Promise<any> {
    const message = this.queue.shift();
    if (message) {
      this.eventEmitter.emit('message.dequeued', message);
    }
    return message;
  }

  async peek(): Promise<any> {
    return this.queue[0] || null;
  }

  async size(): Promise<number> {
    return this.queue.length;
  }

  async clear(): Promise<void> {
    this.queue = [];
    this.eventEmitter.emit('queue.cleared');
  }

  async isEmpty(): Promise<boolean> {
    return this.queue.length === 0;
  }

  async getStats(): Promise<any> {
    return {
      size: this.queue.length,
      processed: 0,
      failed: 0,
    };
  }
}
