import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner, IsolationLevel } from 'typeorm';
import { LoggerService } from '../logging/LoggerService.js';
import { MetricsService } from '../monitoring/MetricsService.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheManager } from './CacheManager.js';

interface TransactionOptions {
  isolation?: IsolationLevel;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  invalidateCache?: boolean;
  cachePatterns?: string[];
}

interface SavePoint {
  name: string;
  timestamp: Date;
}

@Injectable()
export class TransactionManager {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheManager: CacheManager,
  ) {}

  async transaction<T>(
    operation: (entityManager: EntityManager) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const {
      isolation = 'READ COMMITTED',
      timeout = 5000,
      retryCount = 3,
      retryDelay = 100,
      invalidateCache = false,
      cachePatterns = [],
    } = options;

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < retryCount) {
      const queryRunner = this.dataSource.createQueryRunner();
      const startTime = Date.now();
      let result: T;

      try {
        await queryRunner.connect();
        await queryRunner.startTransaction(isolation);

        // Set statement timeout
        await queryRunner.query(`SET LOCAL statement_timeout = ${timeout}`);

        result = await operation(queryRunner.manager);
        await queryRunner.commitTransaction();

        const duration = Date.now() - startTime;
        this.metrics.timing('database.transaction.duration', duration);
        this.metrics.increment('database.transaction.success');

        // Invalidate cache if needed
        if (invalidateCache) {
          await this.invalidateCache(cachePatterns);
        }

        this.eventEmitter.emit('transaction.completed', {
          duration,
          isolation,
          success: true,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.metrics.timing('database.transaction.duration', duration);
        this.metrics.increment('database.transaction.failed');

        this.logger.error('Transaction failed:', {
          attempt: attempt + 1,
          isolation,
          error: error.message,
          duration,
        });

        await queryRunner.rollbackTransaction();
        lastError = error;

        if (this.shouldRetry(error)) {
          attempt++;
          if (attempt < retryCount) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            continue;
          }
        } else {
          break;
        }
      } finally {
        await queryRunner.release();
      }
    }

    throw lastError || new Error('Transaction failed after retries');
  }

  async withSavePoints<T>(
    operation: (manager: EntityManager, createSavePoint: (name: string) => Promise<void>) => Promise<T>
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    const savePoints: SavePoint[] = [];

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const createSavePoint = async (name: string) => {
        await queryRunner.query(`SAVEPOINT ${name}`);
        savePoints.push({ name, timestamp: new Date() });
      };

      const result = await operation(queryRunner.manager, createSavePoint);
      await queryRunner.commitTransaction();

      this.metrics.increment('database.transaction.savepoints.success');
      return result;
    } catch (error) {
      if (savePoints.length > 0) {
        const lastSavePoint = savePoints[savePoints.length - 1];
        await queryRunner.query(`ROLLBACK TO SAVEPOINT ${lastSavePoint.name}`);
        
        this.logger.info(`Rolled back to savepoint: ${lastSavePoint.name}`, {
          timestamp: lastSavePoint.timestamp,
        });
      } else {
        await queryRunner.rollbackTransaction();
      }

      this.metrics.increment('database.transaction.savepoints.failed');
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async invalidateCache(patterns: string[]): Promise<void> {
    try {
      const defaultPatterns = ['*'];
      const patternsToInvalidate = patterns.length > 0 ? patterns : defaultPatterns;

      await Promise.all(
        patternsToInvalidate.map(pattern => this.cacheManager.invalidatePattern(pattern))
      );

      this.metrics.increment('database.transaction.cache_invalidation.success');
    } catch (error) {
      this.logger.error('Failed to invalidate cache:', error);
      this.metrics.increment('database.transaction.cache_invalidation.failed');
    }
  }

  private shouldRetry(error: any): boolean {
    const retryableErrors = [
      'deadlock detected',
      'could not serialize access',
      'concurrent update',
      'lock timeout',
    ];

    return retryableErrors.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  async isTransactionActive(queryRunner: QueryRunner): Promise<boolean> {
    try {
      const result = await queryRunner.query(
        'SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE state = $1)',
        ['active']
      );
      return result[0].exists;
    } catch {
      return false;
    }
  }

  async getCurrentTransactions(): Promise<{
    total: number;
    active: number;
    idle: number;
    blocked: number;
  }> {
    const stats = await this.dataSource.query(`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle,
        count(*) FILTER (WHERE waiting = true) as blocked
      FROM pg_stat_activity 
      WHERE backend_type = 'client backend'
    `);

    return {
      total: parseInt(stats[0].total),
      active: parseInt(stats[0].active),
      idle: parseInt(stats[0].idle),
      blocked: parseInt(stats[0].blocked),
    };
  }
}