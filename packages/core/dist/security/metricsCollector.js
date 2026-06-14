var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MetricsCollectorService_1;
import { Injectable, Logger } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { performance } from 'perf_hooks';
import * as os from 'os';
let MetricsCollectorService = MetricsCollectorService_1 = class MetricsCollectorService {
    constructor(redisService) {
        this.redisService = redisService;
        this.logger = new Logger(MetricsCollectorService_1.name);
        this.collectionInterval = null;
        this.retentionPeriod = 86400; // 24 hours in seconds
    }
    onModuleInit() {
        this.start();
    }
    onModuleDestroy() {
        this.stop();
    }
    start() {
        if (this.collectionInterval) {
            throw new Error('Metrics collection already started');
        }
        this.collectionInterval = setInterval(() => this.collectMetrics(), 5000);
        this.logger.log('Metrics collection started');
    }
    stop() {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
            this.logger.log('Metrics collection stopped');
        }
    }
    async collectMetrics() {
        try {
            const metrics = {
                timestamp: new Date().toISOString(),
                cpuUsage: this.getCpuUsage(),
                memoryUsage: this.getMemoryUsage(),
                eventLoopLag: await this.getEventLoopLag(),
            };
            const key = `metrics:${metrics.timestamp}`;
            await this.redisService.set(key, JSON.stringify(metrics), this.retentionPeriod);
        }
        catch (error) {
            this.logger.error('Error collecting metrics', error);
        }
    }
    getCpuUsage() {
        const cpus = os.cpus();
        const total = cpus.reduce((acc, cpu) => {
            acc.total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
            acc.idle += cpu.times.idle;
            return acc;
        }, { total: 0, idle: 0 });
        return {
            total: total.total,
            idle: total.idle,
            usage: 1 - total.idle / total.total,
        };
    }
    getMemoryUsage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        return {
            total: totalMemory,
            free: freeMemory,
            used: totalMemory - freeMemory,
        };
    }
    getEventLoopLag() {
        return new Promise((resolve) => {
            const start = performance.now();
            setTimeout(() => {
                resolve(performance.now() - start);
            });
        });
    }
};
MetricsCollectorService = MetricsCollectorService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [UnifiedRedisService])
], MetricsCollectorService);
export { MetricsCollectorService };
//# sourceMappingURL=metricsCollector.js.map