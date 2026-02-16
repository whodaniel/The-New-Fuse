import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PerformanceMetricsService } from './performance-metrics.service';

/**
 * Monitoring Controller
 * Exposes endpoints for system health and monitoring dashboards
 */
@ApiTags('monitoring')
@Controller('api/monitoring')
export class MonitoringController {
  constructor(private readonly metricsService: PerformanceMetricsService) {}

  @Get('health')
  @ApiOperation({ summary: 'Get system health and overview metrics' })
  @ApiResponse({
    status: 200,
    description: 'System health and overview metrics',
  })
  async getHealth() {
    return this.metricsService.getDashboardMetrics();
  }
}
