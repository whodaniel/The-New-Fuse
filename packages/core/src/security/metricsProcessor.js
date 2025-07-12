var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MetricsProcessor_1;
import { Injectable, Logger } from '@nestjs/common';
let MetricsProcessor = MetricsProcessor_1 = class MetricsProcessor {
    logger = new Logger(MetricsProcessor_1.name);
    metricsBuffer = [];
    maxBufferSize = 1000;
    constructor() {
        this.logger.log('Metrics processor initialized');
        this.startPeriodicProcessing();
    }
    async trackEvent(eventType, data) {
        try {
            const metric = {
                type: 'application',
                severity: 'info',
                metric: eventType,
                value: typeof data.value === 'number' ? data.value : 1,
                timestamp: new Date(),
                metadata: data
            };
            this.addToBuffer(metric);
            this.logger.debug('Event tracked', { eventType, data });
        }
        catch (error) {
            this.logger.error('Failed to track event', { error, eventType, data });
        }
    }
    async processSystemMetrics() {
        try {
            const systemMetrics = await this.getSystemMetrics();
            if (systemMetrics.cpuUsage > 80) {
                this.addToBuffer({
                    type: 'system',
                    severity: 'warning',
                    metric: 'cpu_usage',
                    value: systemMetrics.cpuUsage,
                    timestamp: new Date()
                });
            }
            if (systemMetrics.memoryUsage > 85) {
                this.addToBuffer({
                    type: 'system',
                    severity: 'warning',
                    metric: 'memory_usage',
                    value: systemMetrics.memoryUsage,
                    timestamp: new Date()
                });
            }
        }
        catch (error) {
            this.logger.error('Error processing system metrics', { error });
        }
    }
    async processApplicationMetrics() {
        try {
            const appMetrics = await this.getApplicationMetrics();
            if (appMetrics.responseTime > 1000) {
                this.addToBuffer({
                    type: 'application',
                    severity: 'warning',
                    metric: 'slow_response',
                    value: appMetrics.responseTime,
                    timestamp: new Date()
                });
            }
            if (appMetrics.errorRate > 5) {
                this.addToBuffer({
                    type: 'application',
                    severity: 'warning',
                    metric: 'high_error_rate',
                    value: appMetrics.errorRate,
                    timestamp: new Date()
                });
            }
        }
        catch (error) {
            this.logger.error('Error processing application metrics', { error });
        }
    }
    async processAgentMetrics() {
        try {
            const agentMetrics = await this.getAgentMetrics();
            this.addToBuffer({
                type: 'agent',
                severity: 'info',
                metric: 'active_agents',
                value: agentMetrics.activeAgents,
                timestamp: new Date()
            });
            this.logger.debug('Agent metrics processed', agentMetrics);
        }
        catch (error) {
            this.logger.error('Error processing agent metrics', { error });
        }
    }
    async processTaskMetrics() {
        try {
            // Task metrics processing logic would go here
            this.logger.debug('Task metrics processed');
        }
        catch (error) {
            this.logger.error('Error processing task metrics', { error });
        }
    }
    addToBuffer(metric) {
        this.metricsBuffer.push(metric);
        // Prevent buffer overflow
        if (this.metricsBuffer.length > this.maxBufferSize) {
            this.metricsBuffer.shift();
        }
    }
    startPeriodicProcessing() {
        // Process metrics every 30 seconds
        setInterval(async () => {
            await this.processSystemMetrics();
            await this.processApplicationMetrics();
            await this.processAgentMetrics();
            await this.processTaskMetrics();
            await this.flushMetrics();
        }, 30000);
    }
    async flushMetrics() {
        if (this.metricsBuffer.length === 0) {
            return;
        }
        try {
            // In a real implementation, this would send metrics to a monitoring system
            this.logger.debug('Flushing metrics', { count: this.metricsBuffer.length });
            // Clear the buffer after successful flush
            this.metricsBuffer.length = 0;
        }
        catch (error) {
            this.logger.error('Failed to flush metrics', { error });
        }
    }
    async getSystemMetrics() {
        // In a real implementation, this would collect actual system metrics
        return {
            cpuUsage: Math.random() * 100,
            memoryUsage: Math.random() * 100,
            diskUsage: Math.random() * 100,
            networkIO: Math.random() * 1000
        };
    }
    async getApplicationMetrics() {
        // In a real implementation, this would collect actual application metrics
        return {
            responseTime: Math.random() * 2000,
            requestCount: Math.floor(Math.random() * 1000),
            errorRate: Math.random() * 10,
            activeConnections: Math.floor(Math.random() * 100)
        };
    }
    async getAgentMetrics() {
        // In a real implementation, this would collect actual agent metrics
        return {
            activeAgents: Math.floor(Math.random() * 10),
            completedTasks: Math.floor(Math.random() * 100),
            failedTasks: Math.floor(Math.random() * 10),
            averageProcessingTime: Math.random() * 5000
        };
    }
    getMetricsBuffer() {
        return [...this.metricsBuffer];
    }
    clearBuffer() {
        this.metricsBuffer.length = 0;
        this.logger.log('Metrics buffer cleared');
    }
};
MetricsProcessor = MetricsProcessor_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], MetricsProcessor);
export { MetricsProcessor };
