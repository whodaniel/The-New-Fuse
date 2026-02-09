/**
 * Database Service
 * Handles database connections using Drizzle ORM
 * This replaces the legacy PrismaService
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { 
  DRIZZLE_CLIENT, 
  type DrizzleClient,
  sql 
} from '@the-new-fuse/database';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  /**
   * Get the database client instance
   */
  get client(): DrizzleClient {
    return this.db;
  }

  /**
   * Initialize connection when module starts
   */
  async onModuleInit() {
    this.logger.log('Initializing database connection...');

    try {
      // Test the connection
      await this.healthCheck();
      this.logger.log('Database connection established');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to connect to database: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Close connection when module shuts down
   */
  async onModuleDestroy() {
    this.logger.log('Database service shutting down...');
    // postgres.js handles cleanup automatically
  }

  /**
   * Execute a raw SQL query
   */
  async executeRaw<T = unknown>(query: string): Promise<T[]> {
    return this.db.execute(sql.raw(query)) as Promise<T[]>;
  }

  /**
   * Health check - verify database connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Enable shutdown hooks for graceful shutdown
   */
  async enableShutdownHooks(app: any): Promise<void> {
    this.logger.log('Enabling shutdown hooks...');
    
    // Handle SIGINT
    process.on('SIGINT', async () => {
      this.logger.log('Received SIGINT, shutting down...');
      await app.close();
    });

    // Handle SIGTERM
    process.on('SIGTERM', async () => {
      this.logger.log('Received SIGTERM, shutting down...');
      await app.close();
    });
  }
}

// Export the service class as default as well
export default DatabaseService;
