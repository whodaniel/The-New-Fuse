import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@the-new-fuse/database/generated/prisma';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
      // Connection pool settings are now handled by the pg Pool
      // Default connection limit is calculated based on: num_physical_cpus * 2 + effective_spindle_count
      // For production, consider: connection_limit = ((core_count * 2) + effective_spindle_count)
    });

    // Log slow queries for performance monitoring
    this.$on('query' as any, (e: any) => {
      if (e.duration > 1000) {
        // Log queries taking more than 1 second
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
