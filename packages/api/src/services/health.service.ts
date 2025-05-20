/**
 * Health check service
 * Monitors the health of application dependencies
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { toError } from '../utils/error.js'; // Import the helper

@Injectable()
export class HealthService extends HealthIndicator {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      this.logger.log('Database health check successful');
      return this.getStatus(key, true);
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error('Database health check failed', err.stack); // Use err.stack
      throw new HealthCheckError(
        'Database health check failed',
        this.getStatus(key, false, { message: `Database connection failed: ${err.message}` }) // Use err.message
      );
    }
  }
  
  // Add other health checks as needed (e.g., external APIs, cache)
}

/**
 * Service health information
 */
export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  message: string;
}

/**
 * Overall health check result
 */
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    [key: string]: ServiceHealth;
  };
}