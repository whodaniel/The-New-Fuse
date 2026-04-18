import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PerformanceMetricsService } from './performance-metrics.service.js';

/**
 * Performance Metrics Controller
 * Exposes metrics endpoints for monitoring tools
 */
@ApiTags('monitoring')
@Controller('metrics')
export class PerformanceMetricsController {
  constructor(
    private readonly metricsService: PerformanceMetricsService,
  ) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({
    status: 200,
    description: 'Metrics in Prometheus format',
    type: String,
  })
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }

  @Get('json')
  @ApiOperation({ summary: 'Get metrics in JSON format' })
  @ApiResponse({
    status: 200,
    description: 'Metrics in JSON format',
  })
  async getMetricsJson() {
    return this.metricsService.getMetricsJson();
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current metric values' })
  @ApiResponse({
    status: 200,
    description: 'Current metric snapshots',
  })
  async getCurrentMetrics() {
    return this.metricsService.getCurrentMetrics();
  }
}
