/**
 * Admin Metrics Controller
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
import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/guards/jwt-auth.guard.js';
import { ApiLogsRepository } from '../../repositories/api-logs.repository.js';
import { SystemMetricsService } from '../../services/system-metrics.service.js';
import { toError } from '../../utils/error.js';
let AdminMetricsController = class AdminMetricsController {
    constructor(systemMetricsService, apiLogsRepository) {
        this.systemMetricsService = systemMetricsService;
        this.apiLogsRepository = apiLogsRepository;
    }
    async getSystemMetrics(res) {
        try {
            const metrics = await this.systemMetricsService.getMetrics();
            return res.status(200).json(metrics);
        }
        catch (error) {
            const err = toError(error);
            return res.status(500).json({ error: err.message });
        }
    }
    async getApiAnalytics(range, res) {
        try {
            // Parse range (1h, 24h, 7d, 30d)
            let hours = 24;
            if (range === '1h')
                hours = 1;
            else if (range === '7d')
                hours = 7 * 24;
            else if (range === '30d')
                hours = 30 * 24;
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);
            const [stats, statusCodes, methods, timeSeries, topEndpoints] = await Promise.all([
                this.apiLogsRepository.getStats(startDate, endDate),
                this.apiLogsRepository.getStatusCodeDistribution(startDate, endDate),
                this.apiLogsRepository.getMethodDistribution(startDate, endDate),
                this.apiLogsRepository.getTimeSeriesData(startDate, endDate),
                this.apiLogsRepository.getTopEndpoints(10, startDate, endDate),
            ]);
            const summary = stats[0] || { count: 0, avgDuration: 0, errorCount: 0 };
            const response = {
                totalRequests: Number(summary.count),
                errorCount: Number(summary.errorCount),
                avgResponseTime: Number(summary.avgDuration || 0),
                statusCodes: statusCodes.map((s) => ({ status: s.status, count: Number(s.count) })),
                methods: methods.map((m) => ({ method: m.method, count: Number(m.count) })),
                timeSeries: timeSeries.map((t) => ({
                    time: t.time,
                    requests: Number(t.requests),
                    errors: Number(t.errors),
                    responseTime: Number(t.avgDuration || 0),
                })),
                topEndpoints: topEndpoints.map((e) => ({
                    endpoint: e.endpoint,
                    requests: Number(e.count),
                    avgTime: Number(e.avgDuration || 0),
                    errors: Number(e.errorCount),
                })),
            };
            return res.status(200).json(response);
        }
        catch (error) {
            const err = toError(error);
            return res.status(500).json({ error: err.message });
        }
    }
};
__decorate([
    Get('system/metrics'),
    ApiOperation({ summary: 'Get real-time system metrics' }),
    __param(0, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminMetricsController.prototype, "getSystemMetrics", null);
__decorate([
    Get('admin/api-analytics/stats'),
    ApiOperation({ summary: 'Get detailed API analytics' }),
    __param(0, Query('range')),
    __param(1, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminMetricsController.prototype, "getApiAnalytics", null);
AdminMetricsController = __decorate([
    ApiTags('admin', 'system'),
    Controller(),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [SystemMetricsService,
        ApiLogsRepository])
], AdminMetricsController);
export { AdminMetricsController };
//# sourceMappingURL=admin-metrics.controller.js.map