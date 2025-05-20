/**
 * Prisma Service
 * Handles database connections and provides the Prisma client
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  /**
   * Initialize connection when module starts
   */
  async onModuleInit() {
    this.logger.log('Connecting to database...');

    try {
      await this.$connect();
      this.logger.log('Database connection established');

      // Set up query logging in development
      if (process.env.NODE_ENV !== 'production') {
        // @ts-ignore - Prisma's $on method is not properly typed
        this.$on('query', (e: any) => {
          this.logger.debug(`Query: ${e.query}`);
          this.logger.debug(`Duration: ${e.duration}ms`);
        });
      }
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to connect to database: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Close connection when module shuts down
   */
  async onModuleDestroy() {
    this.logger.log('Closing database connection...');

    try {
      await this.$disconnect();
      this.logger.log('Database connection closed');
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error closing database connection: ${err.message}`, err.stack);
    }
  }
}

// Create a singleton instance
const prismaService = new PrismaService();

export default prismaService;
