type EventCallback = (...args: unknown[]) => void;

export class EventEmitter {
    private events: Map<string, EventCallback[]>;

    constructor() {
        this.events = new Map();
    }

    /**
     * Register an event listener
     * @param event The event name
     * @param callback The callback function
     */
    on(event: string, callback: EventCallback): void {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        const callbacks = this.events.get(event);
        callbacks?.push(callback);
    }

    /**
     * Remove an event listener
     * @param event The event name
     * @param callback The callback function
     */
    off(event: string, callback: EventCallback): void {
        const callbacks = this.events.get(event);
        
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emit an event
     * @param event The event name
     * @param args The arguments to pass to the callback
     */
    emit(event: string, ...args: unknown[]): void {
        const callbacks = this.events.get(event);
        
        if (callbacks) {
            callbacks.forEach(callback => callback(...args));
        }
    }

    /**
     * Clear all event listeners
     * @param event Optional event name to clear only that event
     */
    clear(event?: string): void {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }
}
