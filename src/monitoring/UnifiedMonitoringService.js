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
var UnifiedMonitoringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedMonitoringService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prom_client_1 = require("prom-client");
const api_1 = require("@opentelemetry/api");
const redis_service_js_1 = require("../services/redis.service.js");
const common_2 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let UnifiedMonitoringService = UnifiedMonitoringService_1 = class UnifiedMonitoringService {
    eventEmitter;
    redisService;
    configService;
    logger = new common_2.Logger(UnifiedMonitoringService_1.name);
    // Prometheus metrics
    messageCounter;
    processingTimeHistogram;
    healthCheckGauge;
    // OpenTelemetry tracer
    tracer = api_1.trace.getTracer('unified-monitoring');
    // Storage for outputs and errors for historical analysis
    outputs = [];
    errors = [];
    MAX_HISTORY_SIZE = 1000; // Limit the size of stored history
    // Default configuration
    config = {
        serviceName: 'the-new-fuse',
        metricsPrefix: 'fuse',
        tracingEnabled: true,
        metricsEnabled: true
    };
    constructor(eventEmitter, redisService, configService) {
        this.eventEmitter = eventEmitter;
        this.redisService = redisService;
        this.configService = configService;
        // Override defaults with config from ConfigService if available
        if (this.configService) {
            this.config.serviceName = this.configService.get('SERVICE_NAME', this.config.serviceName);
            this.config.metricsPrefix = this.configService.get('METRICS_PREFIX', this.config.metricsPrefix);
            this.config.tracingEnabled = this.configService.get('TRACING_ENABLED', this.config.tracingEnabled);
            this.config.metricsEnabled = this.configService.get('METRICS_ENABLED', this.config.metricsEnabled);
        }
    }
    async onModuleInit() {
        if (this.config.metricsEnabled) {
            this.initializeMetrics();
        }
        this.initializeEventListeners();
        this.startHealthChecks();
        this.logger.log('UnifiedMonitoringService initialized');
    }
    initializeMetrics() {
        this.messageCounter = new prom_client_1.Counter({
            name: `${this.config.metricsPrefix}_messages_total`,
            help: 'Total messages processed',
            labelNames: ['message_type']
        });
        this.processingTimeHistogram = new prom_client_1.Histogram({
            name: `${this.config.metricsPrefix}_processing_time_seconds`,
            help: 'Processing time distribution',
            buckets: [0.1, 0.5, 1, 2, 5],
            labelNames: ['message_type']
        });
        this.healthCheckGauge = new prom_client_1.Gauge({
            name: `${this.config.metricsPrefix}_health_status`,
            help: 'Service health status (1 = healthy, 0 = unhealthy)'
        });
    }
    initializeEventListeners() {
        // Unified event listener for all agent activity
        this.eventEmitter.on('agent.activity', (type, data) => {
            this.handleActivity(type, data);
        });
        // Listen for error events
        this.eventEmitter.on('agent.processing.error', (error) => {
            this.handleError(error);
        });
    }
    async handleActivity(type, data) {
        const span = this.tracer.startSpan('handleActivity');
        api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), async () => {
            try {
                const startTime = process.hrtime();
                // Metric collection
                if (this.config.metricsEnabled) {
                    this.messageCounter.inc({ message_type: type });
                }
                // Tracing context
                if (this.config.tracingEnabled) {
                    span.setAttributes({
                        'message.type': type,
                        'processing.start_time': Date.now()
                    });
                }
                // Core processing logic
                this.logger.log(`Processed ${type} activity:`, data);
                // Store the output for historical analysis
                this.storeOutput(type, data);
                // Distributed tracing propagation
                api_1.propagation.inject(api_1.context.active(), data);
                // Unified event emission
                this.eventEmitter.emit('monitoring.event', {
                    type,
                    data,
                    timestamp: new Date().toISOString(),
                    traceId: span.spanContext().traceId
                });
                // Metric timing
                if (this.config.metricsEnabled) {
                    const diffTime = process.hrtime(startTime);
                    const duration = diffTime[0] + diffTime[1] / 1e9;
                    this.processingTimeHistogram.observe({ message_type: type }, duration);
                }
                span.end();
            }
            catch (error) {
                span.recordException(error);
                span.setStatus({ code: api_1.SpanStatusCode.ERROR });
                this.logger.error('Activity processing failed:', error);
                // Store the error
                this.storeError(error);
                span.end();
            }
        });
    }
    // Consolidated health check logic
    startHealthChecks() {
        setInterval(async () => {
            try {
                await this.redisService.ping();
                this.healthCheckGauge.set(1);
            }
            catch (error) {
                this.healthCheckGauge.set(0);
                this.logger.error('Health check failure:', error);
            }
        }, 30000);
    }
    // Error handling method
    handleError(error) {
        const span = this.tracer.startSpan('handleError');
        api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), () => {
            try {
                this.logger.error('Processing error:', error);
                // Store the error for historical analysis
                this.storeError(error);
                // Add error attributes to span
                span.setAttributes({
                    'error.type': error.name || 'UnknownError',
                    'error.message': error.message || 'No message',
                    'error.timestamp': Date.now()
                });
                // Emit a unified error event
                this.eventEmitter.emit('monitoring.error', {
                    error,
                    timestamp: new Date().toISOString(),
                    traceId: span.spanContext().traceId
                });
                span.end();
            }
            catch (err) {
                span.recordException(err);
                span.setStatus({ code: api_1.SpanStatusCode.ERROR });
                this.logger.error('Error handling failed:', err);
                span.end();
            }
        });
    }
    // Storage methods
    storeOutput(type, data) {
        const outputEntry = {
            type,
            data,
            timestamp: new Date().toISOString()
        };
        // Add to the beginning for faster access to recent items
        this.outputs.unshift(outputEntry);
        // Trim the history if it exceeds the maximum size
        if (this.outputs.length > this.MAX_HISTORY_SIZE) {
            this.outputs = this.outputs.slice(0, this.MAX_HISTORY_SIZE);
        }
    }
    storeError(error) {
        const errorEntry = {
            error,
            timestamp: new Date().toISOString()
        };
        this.errors.unshift(errorEntry);
        if (this.errors.length > this.MAX_HISTORY_SIZE) {
            this.errors = this.errors.slice(0, this.MAX_HISTORY_SIZE);
        }
    }
    // Public methods for accessing historical data
    async getRecentOutputs(limit = 100) {
        return this.outputs.slice(0, limit);
    }
    async getRecentErrors(limit = 100) {
        return this.errors.slice(0, limit);
    }
};
exports.UnifiedMonitoringService = UnifiedMonitoringService;
exports.UnifiedMonitoringService = UnifiedMonitoringService = UnifiedMonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2,
        redis_service_js_1.RedisService,
        config_1.ConfigService])
], UnifiedMonitoringService);
//# sourceMappingURL=UnifiedMonitoringService.js.map