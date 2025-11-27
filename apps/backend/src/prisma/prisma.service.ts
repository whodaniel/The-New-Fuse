import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@the-new-fuse/database/generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
      // Connection pooling configuration
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Connection pool settings for optimal performance
      // These settings can be tuned based on your database resources
      // Default connection limit is calculated based on: num_physical_cpus * 2 + effective_spindle_count
      // For production, consider: connection_limit = ((core_count * 2) + effective_spindle_count)
    });

    // Log slow queries for performance monitoring
    this.$on('query' as any, (e: any) => {
      if (e.duration > 1000) { // Log queries taking more than 1 second
        this.logger.warn(`Slow query detected (${e.duration}ms): ${e.query}`);
      }
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connection pool initialized');

    // Enable query logging in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as any, (e: any) => {
        this.logger.debug(`Query: ${e.query} - Duration: ${e.duration}ms`);
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection pool closed');
  }

  /**
   * Enable read replica support for read-heavy operations
   * Use this method for read operations to distribute load
   */
  async enableReadReplica() {
    // This can be extended to support read replicas
    // For now, it's a placeholder for future implementation
    return this;
  }
}
