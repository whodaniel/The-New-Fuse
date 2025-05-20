import { LoggingService } from '../../services/logging.js';
export class EventBus extends EventEmitter {
    constructor() {
        super();
        this.eventHistory = [];
        this.maxHistorySize = 1000;
        this.logger = LoggingService.getInstance();
        this.setupErrorHandling();
    }
    static getInstance() {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }
    setupErrorHandling() {
        this.on('error', (error) => {
            this.logger.error('EventBus error:', error);
        });
    }
    emit(type, payload, source, correlationId) {
        const eventData = {
            type,
            payload,
            metadata: {
                timestamp: Date.now(),
                source,
                correlationId
            }
        };
        this.addToHistory(eventData);
        this.logger.debug(`Event emitted: ${type}`, { source, correlationId });
        return super.emit(type, eventData);
    }
    on(type, listener) {
        return super.on(type, listener);
    }
    once(type, listener) {
        return super.once(type, listener);
    }
    addToHistory(eventData) {
        this.eventHistory.push(eventData);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }
    getEventHistory() {
        return [...this.eventHistory];
    }
    getEventsByType(type) {
        return this.eventHistory.filter(event => event.type === type);
    }
    getEventsByTimeRange(startTime, endTime) {
        return this.eventHistory.filter(event => event.metadata.timestamp >= startTime && event.metadata.timestamp <= endTime);
    }
    clearHistory() {
        this.eventHistory = [];
        this.logger.info('Event history cleared');
    }
    removeAllListeners(type) {
        if (type) {
            this.logger.debug(`Removing all listeners for event type: ${type}`);
        }
        else {
            this.logger.debug('Removing all event listeners');
        }
        return super.removeAllListeners(type);
    }
    listenerCount(type) {
        return super.listenerCount(type);
    }
    getActiveEventTypes() {
        return this.eventNames();
    }
}
//# sourceMappingURL=eventBus.js.map