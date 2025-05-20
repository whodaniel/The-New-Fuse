/**
 * Consolidated Health Check Controller
 * Provides standardized health check endpoints for all API services
 */

import { Controller, Get } from '@nestjs/common';
import { HealthService, HealthIndicatorResult } from '../services/health.service.js';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check API health' })
  async check(): Promise<HealthIndicatorResult> {
    const results = await Promise.all([
      this.healthService.check('api'),
      // Add more health checks as needed
    ]);
    
    // Merge all results into a single object
    return results.reduce((acc, result) => ({ ...acc, ...result }), {});
  }

  @Get('db')
  @ApiOperation({ summary: 'Check database health' })
  async checkDatabase(): Promise<HealthIndicatorResult> {
    return this.healthService.check('database');
  }

  @Get('memory')
  @ApiOperation({ summary: 'Check memory usage' })
  async checkMemory(): Promise<HealthIndicatorResult> {
    return this.healthService.check('memory');
  }

  @Get('disk')
  @ApiOperation({ summary: 'Check disk usage' })
  async checkDisk(): Promise<HealthIndicatorResult> {
    return this.healthService.check('disk');
  }
}