import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service.js';

@Injectable()
export class PubSubService {
  private readonly subscribers: Map<string, Set<(message: any) => void>> = new Map();

  constructor(private readonly redis: RedisService) {}

  async publish(channel: string, message: any): Promise<void> {
    await this.redis.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
      await this.redis.subscribe(channel, (message) => {
        const callbacks = this.subscribers.get(channel);
        if (callbacks) {
          callbacks.forEach(cb => {
            try {
              const parsedMessage = JSON.parse(message);
              cb(parsedMessage);
            } catch {
              cb(message);
            }
          });
        }
      });
    }
    
    this.subscribers.get(channel)?.add(callback);
  }

  async unsubscribe(channel: string, callback: (message: any) => void): Promise<void> {
    this.subscribers.get(channel)?.delete(callback);
  }
}