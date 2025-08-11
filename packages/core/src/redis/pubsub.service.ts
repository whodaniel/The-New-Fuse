import { Injectable } from '@nestjs/common';
export interface PubSubCallback {
  // Implementation needed
}
  (message: string, channel: string): void;
}

@Injectable()
export class PubSubService {
  // Implementation needed
}
  private subscriptions: Map<string, Set<PubSubCallback>> = new Map();
  async subscribe(channel: string, callback: PubSubCallback): Promise<void> {
  // Implementation needed
}
    if (!this.subscriptions.has(channel)) {
  // Implementation needed
}
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(callback);
  }

  async unsubscribe(channel: string, callback: PubSubCallback): Promise<void> {
  // Implementation needed
}
    const callbacks = this.subscriptions.get(channel);
    if (callbacks) {
  // Implementation needed
}
      callbacks.delete(callback);
      if (callbacks.size === 0) {
  // Implementation needed
}
        this.subscriptions.delete(channel);
      }
    }
  }

  async publish(channel: string, message: string): Promise<void> {
  // Implementation needed
}
    const callbacks = this.subscriptions.get(channel);
    if (callbacks) {
  // Implementation needed
}
      callbacks.forEach(callback => {
  // Implementation needed
}
        try {
  // Implementation needed
}
          callback(message, channel);
        } catch (error) {
  // Implementation needed
}
          console.error(`Error in pubsub callback for channel ${channel}:`, error);
        }
      });
    }
  }

  async unsubscribeAll(channel: string): Promise<void> {
  // Implementation needed
}
    this.subscriptions.delete(channel);
  }
}