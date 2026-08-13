/**
 * NestJS Metrics Controller Template
 * Provides Prometheus metrics endpoint for NestJS applications
 */
export declare class MetricsControllerTemplate {
    /**
     * Prometheus metrics endpoint
     */
    static metrics(metricsService?: any): Promise<string>;
    /**
     * Get content type for metrics
     */
    static getContentType(metricsService?: any): string;
}
/**
 * Example NestJS controller implementation
 */
export declare const metricsControllerExample = "\nimport { Controller, Get, Header } from '@nestjs/common';\nimport { PrometheusMetrics } from '@the-new-fuse/core-monitoring';\nimport { MetricsControllerTemplate } from '@the-new-fuse/core-monitoring/nestjs';\n\n@Controller('metrics')\nexport class MetricsController {\n  constructor(private readonly metricsService: PrometheusMetrics) {}\n\n  @Get()\n  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')\n  async metrics() {\n    return MetricsControllerTemplate.metrics(this.metricsService);\n  }\n}\n";
//# sourceMappingURL=metrics.controller.d.ts.map