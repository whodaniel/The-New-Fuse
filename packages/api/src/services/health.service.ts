/**
 * Health check service
 * Monitors the health of application dependencies
 * Updated to use Drizzle ORM instead of Drizzle
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from './database.service.js';
import { HealthIndicator } from '@nestjs/terminus';
import { toError } from '../utils/error.js';

// Local type definitions to avoid cross-package import issues
interface HealthIndicatorResult {
  [key: string]: {
    status: string;
    message?: string;
  };
}

class HealthCheckError extends Error {
  constructor(message: string, public causes: HealthIndicatorResult) {
    super(message);
  }
}

@Injectable()
export class HealthService extends HealthIndicator {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly database: DatabaseService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check database connection using Drizzle
      const isHealthy = await this.database.healthCheck();
      if (!isHealthy) {
        throw new Error('Database connection check failed');
      }
      this.logger.log('Database health check successful');
      return this.getStatus(key, true);
    } catch (error) {
      const err = toError(error);
      this.logger.error('Database health check failed', err.stack);
      throw new HealthCheckError(
        'Database health check failed',
        this.getStatus(key, false, { message: `Database connection failed: ${err.message}` })
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