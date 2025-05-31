import { Injectable } from '@nestjs/common';

// Base event class that all events will extend
export class BaseEvent {
  constructor(public readonly timestamp: Date = new Date()) {}
}

// Event handler type
type EventHandler = (event: BaseEvent) => void | Promise<void>;

@Injectable()
export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  
  // Register a handler for a specific event type
  subscribe(eventName: string, handler: EventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    
    this.handlers.get(eventName)?.push(handler);
  }
  
  // Unsubscribe a handler
  unsubscribe(eventName: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventName);
    
    if (handlers) {
      const index = handlers.indexOf(handler);
      
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  // Publish an event to all registered handlers
  async publish(event: BaseEvent): Promise<void> {
    const eventName = event.constructor.name;
    const handlers = this.handlers.get(eventName) || [];
    
    await Promise.all(handlers.map(handler => handler(event)));
  }
}