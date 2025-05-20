import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Base class for all events in the system
 */
export abstract class BaseEvent {
  constructor(public readonly timestamp: Date = new Date()) {}
}

/**
 * Event bus service for publishing and subscribing to events
 */
@Injectable()
export class EventBus {
  constructor(private eventEmitter: EventEmitter2) {}

  /** Publish an event */
  async publish<T extends BaseEvent>(event: T): Promise<void> {
    const eventName = event.constructor.name;
    this.eventEmitter.emit(eventName, event);
  }

  /** Subscribe to an event */
  on<T extends BaseEvent>(eventName: string, handler: (event: T) => void): void {
    this.eventEmitter.on(eventName, handler);
  }

  /** Unsubscribe from an event */
  off<T extends BaseEvent>(eventName: string, handler: (event: T) => void): void {
    this.eventEmitter.off(eventName, handler);
  }
}
