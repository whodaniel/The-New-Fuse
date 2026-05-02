/**
 * NestJS Health Check Controller Template
 * Provides health check endpoints for NestJS applications
 */

export interface HealthEndpointResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services?: Record<string, any>;
  metrics?: Record<string, any>;
}

/**
 * Health controller template
 * This provides the structure for implementing health checks in NestJS
 */
export class HealthControllerTemplate {
  /**
   * Basic liveness probe
   * Returns 200 if the application is running
   */
  static async liveness(): Promise<{ status: string }> {
    return {
      status: 'ok',
    };
  }

  /**
   * Readiness probe
   * Returns 200 if the application is ready to serve traffic
   */
  static async readiness(healthCheckService?: any): Promise<HealthEndpointResponse> {
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
  static async health(healthCheckService?: any): Promise<HealthEndpointResponse> {
    return this.readiness(healthCheckService);
  }

  /**
   * Startup probe
   * Returns 200 when the application has completed initialization
   */
  static async startup(startupComplete: boolean = true): Promise<{ status: string }> {
    if (!startupComplete) {
      throw new Error('Application not ready');
    }

    return {
      status: 'ready',
    };
  }
}

/**
 * Example NestJS controller implementation
 */
export const healthControllerExample = `
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
