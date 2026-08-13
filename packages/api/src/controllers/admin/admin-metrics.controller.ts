/**
 * Admin Metrics Controller
 */

import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../modules/guards/jwt-auth.guard.js';
import { ApiLogsRepository } from '../../repositories/api-logs.repository.js';
import { SystemMetricsService } from '../../services/system-metrics.service.js';
import { toError } from '../../utils/error.js';

@ApiTags('admin', 'system')
@Controller()
@UseGuards(JwtAuthGuard)
export class AdminMetricsController {
  constructor(
    private readonly systemMetricsService: SystemMetricsService,
    private readonly apiLogsRepository: ApiLogsRepository
  ) {}

  @Get('system/metrics')
  @ApiOperation({ summary: 'Get real-time system metrics' })
  async getSystemMetrics(@Res() res: Response) {
    try {
      const metrics = await this.systemMetricsService.getMetrics();
      return res.status(200).json(metrics);
    } catch (error) {
      const err = toError(error);
      return res.status(500).json({ error: err.message });
    }
  }

  @Get('admin/api-analytics/stats')
  @ApiOperation({ summary: 'Get detailed API analytics' })
  async getApiAnalytics(@Query('range') range: string, @Res() res: Response) {
    try {
      // Parse range (1h, 24h, 7d, 30d)
      let hours = 24;
      if (range === '1h') hours = 1;
      else if (range === '7d') hours = 7 * 24;
      else if (range === '30d') hours = 30 * 24;

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
    } catch (error) {
      const err = toError(error);
      return res.status(500).json({ error: err.message });
    }
  }
}
