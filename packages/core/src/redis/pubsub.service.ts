import { Injectable } from '@nestjs/common';
export interface PubSubCallback {
  (message: string, channel: string): void;
}

@Injectable()
export class PubSubService {
  private subscriptions: Map<string, Set<PubSubCallback>> = new Map();
  async subscribe(): unknown {
    if(): unknown {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(callback);
  }

  async unsubscribe(): unknown {
    const callbacks = this.subscriptions.get(channel);
    if(): unknown {
      callbacks.delete(callback);
      if(): unknown {
        this.subscriptions.delete(channel);
      }
    }
  }

  async publish(): unknown {
    const callbacks = this.subscriptions.get(channel);
    if(): unknown {
      callbacks.forEach(callback => {
try {
  }}
          callback(): unknown {
          console.error(`Error in pubsub callback for channel ${channel}:`, error);
        }
      });
    }
  }

  async unsubscribeAll(): unknown {
    this.subscriptions.delete(channel);
  }
}