import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

export interface EventData {
  type: string;
  payload: any;
  metadata?: {
    correlationId?: string;
    timestamp?: number;
    source?: string;
  };
}

@Injectable()
export class EventBusService extends EventEmitter {
  private readonly logger = new Logger(EventBusService.name);
  private isShuttingDown = false;

  constructor() {
    super();
    this.setMaxListeners(100); // Prevent memory leak warnings
  }

  async publish(eventType: string, payload: any, metadata?: any): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn('EventBusService is shutting down, ignoring event publication');
      return;
    }

    const eventData: EventData = {
      type: eventType,
      payload,
      metadata: {
        correlationId: metadata?.correlationId || this.generateCorrelationId(),
        timestamp: Date.now(),
        source: metadata?.source || 'EventBusService',
        ...metadata
      }
    };

    try {
      this.emit(eventType, eventData);
      this.logger.debug(`Published event: ${eventType}`, {
        correlationId: eventData.metadata?.correlationId
      });
    } catch (error) {
      this.logger.error(`Failed to publish event: ${eventType}`, error);
      throw error;
    }
  }

  subscribe(eventType: string, handler: (eventData: EventData) => void | Promise<void>): void {
    this.on(eventType, async (eventData: EventData) => {
      try {
        await handler(eventData);
      } catch (error) {
        this.logger.error(`Event handler failed for ${eventType}`, {
          error,
          correlationId: eventData.metadata?.correlationId
        });
      }
    });

    this.logger.debug(`Subscribed to event: ${eventType}`);
  }

  unsubscribe(eventType: string, handler?: Function): void {
    if (handler) {
      this.off(eventType, handler);
    } else {
      this.removeAllListeners(eventType);
    }
    this.logger.debug(`Unsubscribed from event: ${eventType}`);
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down EventBusService...');
    this.isShuttingDown = true;
    
    try {
      // Remove all listeners
      this.removeAllListeners();
      this.logger.info('EventBusService shutdown completed');
    } catch (error) {
      this.logger.error('Error during EventBus shutdown', error);
      throw error;
    }
  }

  private generateCorrelationId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  getEventNames(): string[] {
    return this.eventNames() as string[];
  }

  getListenerCount(eventType: string): number {
    return this.listenerCount(eventType);
  }
}