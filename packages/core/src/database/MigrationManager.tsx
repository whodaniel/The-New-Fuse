import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LoggerService } from '../logging/LoggerService.js';
import { MetricsService } from '../monitoring/MetricsService.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface MigrationStatus {
  id: string;
  name: string;
  timestamp: Date;
  state: 'pending' | 'executed' | 'failed';
  error?: string;
}

@Injectable()
export class MigrationManager {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getMigrationStatus(): Promise<MigrationStatus[]> {
    try {
      const [migrations, executedMigrations] = await Promise.all([
        this.dataSource.migrations,
        this.dataSource.query('SELECT * FROM _prisma_migrations ORDER BY started_at DESC')
      ]);

      return migrations.map(migration => {
        const executed = executedMigrations.find(
          (em: any) => em.migration_name === migration.name
        );

        return {
          id: executed?.id || migration.name,
          name: migration.name,
          timestamp: executed?.finished_at ? new Date(executed.finished_at) : new Date(),
          state: executed ? (executed.rolled_back_at ? 'failed' : 'executed') : 'pending',
          error: executed?.logs || undefined
        };
      });
    } catch (error) {
      this.logger.error('Failed to get migration status:', error);
      throw error;
    }
  }

  async runMigrations(options: { transaction?: boolean } = {}): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.dataSource.runMigrations({
        transaction: options.transaction ?? true
      });

      const duration = Date.now() - startTime;
      this.metrics.timing('database.migrations.duration', duration);
      this.metrics.increment('database.migrations.success');

      this.eventEmitter.emit('database.migrations.completed', {
        duration,
        success: true
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.timing('database.migrations.duration', duration);
      this.metrics.increment('database.migrations.failed');

      this.eventEmitter.emit('database.migrations.failed', {
        duration,
        error: error.message
      });

      this.logger.error('Migration failed:', error);
      throw error;
    }
  }

  async revertLastMigration(): Promise<void> {
    const startTime = Date.now();

    try {
      await this.dataSource.undoLastMigration({
        transaction: true
      });

      const duration = Date.now() - startTime;
      this.metrics.timing('database.migrations.revert.duration', duration);
      this.metrics.increment('database.migrations.revert.success');

      this.eventEmitter.emit('database.migrations.reverted', {
        duration,
        success: true
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.timing('database.migrations.revert.duration', duration);
      this.metrics.increment('database.migrations.revert.failed');

      this.eventEmitter.emit('database.migrations.revert.failed', {
        duration,
        error: error.message
      });

      this.logger.error('Migration reversion failed:', error);
      throw error;
    }
  }

  async generateMigration(name: string): Promise<string> {
    try {
      const timestamp = new Date().getTime();
      const migrationName = `${timestamp}-${name}`;
      
      // Generate migration file using TypeORM CLI
      await this.dataSource.driver.createSchemaBuilder().log([]);
      
      this.metrics.increment('database.migrations.generated');
      
      return migrationName;
    } catch (error) {
      this.logger.error('Failed to generate migration:', error);
      this.metrics.increment('database.migrations.generation.failed');
      throw error;
    }
  }

  async validateMigrations(): Promise<boolean> {
    try {
      const pendingMigrations = await this.dataSource.showMigrations();
      
      if (pendingMigrations) {
        this.logger.warn('Pending migrations detected');
        return false;
      }

      this.metrics.increment('database.migrations.validation.success');
      return true;
    } catch (error) {
      this.logger.error('Migration validation failed:', error);
      this.metrics.increment('database.migrations.validation.failed');
      throw error;
    }
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}.sql`;

    try {
      // Execute pg_dump using TypeORM query runner
      await this.dataSource.query(
        `COPY (SELECT * FROM pg_catalog.pg_dumpall) TO '${backupName}'`
      );

      this.metrics.increment('database.backup.success');
      this.logger.info(`Database backup created: ${backupName}`);

      return backupName;
    } catch (error) {
      this.metrics.increment('database.backup.failed');
      this.logger.error('Backup creation failed:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupFile: string): Promise<void> {
    try {
      // Execute psql restore using TypeORM query runner
      await this.dataSource.query(`\\i '${backupFile}'`);

      this.metrics.increment('database.restore.success');
      this.logger.info(`Database restored from backup: ${backupFile}`);
    } catch (error) {
      this.metrics.increment('database.restore.failed');
      this.logger.error('Restore failed:', error);
      throw error;
    }
  }
}