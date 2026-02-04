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
var ConsolidatedMonitoringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsolidatedMonitoringService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const UnifiedMonitoringService_tsx_1 = require("./UnifiedMonitoringService.tsx");
const redis_service_js_1 = require("../services/redis.service.js");
/**
 * ConsolidatedMonitoringService
 *
 * This service acts as a facade for all monitoring functionality in the application.
 * It delegates to UnifiedMonitoringService for most functionality while providing
 * a clean, consistent API for all monitoring needs.
 *
 * In the future, all monitoring services should be migrated to use this service
 * instead of directly using UnifiedMonitoringService or other monitoring services.
 */
let ConsolidatedMonitoringService = ConsolidatedMonitoringService_1 = class ConsolidatedMonitoringService {
    unifiedMonitoring;
    eventEmitter;
    redisService;
    logger = new common_1.Logger(ConsolidatedMonitoringService_1.name);
    constructor(unifiedMonitoring, eventEmitter, redisService) {
        this.unifiedMonitoring = unifiedMonitoring;
        this.eventEmitter = eventEmitter;
        this.redisService = redisService;
    }
    async onModuleInit() {
        this.logger.log('ConsolidatedMonitoringService initialized');
        // Set up event forwarding to ensure all events are properly captured
        this.setupEventForwarding();
    }
    setupEventForwarding() {
        // Forward all monitoring-related events to UnifiedMonitoringService
        this.eventEmitter.on('agent.*', (type, data) => {
            this.eventEmitter.emit('monitoring.event', { source: 'agent', type, data });
        });
        this.eventEmitter.on('system.*', (type, data) => {
            this.eventEmitter.emit('monitoring.event', { source: 'system', type, data });
        });
        this.eventEmitter.on('roo.*', (type, data) => {
            this.eventEmitter.emit('monitoring.event', { source: 'roo', type, data });
        });
    }
    // Metrics recording
    recordMetric(name, value, tags = {}) {
        this.eventEmitter.emit('monitoring.metric', { name, value, tags });
        return this.unifiedMonitoring.recordMetric?.(name, value, tags);
    }
    // Latency recording
    recordLatency(operation, durationMs, tags = {}) {
        this.eventEmitter.emit('monitoring.latency', { operation, durationMs, tags });
        return this.unifiedMonitoring.recordLatency?.(operation, durationMs, tags);
    }
    // Event logging
    logEvent(eventName, data = {}) {
        this.eventEmitter.emit('monitoring.event', { name: eventName, data });
        return this.unifiedMonitoring.logEvent?.(eventName, data);
    }
    // Error tracking
    trackError(error, context = {}) {
        this.eventEmitter.emit('monitoring.error', { error, context });
        return this.unifiedMonitoring.trackError?.(error, context);
    }
    // Health check
    async checkHealth() {
        try {
            // Check Redis connection
            await this.redisService.ping?.();
            return {
                healthy: true,
                details: {
                    redis: 'connected',
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            this.logger.error('Health check failed', error);
            return {
                healthy: false,
                details: {
                    error: error.message,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }
    // Historical data access
    async getRecentOutputs(limit = 100) {
        return this.unifiedMonitoring.getRecentOutputs(limit);
    }
    async getRecentErrors(limit = 100) {
        return this.unifiedMonitoring.getRecentErrors(limit);
    }
    // Trae-specific metrics tracking
    async trackTraeMetrics(data) {
        this.eventEmitter.emit('monitoring.trae', data);
        return this.unifiedMonitoring.trackTraeMetrics?.(data);
    }
};
exports.ConsolidatedMonitoringService = ConsolidatedMonitoringService;
exports.ConsolidatedMonitoringService = ConsolidatedMonitoringService = ConsolidatedMonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [UnifiedMonitoringService_tsx_1.UnifiedMonitoringService,
        event_emitter_1.EventEmitter2,
        redis_service_js_1.RedisService])
], ConsolidatedMonitoringService);
//# sourceMappingURL=ConsolidatedMonitoringService.js.map