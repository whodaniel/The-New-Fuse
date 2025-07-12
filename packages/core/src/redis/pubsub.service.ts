import { Injectable } from '@nestjs/common';

export interface PubSubCallback {
  (message: string, channel: string): void;
}

@Injectable()
export class PubSubService {
  private subscriptions: Map<string, Set<PubSubCallback>> = new Map();

  async subscribe(channel: string, callback: PubSubCallback): Promise<void> {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(callback);
  }

  async unsubscribe(channel: string, callback: PubSubCallback): Promise<void> {
    const callbacks = this.subscriptions.get(channel);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscriptions.delete(channel);
      }
    }
  }

  async publish(channel: string, message: string): Promise<void> {
    const callbacks = this.subscriptions.get(channel);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message, channel);
        } catch (error) {
          console.error(`Error in pubsub callback for channel ${channel}:`, error);
        }
      });
    }
  }

  async unsubscribeAll(channel: string): Promise<void> {
    this.subscriptions.delete(channel);
  }
}