var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MetricsProcessor_1;
import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';
let MetricsProcessor = MetricsProcessor_1 = class MetricsProcessor {
    constructor() {
        this.logger = new Logger(MetricsProcessor_1.name);
        this.metricsBuffer = [];
        this.maxBufferSize = 1000;
        this.processingInterval = null;
    }
    onModuleInit() {
        this.logger.log('Metrics processor initialized');
        this.startPeriodicProcessing();
    }
    onModuleDestroy() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
        this.flushMetrics();
    }
    async trackEvent(eventType, data = {}) {
        try {
            const metric = {
                type: 'application',
                severity: 'info',
                metric: eventType,
                value: typeof data.value === 'number' ? data.value : 1,
                timestamp: new Date(),
                metadata: data,
            };
            this.addToBuffer(metric);
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
                    timestamp: new Date(),
                });
            }
            if (systemMetrics.memoryUsage > 80) {
                this.addToBuffer({
                    type: 'system',
                    severity: 'warning',
                    metric: 'memory_usage',
                    value: systemMetrics.memoryUsage,
                    timestamp: new Date(),
                });
            }
        }
        catch (error) {
            this.logger.error('Error processing system metrics', { error });
        }
    }
    addToBuffer(metric) {
        this.metricsBuffer.push(metric);
        if (this.metricsBuffer.length > this.maxBufferSize) {
            this.metricsBuffer.shift();
        }
    }
    startPeriodicProcessing() {
        this.processingInterval = setInterval(async () => {
            await this.processSystemMetrics();
            await this.flushMetrics();
        }, 30000);
    }
    async flushMetrics() {
        if (this.metricsBuffer.length === 0) {
            return;
        }
        try {
            this.logger.debug('Flushing metrics', { count: this.metricsBuffer.length });
            this.metricsBuffer.length = 0;
        }
        catch (error) {
            this.logger.error('Failed to flush metrics', { error });
        }
    }
    async getSystemMetrics() {
        const freeMemory = os.freemem();
        const totalMemory = os.totalmem();
        return {
            cpuUsage: os.loadavg()[0],
            memoryUsage: (totalMemory - freeMemory) / totalMemory * 100,
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
    Injectable()
], MetricsProcessor);
export { MetricsProcessor };
//# sourceMappingURL=metricsProcessor.js.map