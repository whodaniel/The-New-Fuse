/**
 * Health Controller
 * Health check endpoints that integrate with existing monitoring systems
 */

import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SyncHealthService } from './SyncHealthService';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly healthService: SyncHealthService) {}

  @Get('sync')
  @ApiOperation({ summary: 'Basic sync system health check' })
  @ApiResponse({ status: 200, description: 'System is healthy' })
  @ApiResponse({ status: 503, description: 'System is unhealthy' })
  async checkHealth() {
    try {
      const health = await this.healthService.checkHealth();
      return health;
    } catch (error) {
      this.logger.error('Health check failed', error);
      throw error;
    }
  }

  @Get('sync/ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'System is ready' })
  @ApiResponse({ status: 503, description: 'System is not ready' })
  async readinessProbe() {
    try {
      const health = await this.healthService.checkHealth();
      const ready = health.overall !== 'unhealthy';

      return {
        ready,
        status: health.overall,
        timestamp: health.timestamp,
      };
    } catch (error) {
      this.logger.error('Readiness probe failed', error);
      return {
        ready: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('sync/startup')
  @ApiOperation({ summary: 'Startup probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'System has started' })
  @ApiResponse({ status: 503, description: 'System is still starting' })
  async startupProbe() {
    try {
      // Simple startup check - verify services are initialized
      const started = this.healthService !== undefined;

      return {
        started,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Startup probe failed', error);
      return {
        started: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('sync/detailed')
  @ApiOperation({ summary: 'Detailed health metrics' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  async detailedHealth() {
    try {
      const [health, metrics] = await Promise.all([
        this.healthService.checkHealth(),
        this.healthService.getSyncHealthMetrics(),
      ]);

      return {
        health,
        metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Detailed health check failed', error);
      throw error;
    }
  }

  @Get('sync/history')
  @ApiOperation({ summary: 'Health check history' })
  @ApiResponse({ status: 200, description: 'Health check history' })
  async healthHistory() {
    try {
      const history = this.healthService.getHealthHistory();

      return {
        history,
        count: history.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get health history', error);
      throw error;
    }
  }
}
