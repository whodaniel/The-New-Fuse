/**
 * Event Service
 * Centralized event bus for application-wide events
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EventService_1;
var _a;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
let EventService = EventService_1 = class EventService {
    eventEmitter;
    logger = new Logger(EventService_1.name);
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    /**
     * Emit an event
     * @param eventName Name of the event
     * @param payload Event data
     */
    emit(eventName, payload) {
        this.logger.debug(`Emitting event: ${eventName});
    this.eventEmitter.emit(eventName, payload);
  }

  /**
   * Subscribe to an event
   * @param eventName Name of the event
   * @param listener Event handler function
   * @returns Unsubscribe function
   */
  subscribe(eventName: string, listener: (payload: any) => void): () => void {`, this.logger.debug(`Subscribing to event: ${eventName}`));
        const callback = (payload) => {
            this.logger.debug(Received, event, $, { eventName });
            listener(payload);
        };
        this.eventEmitter.on(eventName, callback);
        // Return unsubscribe function
        return () => {
            `
      this.logger.debug(Unsubscribing from event: ${eventName}`;
            ;
            this.eventEmitter.removeListener(eventName, callback);
        };
    }
    /**
     * Subscribe to an event once
     * @param eventName Name of the event
     * @param listener Event handler function
     * @returns Unsubscribe function
     */
    subscribeOnce(eventName, listener) {
        this.logger.debug(Subscribing, once, to, event, $, { eventName });
        `
    `;
        const callback = (payload) => {
            this.logger.debug(Received, one - time, event, $, { eventName } `);
      listener(payload);
    };
    
    this.eventEmitter.once(eventName, callback);
    
    // Return unsubscribe function
    return () => {
      this.logger.debug(Unsubscribing from one-time event: ${eventName}`);
            this.eventEmitter.removeListener(eventName, callback);
        };
    }
};
EventService = EventService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof EventEmitter2 !== "undefined" && EventEmitter2) === "function" ? _a : Object])
], EventService);
export { EventService };
//# sourceMappingURL=event.service.js.map