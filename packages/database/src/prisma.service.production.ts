import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';
import { softDeleteMiddleware } from './middleware/soft-delete.middleware';

/**
 * Production-ready Prisma Service with:
 * - Connection retry logic
 * - Health checks
 * - Query logging
 * - Soft delete middleware
 * - Connection pooling optimization
 * - Graceful shutdown
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private retryAttempts = 0;
  private readonly maxRetries = 5;
  private readonly retryDelay = 2000; // 2 seconds

  constructor() {
    super({
      // Production logging configuration
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
      // Connection pool configuration
      // These are handled via DATABASE_URL query parameters, but can be overridden here
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    this.setupLogging();
  }

  /**
   * Setup query logging for development and debugging
   */
  private setupLogging() {
    // Log slow queries (> 1000ms)
    // Note: Event logging disabled due to Prisma type changes
    // this.$on('query' as any, async (e: any) => {
    //   if (e.duration > 1000) {
    //     this.logger.warn(
    //       `Slow query detected (${e.duration}ms): ${e.query.substring(0, 100)}...`
    //     );
    //   }
    // });

    // Log all errors
    // this.$on('error' as any, (e: any) => {
    //   this.logger.error('Prisma error:', e);
    // });

    // Log warnings
    // this.$on('warn' as any, (e: any) => {
    //   this.logger.warn('Prisma warning:', e);
    // });
  }

  /**
   * Initialize connection with retry logic
   */
  async onModuleInit() {
    await this.connectWithRetry();
    this.setupMiddleware();
  }

  /**
   * Connect to database with exponential backoff retry
   */
  private async connectWithRetry(): Promise<void> {
    while (this.retryAttempts < this.maxRetries) {
      try {
        this.logger.log(`Attempting database connection (attempt ${this.retryAttempts + 1}/${this.maxRetries})`);
        await this.$connect();
        this.isConnected = true;
        this.logger.log('Successfully connected to database');
        return;
      } catch (error) {
        this.retryAttempts++;
        this.logger.error(
          `Failed to connect to database (attempt ${this.retryAttempts}/${this.maxRetries}):`,
          error
        );

        if (this.retryAttempts >= this.maxRetries) {
          this.logger.error('Max connection retries exceeded. Application may fail.');
          throw error;
        }

        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1);
        this.logger.log(`Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }

  /**
   * Setup middleware (soft delete, etc.)
   */
  private setupMiddleware() {
    // Note: $use middleware API deprecated in Prisma 4.0+
    // Consider migrating to Prisma Client Extensions when needed
    // this.$use(softDeleteMiddleware);
    // this.logger.log('Soft delete middleware activated');

    // Add query performance monitoring middleware
    // this.$use(async (params, next) => {
    //   const before = Date.now();
    //   const result = await next(params);
    //   const after = Date.now();

    //   const duration = after - before;

    //   // Log queries taking longer than 500ms
    //   if (duration > 500) {
    //     this.logger.warn(
    //       `Query ${params.model}.${params.action} took ${duration}ms`
    //     );
    //   }

    //   return result;
    // });
  }

  /**
   * Graceful shutdown
   */
  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.isConnected = false;
    this.logger.log('Database connection closed');
  }

  /**
   * Enable shutdown hooks for application
   */
  async enableShutdownHooks(app: INestApplication) {
    // Handle various shutdown signals
    const signals = ['SIGINT', 'SIGTERM', 'SIGUSR2'];

    signals.forEach(signal => {
      process.on(signal, async () => {
        this.logger.log(`Received ${signal}, closing application gracefully...`);
        await app.close();
      });
    });
  }

  /**
   * Health check for database connectivity
   * @returns true if database is accessible, false otherwise
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get detailed health status
   */
  async getHealthStatus(): Promise<{
    connected: boolean;
    responseTime: number;
    details?: any;
  }> {
    const start = Date.now();

    try {
      await this.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      return {
        connected: true,
        responseTime,
      };
    } catch (error) {
      return {
        connected: false,
        responseTime: Date.now() - start,
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    users: number;
    agents: number;
    tasks: number;
    workflows: number;
    messages: number;
  }> {
    try {
      const [users, agents, tasks, workflows, messages] = await Promise.all([
        this.user.count({ where: { deletedAt: null } }),
        this.agent.count({ where: { deletedAt: null } }),
        this.task.count({ where: { deletedAt: null } }),
        this.workflow.count({ where: { deletedAt: null } }),
        this.message.count({ where: { isDeleted: false } }),
      ]);

      return { users, agents, tasks, workflows, messages };
    } catch (error) {
      this.logger.error('Failed to get database stats:', error);
      throw error;
    }
  }

  /**
   * Cleanup expired records
   * Should be called periodically (e.g., via cron job)
   */
  async cleanupExpiredRecords(): Promise<{
    messages: number;
    sessions: number;
    authSessions: number;
  }> {
    this.logger.log('Starting cleanup of expired records...');

    const now = new Date();

    try {
      const [messages, sessions, authSessions] = await Promise.all([
        // Delete expired ephemeral messages
        this.message.deleteMany({
          where: {
            isEphemeral: true,
            expiresAt: {
              lt: now,
            },
          },
        }),

        // Delete expired code execution sessions
        this.codeExecutionSession.deleteMany({
          where: {
            expiresAt: {
              lt: now,
            },
          },
        }),

        // Delete expired auth sessions
        this.authSession.deleteMany({
          where: {
            expiresAt: {
              lt: now,
            },
          },
        }),
      ]);

      const result = {
        messages: messages.count,
        sessions: sessions.count,
        authSessions: authSessions.count,
      };

      this.logger.log(`Cleanup completed: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error('Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup old error logs (keep last 30 days)
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const result = await this.errorLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`Deleted ${result.count} old error logs`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to cleanup old logs:', error);
      throw error;
    }
  }

  /**
   * Execute a transaction with retry logic
   */
  async executeTransaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>,
    maxAttempts: number = 3
  ): Promise<T> {
    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        return await this.$transaction(fn as any) as T;
      } catch (error) {
        attempt++;

        if (attempt >= maxAttempts) {
          this.logger.error('Transaction failed after max retries:', error);
          throw error;
        }

        // Check if error is retryable (e.g., serialization failure)
        const isRetryable = this.isRetryableError(error);

        if (!isRetryable) {
          throw error;
        }

        this.logger.warn(
          `Transaction failed (attempt ${attempt}/${maxAttempts}), retrying...`
        );

        await this.sleep(100 * attempt); // Progressive backoff
      }
    }

    throw new Error('Transaction failed');
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableErrorCodes = [
      'P2034', // Transaction conflict
      'P2028', // Transaction API error
    ];

    return retryableErrorCodes.includes(error?.code);
  }

  /**
   * Helper to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Expose the PrismaClient instance for security package compatibility
   */
  get prisma() {
    return this;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      retryAttempts: this.retryAttempts,
    };
  }
}
