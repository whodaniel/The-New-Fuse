"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = exports.BaseEvent = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
/**
 * Base class for all events in the system
 */
class BaseEvent {
    timestamp;
    constructor(timestamp = new Date()) {
        this.timestamp = timestamp;
    }
}
exports.BaseEvent = BaseEvent;
/**
 * Event bus service for publishing and subscribing to events
 */
let EventBus = class EventBus {
    eventEmitter;
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    /** Publish an event */
    async publish(event) {
        const eventName = event.constructor.name;
        this.eventEmitter.emit(eventName, event);
    }
    /** Subscribe to an event */
    on(eventName, handler) {
        this.eventEmitter.on(eventName, handler);
    }
    /** Unsubscribe from an event */
    off(eventName, handler) {
        this.eventEmitter.off(eventName, handler);
    }
};
exports.EventBus = EventBus;
exports.EventBus = EventBus = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], EventBus);
//# sourceMappingURL=event-bus.service.js.map