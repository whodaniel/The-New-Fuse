var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UnifiedMonitorService_1;
import { Injectable, Logger } from '@nestjs/common';
let UnifiedMonitorService = UnifiedMonitorService_1 = class UnifiedMonitorService {
    metrics = new Map();
    logger = new Logger(UnifiedMonitorService_1.name);
    constructor() {
        this.initializeMetrics();
    }
    initializeMetrics() {
        this.metrics.set('connections', 0);
        this.metrics.set('messages', 0);
        this.metrics.set('errors', 0);
        this.metrics.set('latency', []);
        this.metrics.set('events', []);
    }
    incrementMetric(name, value = 1) {
        const current = this.metrics.get(name) || 0;
        this.metrics.set(name, current + value);
    }
    recordLatency(operation, timeMs) {
        const latencies = this.metrics.get('latency') || [];
        latencies.push({ operation, timeMs, timestamp: new Date() });
        this.metrics.set('latency', latencies);
    }
    logEvent(eventType, data) {
        const events = this.metrics.get('events') || [];
        events.push({ eventType, data, timestamp: new Date() });
        this.metrics.set('events', events);
        this.logger.log(`Event: ${eventType}`, data);
    }
    recordMetric(name, value, tags) {
        this.metrics.set(name, { value, tags, timestamp: new Date() });
    }
    captureError(error, context) {
        this.incrementMetric('errors');
        this.logEvent('error', {
            error: typeof error === 'string' ? error : error.message,
            stack: typeof error === 'object' ? error.stack : undefined,
            context
        });
    }
    getMetrics() {
        const result = {};
        for (const [key, value] of this.metrics.entries()) {
            result[key] = value;
        }
        return result;
    }
    getMetric(name) {
        return this.metrics.get(name);
    }
    resetMetrics() {
        this.metrics.clear();
        this.initializeMetrics();
    }
};
UnifiedMonitorService = UnifiedMonitorService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], UnifiedMonitorService);
export { UnifiedMonitorService };
