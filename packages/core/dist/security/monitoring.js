var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MonitoringService_1;
import { Injectable, Logger } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { performance } from 'perf_hooks';
let MonitoringService = MonitoringService_1 = class MonitoringService {
    constructor(redisService) {
        this.logger = new Logger(MonitoringService_1.name);
        this.redisService = redisService;
    }
    onModuleDestroy() {
        // Connection managed by UnifiedRedisService
    }
    /**
     * Increments a counter metric.
     */
    async increment(key, labels = {}) {
        const serializedLabels = this.serializeLabels(labels);
        await this.redisService.hincrby('counters', `${key}:${serializedLabels}`, 1);
    }
    /**
     * Records a timing measurement for a function.
     */
    async recordTime(key, fn, labels = {}) {
        const start = performance.now();
        try {
            return await fn();
        }
        finally {
            const duration = performance.now() - start;
            const serializedLabels = this.serializeLabels(labels);
            await this.redisService.lpush(`timings:${key}:${serializedLabels}`, duration.toString());
        }
    }
    /**
     * Calculates system health metrics.
     */
    async getSystemHealth() {
        // This is a simplified example. A real implementation would require
        // more sophisticated data aggregation and analysis.
        const responseTimes = await this.getTimingStats('api.response');
        const messageCounts = await this.getCounterStats('message.type');
        const errorRates = await this.getCounterStats('error.type');
        return {
            responseTimes,
            messageCounts,
            errorRates,
        };
    }
    async getTimingStats(key) {
        const timings = await this.redisService.lrange(`timings:${key}`, 0, -1);
        const numbers = timings.map(Number).sort((a, b) => a - b);
        if (numbers.length === 0)
            return { avg: 0, p95: 0, p99: 0 };
        const sum = numbers.reduce((acc, val) => acc + val, 0);
        const avg = sum / numbers.length;
        const p95 = this.calculatePercentile(numbers, 95);
        const p99 = this.calculatePercentile(numbers, 99);
        return { avg, p95, p99 };
    }
    async getCounterStats(keyPrefix) {
        const counters = await this.redisService.hgetall('counters');
        let total = 0;
        const byType = {};
        for (const [field, value] of Object.entries(counters)) {
            if (field.startsWith(keyPrefix)) {
                const type = field.split(':')[1] || 'unknown';
                const count = Number(value);
                total += count;
                byType[type] = (byType[type] || 0) + count;
            }
        }
        return { total, byType };
    }
    calculatePercentile(arr, percentile) {
        if (arr.length === 0)
            return 0;
        const index = (percentile / 100) * (arr.length - 1);
        const floor = Math.floor(index);
        const ceil = Math.ceil(index);
        if (floor === ceil)
            return arr[floor];
        const d0 = arr[floor] * (ceil - index);
        const d1 = arr[ceil] * (index - floor);
        return d0 + d1;
    }
    serializeLabels(labels) {
        return Object.entries(labels).map(([k, v]) => `${k}=${v}`).join(',');
    }
};
MonitoringService = MonitoringService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [UnifiedRedisService])
], MonitoringService);
export { MonitoringService };
//# sourceMappingURL=monitoring.js.map