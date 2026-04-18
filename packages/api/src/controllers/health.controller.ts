/**
 * Health Check Controller
 * Provides health check endpoints for the application
 */

import { Controller, Get } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from '../services/health.service.js';
// Local type definition to avoid cross-package import issues
interface HealthIndicatorResult {
  [key: string]: {
    status: string;
    message?: string;
  };
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
  ) {}

  /**
   * Basic health check endpoint using Terminus
   * @returns Health check status
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check API health' })
  async check(): Promise<HealthIndicatorResult> {
    return this.healthService.isHealthy('database');
  }
}
