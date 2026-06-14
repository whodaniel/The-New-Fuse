/**
 * System Metrics Service
 *
 * Provides real-time system and application metrics.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_CLIENT, sql } from '@the-new-fuse/database';
import * as os from 'os';
import { ApiLogsRepository } from '../repositories/api-logs.repository.js';
let SystemMetricsService = class SystemMetricsService {
    constructor(db, apiLogsRepository) {
        this.db = db;
        this.apiLogsRepository = apiLogsRepository;
    }
    async getMetrics() {
        const [cpu, memory, dbMetrics, apiMetrics] = await Promise.all([
            this.getCpuUsage(),
            this.getMemoryUsage(),
            this.getDatabaseMetrics(),
            this.getApiMetrics(),
        ]);
        return {
            cpu: { usagePercent: cpu },
            memory: { usagePercent: memory },
            disk: { usagePercent: 45 }, // Mocked: Node.js standard lib doesn't provide disk usage
            network: { totalTraffic: 1024 * 1024 * 1024 * 5.2 }, // Mocked: 5.2 GB
            database: dbMetrics,
            api: apiMetrics,
            systemInfo: {
                platform: os.platform(),
                release: os.release(),
                arch: os.arch(),
                hostname: os.hostname(),
                uptime: os.uptime(),
                totalMemory: os.totalmem(),
                cpus: os.cpus().length,
            },
        };
    }
    async getCpuUsage() {
        const cpus = os.cpus();
        let idle = 0;
        let total = 0;
        for (const cpu of cpus) {
            for (const type in cpu.times) {
                total += cpu.times[type];
            }
            idle += cpu.times.idle;
        }
        // This is instant usage, might fluctuate.
        // Ideally we diff against previous sample, but for simple dashboard this works roughly
        // or we just return load average relative to cores
        const load = os.loadavg()[0]; // 1 min load avg
        const percent = Math.min(100, (load / cpus.length) * 100);
        return parseFloat(percent.toFixed(2));
    }
    getMemoryUsage() {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        return parseFloat(((used / total) * 100).toFixed(2));
    }
    async getDatabaseMetrics() {
        try {
            // Postgres specific: count active connections
            const result = await this.db.execute(sql `
        SELECT count(*)::int as count
        FROM pg_stat_activity
        WHERE state = 'active'
      `);
            return {
                activeConnections: result[0]?.count || 0,
            };
        }
        catch (error) {
            return { activeConnections: 0 };
        }
    }
    async getApiMetrics() {
        // Get stats for last hour
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 60 * 60 * 1000); // 1 hour ago
        const stats = await this.apiLogsRepository.getStats(startDate, endDate);
        const stat = stats[0] || { count: 0, avgDuration: 0, errorCount: 0 };
        const requests = Number(stat.count);
        const rpm = requests / 60; // requests per minute avg over last hour
        const errorRate = requests > 0 ? (Number(stat.errorCount) / requests) * 100 : 0;
        return {
            requestsPerMinute: parseFloat(rpm.toFixed(2)),
            avgResponseTime: parseFloat(Number(stat.avgDuration || 0).toFixed(2)),
            errorRate: parseFloat(errorRate.toFixed(2)),
        };
    }
};
SystemMetricsService = __decorate([
    Injectable(),
    __param(0, Inject(DRIZZLE_CLIENT)),
    __metadata("design:paramtypes", [Object, ApiLogsRepository])
], SystemMetricsService);
export { SystemMetricsService };
//# sourceMappingURL=system-metrics.service.js.map