import { injectable } from 'inversify';
import { Logger } from '@the-new-fuse/utils/logger';

export type EventHandler = (data: unknown) => void | Promise<void>;

@injectable()
export class EventBus {
  private eventHandlers: Map<string, Set<EventHandler>>;
  private logger: Logger;

  constructor() {
    this.eventHandlers = new Map();
    this.logger.info('Initializing event bus');
  }

  on(eventName: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    this.eventHandlers.get(eventName)?.add(handler);
    this.logger.debug('Registered event handler', { eventName });
  }

  off(eventName: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventName);
      }
      this.logger.debug('Removed event handler', { eventName });
    }
  }

  async emit(eventName: string, data: unknown): Promise<void> {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      this.logger.debug('Emitting event', { eventName, data });
      const promises = Array.from(handlers).map(handler => {
        try {
          return Promise.resolve(handler(data));
        } catch (error) {
          this.logger.error('Error in event handler', { eventName, error });
        }
      });
      await Promise.all(promises);
    }
  }

  removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.eventHandlers.delete(eventName);
      this.logger.debug('Removed all listeners for event', { eventName });
    } else {
      this.eventHandlers.clear();
      this.logger.debug('Removed all listeners for all events');
    }
  }

  listenerCount(eventName: string): number {
    return this.eventHandlers.get(eventName)?.size || 0;
  }

  subscribeWithRetry(eventType: string, handler: EventHandler, maxRetries = 3): void {
    const wrappedHandler = async (data: unknown) => {
      let attempts = 0;
      while (attempts < maxRetries) {
        try {
          await handler(data);
          return;
        } catch (error) {
          attempts++;
          if (attempts === maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      }
    };
    this.on(eventType, wrappedHandler);
  }
}
