/**
 * Health Check Controller
 * Provides health check endpoints for the application
 */

import { Controller, Get, Res } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { Response } from 'express';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../services/prisma.service.js';

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