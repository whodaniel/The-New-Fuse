/**
 * Health Check Controller
 * Provides health check endpoints for the application
 */

import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service.js';
// Use our local implementation instead of @nestjs/terminus
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '../modules/health/terminus.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthCheckService,
    private readonly db: PrismaHealthIndicator,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Basic health check endpoint using Terminus
   * @returns Health check status
   */
  @Get()
  @HealthCheck()
  async healthCheck(): Promise<any> {
    return this.healthService.check([
      () => this.db.pingCheck('database', { query: async () => this.prisma.$queryRaw`SELECT 1` }),
    ]);
  }

  /**
   * Detailed health check endpoint (can be removed if Terminus provides enough detail)
   * Or kept for custom detailed checks
   */
  // @Get('details')
  // async detailedHealthCheck(): Promise<HealthCheckResult> {
  //   const terminusResult = await this.healthCheck();
  //   return { /* transformed data */ } as HealthCheckResult;
  // }
}