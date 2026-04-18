import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { drizzleApiLogsRepository } from '@the-new-fuse/database';
import { Roles } from '../../../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../auth/guards/roles.guard.js';

@ApiTags('admin')
@Controller('admin/api-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
export class AdminMetricsController {
  @Get('logs')
  @ApiOperation({ summary: 'Get recent API logs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentLogs(@Query('limit') limit: number = 50) {
    return drizzleApiLogsRepository.getRecentLogs(limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get API statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getStats(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Aggregated Stats
    const statsArray = await drizzleApiLogsRepository.getStats(start, end);
    const stats = statsArray[0] || { count: 0, avgDuration: 0, errorCount: 0 };

    // Status Distribution
    const statusDist = await drizzleApiLogsRepository.getStatusCodeDistribution(start, end);

    // Method Distribution
    const methodDist = await drizzleApiLogsRepository.getMethodDistribution(start, end);

    // Top Endpoints
    const topEndpoints = await drizzleApiLogsRepository.getTopEndpoints(5, start, end);

    // Time Series (only if start/end provided, else default 24h)
    const seriesStart = start || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const seriesEnd = end || new Date();
    const timeSeries = await drizzleApiLogsRepository.getTimeSeriesData(seriesStart, seriesEnd);

    return {
      totalRequests: Number(stats.count),
      avgResponseTime: Number(stats.avgDuration) || 0,
      errorCount: Number(stats.errorCount),
      statusCodes: statusDist.map((s) => ({ status: s.status, count: Number(s.count) })),
      methods: methodDist.map((m) => ({ method: m.method, count: Number(m.count) })),
      topEndpoints: topEndpoints.map((e) => ({
        endpoint: e.endpoint,
        requests: Number(e.count),
        avgTime: Number(e.avgDuration) || 0,
        errors: Number(e.errorCount),
      })),
      timeSeries: timeSeries.map((t) => ({
        time: t.time, // format this as needed
        requests: Number(t.requests),
        errors: Number(t.errors),
        responseTime: Number(t.avgDuration) || 0,
      })),
    };
  }
}
