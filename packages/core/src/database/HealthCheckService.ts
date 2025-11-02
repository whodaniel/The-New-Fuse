import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthStatus {
  status: 'ok' | 'warning' | 'error';
  message?: string;
  details?: {
    responseTime?: number;
    // Additional metrics can be added here, e.g., connection pool stats
  };
}

@Injectable()
export class DatabaseHealthCheckService {
  private readonly logger = new Logger(DatabaseHealthCheckService.name);
  private lastHealthStatus: HealthStatus = { status: 'ok' };

  constructor(private readonly prisma: PrismaService) {
    // Perform a health check every minute
    setInterval(() => this.performCheck(), 60000);
    this.performCheck(); // Initial check
  }

  async performCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    try {
      // A simple query to check if the database is responsive
      await this.prisma.$queryRaw`SELECT 1`;

      const responseTime = Date.now() - startTime;
      const health: HealthStatus = {
        status: 'ok',
        details: { responseTime },
      };

      if (responseTime > 1000) {
        health.status = 'warning';
        health.message = 'Database response time is high.';
      }

      this.lastHealthStatus = health;
      this.logger.debug('Database health check successful.', health);
      return health;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const health: HealthStatus = {
        status: 'error',
        message: 'Database connection failed.',
        details: { responseTime },
      };
      this.lastHealthStatus = health;
      this.logger.error('Database health check failed:', error.stack);
      return health;
    }
  }

  getHealthStatus(): HealthStatus {
    return this.lastHealthStatus;
  }
}
