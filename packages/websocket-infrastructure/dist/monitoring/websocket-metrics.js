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
var WebSocketMonitoring_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketMonitoring = void 0;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
let WebSocketMonitoring = WebSocketMonitoring_1 = class WebSocketMonitoring {
    logger = new common_1.Logger(WebSocketMonitoring_1.name);
    registry;
    connectionsTotal;
    activeConnections;
    messagesTotal;
    messageLatency;
    errorsTotal;
    reconnectionsTotal;
    queueSize;
    messageProcessingTime;
    constructor(registry) {
        this.registry = registry || prom_client_1.register;
        this.initializeMetrics();
    }
    initializeMetrics() {
        this.connectionsTotal = new prom_client_1.Counter({
            name: 'websocket_connections_total',
            help: 'Total number of WebSocket connections',
            labelNames: ['status'],
            registers: [this.registry],
        });
        this.activeConnections = new prom_client_1.Gauge({
            name: 'websocket_connections_active',
            help: 'Number of active WebSocket connections',
            registers: [this.registry],
        });
        this.messagesTotal = new prom_client_1.Counter({
            name: 'websocket_messages_total',
            help: 'Total number of WebSocket messages',
            labelNames: ['direction', 'channel'],
            registers: [this.registry],
        });
        this.messageLatency = new prom_client_1.Histogram({
            name: 'websocket_message_latency_seconds',
            help: 'WebSocket message latency in seconds',
            labelNames: ['channel'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
            registers: [this.registry],
        });
        this.errorsTotal = new prom_client_1.Counter({
            name: 'websocket_errors_total',
            help: 'Total number of WebSocket errors',
            labelNames: ['type'],
            registers: [this.registry],
        });
        this.reconnectionsTotal = new prom_client_1.Counter({
            name: 'websocket_reconnections_total',
            help: 'Total number of WebSocket reconnections',
            registers: [this.registry],
        });
        this.queueSize = new prom_client_1.Gauge({
            name: 'websocket_queue_size',
            help: 'Current size of message queue',
            registers: [this.registry],
        });
        this.messageProcessingTime = new prom_client_1.Histogram({
            name: 'websocket_message_processing_seconds',
            help: 'Time to process a message in seconds',
            labelNames: ['channel'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
            registers: [this.registry],
        });
        this.logger.log('Metrics initialized');
    }
    recordConnection(success = true) {
        this.connectionsTotal.inc({ status: success ? 'success' : 'failed' });
        if (success) {
            this.activeConnections.inc();
        }
    }
    recordDisconnection() {
        this.activeConnections.dec();
    }
    recordMessage(direction, channel = 'default') {
        this.messagesTotal.inc({ direction, channel });
    }
    recordMessageLatency(latencyMs, channel = 'default') {
        this.messageLatency.observe({ channel }, latencyMs / 1000);
    }
    recordError(type = 'unknown') {
        this.errorsTotal.inc({ type });
    }
    recordReconnection() {
        this.reconnectionsTotal.inc();
    }
    updateQueueSize(size) {
        this.queueSize.set(size);
    }
    recordProcessingTime(timeMs, channel = 'default') {
        this.messageProcessingTime.observe({ channel }, timeMs / 1000);
    }
    async getMetrics() {
        return this.registry.metrics();
    }
    async getMetricsJSON() {
        const metrics = await this.registry.getMetricsAsJSON();
        const result = {
            totalConnections: 0,
            activeConnections: 0,
            totalMessages: 0,
            messagesPerSecond: 0,
            averageLatency: 0,
            errors: 0,
            reconnections: 0,
        };
        for (const metric of metrics) {
            if (metric.name === 'websocket_connections_total') {
                result.totalConnections = metric.values.reduce((sum, v) => sum + v.value, 0);
            }
            else if (metric.name === 'websocket_connections_active') {
                result.activeConnections = metric.values[0]?.value || 0;
            }
            else if (metric.name === 'websocket_messages_total') {
                result.totalMessages = metric.values.reduce((sum, v) => sum + v.value, 0);
            }
            else if (metric.name === 'websocket_errors_total') {
                result.errors = metric.values.reduce((sum, v) => sum + v.value, 0);
            }
            else if (metric.name === 'websocket_reconnections_total') {
                result.reconnections = metric.values[0]?.value || 0;
            }
        }
        return result;
    }
    async getHealthStatus(additionalChecks) {
        const metrics = await this.getMetricsJSON();
        const healthy = metrics.activeConnections >= 0 &&
            (additionalChecks?.redis ?? true) &&
            (additionalChecks?.queueSize ?? 0) < 10000;
        return {
            healthy,
            timestamp: new Date(),
            connections: metrics.activeConnections,
            redis: additionalChecks?.redis ?? true,
            messageQueue: additionalChecks?.queueSize ?? 0,
            errors: additionalChecks?.errors ?? [],
        };
    }
    reset() {
        this.registry.clear();
        this.initializeMetrics();
        this.logger.log('Metrics reset');
    }
    getRegistry() {
        return this.registry;
    }
};
exports.WebSocketMonitoring = WebSocketMonitoring;
exports.WebSocketMonitoring = WebSocketMonitoring = WebSocketMonitoring_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prom_client_1.Registry])
], WebSocketMonitoring);
