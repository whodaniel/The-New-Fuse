"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = exports.BaseEvent = void 0;
const common_1 = require("@nestjs/common");
// Base event class that all events will extend
class BaseEvent {
    timestamp;
    constructor(timestamp = new Date()) {
        this.timestamp = timestamp;
    }
}
exports.BaseEvent = BaseEvent;
let EventBus = class EventBus {
    handlers = new Map();
    // Register a handler for a specific event type
    subscribe(eventName, handler) {
        if (!this.handlers.has(eventName)) {
            this.handlers.set(eventName, []);
        }
        this.handlers.get(eventName)?.push(handler);
    }
    // Unsubscribe a handler
    unsubscribe(eventName, handler) {
        const handlers = this.handlers.get(eventName);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }
    // Publish an event to all registered handlers
    async publish(event) {
        const eventName = event.constructor.name;
        const handlers = this.handlers.get(eventName) || [];
        await Promise.all(handlers.map(handler => handler(event)));
    }
};
exports.EventBus = EventBus;
exports.EventBus = EventBus = __decorate([
    (0, common_1.Injectable)()
], EventBus);
//# sourceMappingURL=event-bus.service.js.map