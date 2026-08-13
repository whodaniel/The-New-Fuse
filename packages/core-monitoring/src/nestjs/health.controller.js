'use strict';
/**
 * NestJS Health Check Controller Template
 * Provides health check endpoints for NestJS applications
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.healthControllerExample = exports.HealthControllerTemplate = void 0;
/**
 * Health controller template
 * This provides the structure for implementing health checks in NestJS
 */
class HealthControllerTemplate {
  /**
   * Basic liveness probe
   * Returns 200 if the application is running
   */
  static async liveness() {
    return {
      status: 'ok',
    };
  }
  /**
   * Readiness probe
   * Returns 200 if the application is ready to serve traffic
   */
  static async readiness(healthCheckService) {
    if (!healthCheckService) {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
      };
    }
    const health = await healthCheckService.check();
    return {
      status: health.status,
      timestamp: health.timestamp.toISOString(),
      uptime: health.uptime,
      version: health.version,
      services: health.services,
      metrics: health.metrics,
    };
  }
  /**
   * Detailed health check
   * Returns detailed health information
   */
  static async health(healthCheckService) {
    return this.readiness(healthCheckService);
  }
  /**
   * Startup probe
   * Returns 200 when the application has completed initialization
   */
  static async startup(startupComplete = true) {
    if (!startupComplete) {
      throw new Error('Application not ready');
    }
    return {
      status: 'ready',
    };
  }
}
exports.HealthControllerTemplate = HealthControllerTemplate;
/**
 * Example NestJS controller implementation
 */
exports.healthControllerExample = `
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from '@the-new-fuse/core-monitoring';
import { HealthControllerTemplate } from '@the-new-fuse/core-monitoring/nestjs';

@Controller('health')
export class HealthController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get('live')
  async liveness() {
    return HealthControllerTemplate.liveness();
  }

  @Get('ready')
  async readiness() {
    return HealthControllerTemplate.readiness(this.healthCheckService);
  }

  @Get()
  async health() {
    return HealthControllerTemplate.health(this.healthCheckService);
  }

  @Get('startup')
  async startup() {
    return HealthControllerTemplate.startup(true);
  }
}
`;
//# sourceMappingURL=health.controller.js.map
