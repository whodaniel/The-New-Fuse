'use strict';
/**
 * NestJS Metrics Controller Template
 * Provides Prometheus metrics endpoint for NestJS applications
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.metricsControllerExample = exports.MetricsControllerTemplate = void 0;
class MetricsControllerTemplate {
  /**
   * Prometheus metrics endpoint
   */
  static async metrics(metricsService) {
    if (!metricsService) {
      return '# No metrics available\n';
    }
    return metricsService.getMetrics();
  }
  /**
   * Get content type for metrics
   */
  static getContentType(metricsService) {
    if (!metricsService) {
      return 'text/plain';
    }
    return metricsService.getContentType();
  }
}
exports.MetricsControllerTemplate = MetricsControllerTemplate;
/**
 * Example NestJS controller implementation
 */
exports.metricsControllerExample = `
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
//# sourceMappingURL=metrics.controller.js.map
