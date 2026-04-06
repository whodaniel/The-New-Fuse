import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

export interface EventMetadata {
  timestamp: number;
  source?: string;
  correlationId?: string;
}

export interface EventData<T = any> {
  type: string;
  payload: T;
  metadata: EventMetadata;
}

export class EventBus extends EventEmitter {
  private static instance: EventBus;
  private eventHistory: EventData[] = [];
  private maxHistorySize = 1000;

  private constructor() {
    super();
    this.setupErrorHandling();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  private setupErrorHandling(): void {
    this.on('error', (error: Error) => {
      logger.error('EventBus error:', error);
    });
  }

  public emit(
    type: string | symbol,
    payload: any,
    source?: string,
    correlationId?: string
  ): boolean {
    const eventData: EventData = {
      type: String(type),
      payload,
      metadata: {
        timestamp: Date.now(),
        source,
        correlationId,
      },
    };
    this.addToHistory(eventData);
    logger.debug(`Event emitted: ${String(type)}`, { source, correlationId });
    return super.emit(type, eventData);
  }

  private addToHistory(eventData: EventData): void {
    this.eventHistory.push(eventData);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  public getEventHistory(): EventData[] {
    return [...this.eventHistory];
  }

  public getEventsByType(type: string): EventData[] {
    return this.eventHistory.filter((event) => event.type === type);
  }

  public getEventsByTimeRange(startTime: number, endTime: number): EventData[] {
    return this.eventHistory.filter(
      (event) => event.metadata.timestamp >= startTime && event.metadata.timestamp <= endTime
    );
  }

  public clearHistory(): void {
    this.eventHistory = [];
    logger.info('Event history cleared');
  }

  public removeAllListeners(type?: string | symbol): this {
    if (type) {
      logger.debug(`Removing all listeners for event type: ${String(type)}`);
    } else {
      logger.debug('Removing all event listeners');
    }
    return super.removeAllListeners(type);
  }

  public getActiveEventTypes(): (string | symbol)[] {
    return this.eventNames();
  }
}
