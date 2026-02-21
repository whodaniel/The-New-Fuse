"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
        r = Reflect.decorate(decorators, target, key, desc);
    else
        for (var i = decorators.length - 1; i >= 0; i--)
            if (d = decorators[i])
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
        return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); };
};
var _a;
import inversify_1 from 'inversify';
import types_1 from '../di/types.js';
import metrics_collector_1 from '../metrics/metrics-collector.js';
import error_handler_1 from '../error/error-handler.js';
import events_1 from 'events';
let EventBus = class EventBus {
    constructor(logger, metrics, errorHandler) {
        Object.defineProperty(this, "logger", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: logger
        });
        Object.defineProperty(this, "metrics", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: metrics
        });
        Object.defineProperty(this, "errorHandler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: errorHandler
        });
        Object.defineProperty(this, "emitter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "handlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "retryAttempts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 3
        });
        this.emitter = new events_1.EventEmitter();
        this.handlers = new Map();
        this.setupErrorHandling();
    }
}(), Promise;
exports.EventBus = EventBus;
(eventType, payload, metadata = {});
{
    const event = {
        type: eventType,
        payload,
        metadata: Object.assign({ timestamp: Date.now(), source: metadata.source || 'unknown' }, metadata)
    };
    this.logger.debug('Publishing event', { eventType, metadata });
    this.metrics.incrementCounter('events_published_total', { type: eventType });
    try {
        const handlers = this.handlers.get(eventType) || new Set();
        const promises = Array.from(handlers).map(handler => this.executeHandler(handler, event));
        await Promise.all(promises);
    }
    catch (error) {
        this.logger.error('Error publishing event', { error, event });
        this.metrics.incrementCounter('events_failed_total', { type: eventType });
        throw error;
    }
}
subscribe(eventType, handler);
{
    if (!this.handlers.has(eventType)) {
        this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType).add(handler);
    this.metrics.incrementCounter('event_subscribers_total', { type: eventType });
    // Return unsubscribe function
    return () => {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.handlers.delete(eventType);
            }
            this.metrics.incrementCounter('event_unsubscribers_total', { type: eventType });
        }
    };
}
async;
publishBatch();
Promise();
Promise(events);
{
    try {
        await Promise.all(events.map(event => this.publish(event.type, event.payload, event.metadata)));
    }
    catch (error) {
        this.logger.error('Error publishing batch events', { error });
        throw error;
    }
}
async;
executeHandler();
Promise();
Promise(handler, event);
{
    let attempts = 0;
    while (attempts < this.retryAttempts) {
        try {
            await handler(event);
            return;
        }
        catch (error) {
            attempts++;
            this.logger.warn('Event handler failed', {
                error,
                event,
                attempt: attempts
            });
            if (attempts === this.retryAttempts) {
                this.logger.error('Event handler failed all retry attempts', {
                    error,
                    event
                });
                throw error;
            }
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
    }
}
setupErrorHandling();
{
    this.emitter.on('error', (error) => {
        this.logger.error('EventEmitter error', { error });
        this.metrics.incrementCounter('event_emitter_errors_total');
    });
}
getMetrics();
{
    const metrics = {};
    this.handlers.forEach((handlers, type) => {
        metrics[`subscribers_${type}`] = handlers.size;
    });
    return metrics;
}
;
exports.EventBus = EventBus = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.Logger)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.MetricsCollector)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.ErrorHandler)),
    __metadata("design:paramtypes", [typeof (_a = typeof winston_1.Logger !== "undefined" && winston_1.Logger) === "function" ? _a : Object, metrics_collector_1.MetricsCollector,
        error_handler_1.ErrorHandler])
], EventBus);
//# sourceMappingURL=event-bus.js.map
