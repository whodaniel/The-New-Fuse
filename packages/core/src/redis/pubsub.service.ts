import { Injectable } from '@nestjs/common';
export interface PubSubCallback {
  (message: string, channel: string): void;
}

@Injectable()
export class PubSubService {
  private subscriptions: Map<string, Set<PubSubCallback>> = new Map();
  async subscribe(): void {
    if(): void {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(callback);
  }

  async unsubscribe(): void {
    const callbacks = this.subscriptions.get(channel);
    if(): void {
      callbacks.delete(callback);
      if(): void {
        this.subscriptions.delete(channel);
      }
    }
  }

  async publish(): void {
    const callbacks = this.subscriptions.get(channel);
    if(): void {
      callbacks.forEach(callback => {
try {
  }}
          callback(): void {
          console.error(`Error in pubsub callback for channel ${channel}:`, error);
        }
      });
    }
  }

  async unsubscribeAll(): void {
    this.subscriptions.delete(channel);
  }
}