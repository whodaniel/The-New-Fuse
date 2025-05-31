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
exports.UnifiedMonitorService = void 0;
const common_1 = require("@nestjs/common");
/**
 * Unified monitoring service for tracking system metrics and events
 */
let UnifiedMonitorService = class UnifiedMonitorService {
    metrics = new Map();
    constructor() {
        // Initialize default metrics
        this.metrics.set('connections', 0);
        this.metrics.set('messages', 0);
        this.metrics.set('errors', 0);
        this.metrics.set('latency', []);
    }
    /**
     * Increment a numeric metric
     */
    incrementMetric(name, value = 1) {
        const current = this.metrics.get(name) || 0;
        this.metrics.set(name, current + value);
    }
    /**
     * Record a latency value
     */
    recordLatency(operation, timeMs) {
        const latencies = this.metrics.get('latency') || [];
        latencies.push({ operation, timeMs, timestamp: new Date() });
        // Keep only the last 1000 latency records
        if (latencies.length > 1000) {
            latencies.shift();
        }
        this.metrics.set('latency', latencies);
    }
    /**
     * Log a system event
     */
    logEvent(eventType, data) {
        console.log(`[${eventType}]`, JSON.stringify(data));
        // Store event in metrics
        const events = this.metrics.get('events') || [];
        events.push({
            type: eventType,
            data,
            timestamp: new Date()
        });
        // Keep only the last 1000 events
        if (events.length > 1000) {
            events.shift();
        }
        this.metrics.set('events', events);
    }
    /**
     * Get all metrics
     */
    getMetrics() {
        const result = {};
        this.metrics.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }
    /**
     * Get a specific metric
     */
    getMetric(name) {
        return this.metrics.get(name);
    }
    /**
     * Reset all metrics
     */
    resetMetrics() {
        this.metrics.clear();
        this.metrics.set('connections', 0);
        this.metrics.set('messages', 0);
        this.metrics.set('errors', 0);
        this.metrics.set('latency', []);
        this.metrics.set('events', []);
    }
};
exports.UnifiedMonitorService = UnifiedMonitorService;
exports.UnifiedMonitorService = UnifiedMonitorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UnifiedMonitorService);
//# sourceMappingURL=unified-monitor.service.js.map