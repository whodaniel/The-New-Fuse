
export {}
exports.eventBus = void 0;
import events_1 from 'events';
class EventBus extends events_1.EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(100); // Increase max listeners to handle multiple components
    }
    static getInstance() {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }
    // Type-safe emit method
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
    // Type-safe on method
    on(event, listener) {
        return super.on(event, listener);
    }
    // Type-safe off method
    off(event, listener) {
        return super.off(event, listener);
    }
    // Type-safe once method
    once(event, listener) {
        return super.once(event, listener);
    }
    // Clear all listeners for an event
    clear(event) {
        if (event) {
            this.removeAllListeners(event);
        }
        else {
            this.removeAllListeners();
        }
    }
}
exports.eventBus = EventBus.getInstance();
//# sourceMappingURL=eventBus.js.mapexport {};
