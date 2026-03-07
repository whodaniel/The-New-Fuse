/**
 * Simple Event Emitter for TypeScript
 * Used by services for reactive event handling
 */

type EventListener<T = unknown> = (data?: T) => void;

export class EventEmitter<EventType extends string> {
  private listeners: Map<EventType, EventListener[]> = new Map();

  /**
   * Subscribe to an event
   */
  on<T = unknown>(event: EventType, listener: EventListener<T>): () => void {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.push(listener as EventListener);
    this.listeners.set(event, eventListeners);

    // Return unsubscribe function
    return () => this.off(event, listener as EventListener);
  }

  /**
   * Subscribe to an event (runs only once)
   */
  once<T = unknown>(event: EventType, listener: EventListener<T>): () => void {
    const onceListener: EventListener = (data) => {
      this.off(event, onceListener);
      listener(data as T);
    };
    return this.on(event, onceListener);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: EventType, listener: EventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit<T = unknown>(event: EventType, data?: T): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event (or all events if no event specified)
   */
  removeAllListeners(event?: EventType): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get count of listeners for an event
   */
  listenerCount(event: EventType): number {
    return this.listeners.get(event)?.length || 0;
  }
}

export default EventEmitter;
