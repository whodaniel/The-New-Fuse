var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EventBus_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
let EventBus = EventBus_1 = class EventBus {
    eventEmitter = new EventEmitter();
    logger = new Logger(EventBus_1.name);
    /**
     * Publish an event to all subscribers
     */
    async publish(event) {
        try {
            this.logger.log(`Publishing event: ${event.type} - ${event.id}`);
            this.eventEmitter.emit(event.type, event);
            this.eventEmitter.emit('all', event);
        }
        catch (error) {
            this.logger.error(`Failed to publish event ${event.type}:`, error);
            throw error;
        }
    }
    /**
     * Subscribe to events of a specific type
     */
    subscribe(eventType, handler) {
        this.eventEmitter.on(eventType, handler);
        this.logger.log(`Subscribed to event type: ${eventType}`);
    }
    /**
     * Subscribe to all events
     */
    subscribeAll(handler) {
        this.eventEmitter.on('all', handler);
        this.logger.log('Subscribed to all events');
    }
    /**
     * Unsubscribe from events of a specific type
     */
    unsubscribe(eventType, handler) {
        this.eventEmitter.off(eventType, handler);
        this.logger.log(`Unsubscribed from event type: ${eventType}`);
    }
    /**
     * Unsubscribe from all events
     */
    unsubscribeAll(handler) {
        this.eventEmitter.off('all', handler);
        this.logger.log('Unsubscribed from all events');
    }
    /**
     * Get all registered event types
     */
    getEventTypes() {
        // Note: EventEmitter doesn't provide a direct way to get all event names
        // This is a simplified implementation
        return ['user.created', 'user.updated', 'user.deleted', 'all'];
    }
    /**
     * Clear all subscriptions
     */
    clear() {
        this.eventEmitter.removeAllListeners();
        this.logger.log('Cleared all event subscriptions');
    }
};
EventBus = EventBus_1 = __decorate([
    Injectable()
], EventBus);
export { EventBus };
//# sourceMappingURL=event-bus.service.js.map