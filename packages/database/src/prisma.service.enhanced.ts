/**
 * Enhanced Prisma Service with Soft Delete and Advanced Features
 *
 * This service extends the standard PrismaService with:
 * - Soft delete middleware
 * - Query logging
 * - Error handling
 * - Performance monitoring
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '../generated/prisma';
import { ConfigService } from '@nestjs/config';
import { withDeleted, hardDelete, restoreRecord } from './middleware/soft-delete.middleware';

@Injectable()
export class PrismaServiceEnhanced extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaServiceEnhanced.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    // Connect to database
    await this.$connect();
    this.logger.log('Database connected successfully');

    // Note: Prisma middleware ($use) is not available in this version
    // Soft delete functionality will need to be implemented at the service level
    this.logger.warn('Prisma middleware not available - soft delete will be handled manually');

    // Setup event listeners for logging
    this.$on('query' as never, (e: any) => {
      if (process.env.LOG_QUERIES === 'true') {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      }
    });

    this.$on('error' as never, (e: any) => {
      this.logger.error('Prisma error:', e);
    });

    this.$on('warn' as never, (e: any) => {
      this.logger.warn('Prisma warning:', e);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Execute callback with deleted records included
   */
  async withDeleted<T>(callback: (prisma: this) => Promise<T>): Promise<T> {
    return withDeleted(this, callback);
  }

  /**
   * Perform hard delete operation
   */
  async hardDelete<T>(callback: (prisma: this) => Promise<T>): Promise<T> {
    return hardDelete(this, callback);
  }

  /**
   * Restore a soft-deleted record
   */
  async restore(model: string, where: any): Promise<any> {
    const modelInstance = (this as any)[model];
    if (!modelInstance) {
      throw new Error(`Model ${model} not found`);
    }
    return restoreRecord(modelInstance, where);
  }

  /**
   * Clean up expired ephemeral messages
   */
  async cleanupExpiredMessages(): Promise<number> {
    const result = await this.message.deleteMany({
      where: {
        isEphemeral: true,
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired messages`);
    return result.count;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.authSession.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired sessions`);
    return result.count;
  }

  /**
   * Clean up expired code execution sessions
   */
  async cleanupExpiredCodeSessions(): Promise<number> {
    const result = await this.codeExecutionSession.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
          not: null,
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired code sessions`);
    return result.count;
  }

  /**
   * Get database health status
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    error?: string;
  }> {
    const start = Date.now();

    try {
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      const latency = Date.now() - start;

      return {
        status: 'unhealthy',
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<{
    users: { total: number; active: number; deleted: number };
    agents: { total: number; active: number; deleted: number };
    workflows: { total: number; active: number; deleted: number };
    messages: { total: number; ephemeral: number };
  }> {
    const [users, agents, workflows, allMessages, ephemeralMessages] = await Promise.all([
      this.getSoftDeleteStats('user'),
      this.getSoftDeleteStats('agent'),
      this.getSoftDeleteStats('workflow'),
      this.withDeleted(async (db) => db.message.count()),
      this.message.count({ where: { isEphemeral: true } }),
    ]);

    return {
      users,
      agents,
      workflows,
      messages: {
        total: allMessages,
        ephemeral: ephemeralMessages,
      },
    };
  }

  /**
   * Get soft delete statistics for a model
   */
  private async getSoftDeleteStats(
    modelName: string
  ): Promise<{ total: number; active: number; deleted: number }> {
    const model = (this as any)[modelName];

    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    const [total, deleted] = await Promise.all([
      this.withDeleted(async (db) => (db as any)[modelName].count()),
      model.count({
        where: {
          deletedAt: { not: null },
        },
      }),
    ]);

    return {
      total,
      active: total - deleted,
      deleted,
    };
  }
}
