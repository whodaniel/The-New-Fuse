/**
 * NestJS Metrics Controller Template
 * Provides Prometheus metrics endpoint for NestJS applications
 */

export class MetricsControllerTemplate {
  /**
   * Prometheus metrics endpoint
   */
  static async metrics(metricsService?: any): Promise<string> {
    if (!metricsService) {
      return '# No metrics available\n';
    }

    return metricsService.getMetrics();
  }

  /**
   * Get content type for metrics
   */
  static getContentType(metricsService?: any): string {
    if (!metricsService) {
      return 'text/plain';
    }

    return metricsService.getContentType();
  }
}

/**
 * Example NestJS controller implementation
 */
export const metricsControllerExample = `
import { Controller, Get, Header } from '@nestjs/common';
import { PrometheusMetrics } from '@the-new-fuse/core-monitoring';
import { MetricsControllerTemplate } from '@the-new-fuse/core-monitoring/nestjs';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: PrometheusMetrics) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async metrics() {
    return MetricsControllerTemplate.metrics(this.metricsService);
  }
}
`;
