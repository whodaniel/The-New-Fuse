import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseManager } from './databaseManager.js';
import { Logger } from '@the-new-fuse/utils';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as path from 'path';
import * as fs from 'fs/promises';

interface MigrationMeta {
  name: string;
  timestamp: number;
  checksum: string;
  executedAt?: Date;
  duration?: number;
  status: 'pending' | 'success' | 'failed' | 'rolled_back';
}

@Injectable()
export class MigrationValidationService implements OnModuleInit {
  private logger = new Logger('MigrationValidationService');
  private readonly migrationsPath = path.join(__dirname, '..', 'migrations');
  
  constructor(
    private readonly dbManager: DatabaseManager,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async onModuleInit() {
    await this.setupMigrationTracking();
  }

  private async setupMigrationTracking() {
    const db = this.dbManager.getDataSource();
    await db.query(`
      CREATE TABLE IF NOT EXISTS migration_history (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        timestamp BIGINT NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        duration INTEGER,
        status VARCHAR(20) NOT NULL,
        error_message TEXT,
        backup_path TEXT,
        UNIQUE(name)
      );

      CREATE INDEX IF NOT EXISTS idx_migration_status 
      ON migration_history(status);

      CREATE TABLE IF NOT EXISTS migration_locks (
        id SERIAL PRIMARY KEY,
        locked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        locked_by VARCHAR(255) NOT NULL,
        migration_name VARCHAR(255) NOT NULL
      );
    `);
  }

  async validateMigration(migrationPath: string): Promise<boolean> {
    const content = await fs.readFile(migrationPath, 'utf8');
    const db = this.dbManager.getDataSource();
    let isValid = true;
    const issues = [];

    try {
      // Parse migration content
      const statements = this.parseMigrationStatements(content);
      
      // Start transaction for validation
      await db.query('BEGIN');
      
      for (const stmt of statements) {
        try {
          // Validate syntax without executing
          await db.query(`EXPLAIN ${stmt}`);
          
          // Check for potentially dangerous operations
          if (this.containsRiskyOperations(stmt)) {
            issues.push(`Warning: Migration contains risky operations: ${stmt}`);
          }
        } catch (error) {
          issues.push(`Invalid SQL statement: ${stmt}`);
          isValid = false;
        }
      }
      
      // Always rollback validation transaction
      await db.query('ROLLBACK');
      
      if (!isValid || issues.length > 0) {
        this.logger.warn('Migration validation issues:', issues);
      }
      
      return isValid;
    } catch (error) {
      await db.query('ROLLBACK');
      this.logger.error('Migration validation error:', error);
      return false;
    }
  }

  private containsRiskyOperations(sql: string): boolean {
    const riskyPatterns = [
      /DROP\s+TABLE(?!\s+IF\s+EXISTS)/i,
      /DROP\s+COLUMN(?!\s+IF\s+EXISTS)/i,
      /TRUNCATE/i,
      /DELETE\s+FROM\s+\w+(?!\s+WHERE)/i
    ];

    return riskyPatterns.some(pattern => pattern.test(sql));
  }

  private parseMigrationStatements(content: string): string[] {
    return content
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  async backupTableBeforeMigration(tableName: string): Promise<string> {
    const db = this.dbManager.getDataSource();
    const timestamp = Date.now();
    const backupTable = `${tableName}_backup_${timestamp}`;
    
    try {
      // Create backup with structure and data
      await db.query(`
        CREATE TABLE ${backupTable} 
        AS SELECT * FROM ${tableName}
      `);
      
      // Also backup indexes and constraints
      const tableInfo = await db.query(`
        SELECT indexdef 
        FROM pg_indexes 
        WHERE tablename = $1
      `, [tableName]);
      
      for (const idx of tableInfo) {
        await db.query(idx.indexdef.replace(tableName, backupTable));
      }
      
      return backupTable;
    } catch (error) {
      this.logger.error(`Failed to backup table ${tableName}:`, error);
      throw error;
    }
  }

  async rollbackMigration(migrationName: string): Promise<boolean> {
    const db = this.dbManager.getDataSource();
    
    try {
      // Get migration info
      const migration = await db.query(
        'SELECT * FROM migration_history WHERE name = $1',
        [migrationName]
      );
      
      if (!migration.length) {
        throw new Error(`Migration ${migrationName} not found`);
      }
      
      // Start rollback transaction
      await db.query('BEGIN');
      
      // Execute down migration if exists
      const downPath = path.join(
        this.migrationsPath,
        migrationName.replace('up', 'down')
      );
      
      if (await this.fileExists(downPath)) {
        const downContent = await fs.readFile(downPath, 'utf8');
        const statements = this.parseMigrationStatements(downContent);
        
        for (const stmt of statements) {
          await db.query(stmt);
        }
      }
      
      // Restore from backup if exists
      if (migration[0].backup_path) {
        const backupTables = await db.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name LIKE $1
        `, [`%_backup_%`]);
        
        for (const backup of backupTables) {
          const originalTable = backup.table_name.split('_backup_')[0];
          await db.query(`
            DROP TABLE IF EXISTS ${originalTable};
            ALTER TABLE ${backup.table_name} RENAME TO ${originalTable};
          `);
        }
      }
      
      // Update migration status
      await db.query(`
        UPDATE migration_history 
        SET status = 'rolled_back',
        executed_at = CURRENT_TIMESTAMP
        WHERE name = $1
      `, [migrationName]);
      
      await db.query('COMMIT');
      
      this.eventEmitter.emit('migration_rollback_success', {
        migration: migrationName,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      await db.query('ROLLBACK');
      this.logger.error(`Failed to rollback migration ${migrationName}:`, error);
      
      this.eventEmitter.emit('migration_rollback_failed', {
        migration: migrationName,
        error,
        timestamp: new Date()
      });
      
      return false;
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async getMigrationStatus(): Promise<MigrationMeta[]> {
    const db = this.dbManager.getDataSource();
    return db.query('SELECT * FROM migration_history ORDER BY timestamp DESC');
  }

  async acquireMigrationLock(migrationName: string, lockHolder: string): Promise<boolean> {
    const db = this.dbManager.getDataSource();
    
    try {
      await db.query(`
        INSERT INTO migration_locks (locked_by, migration_name)
        VALUES ($1, $2)
      `, [lockHolder, migrationName]);
      
      return true;
    } catch (error) {
      this.logger.warn(`Failed to acquire lock for migration ${migrationName}:`, error);
      return false;
    }
  }

  async releaseMigrationLock(migrationName: string, lockHolder: string): Promise<void> {
    const db = this.dbManager.getDataSource();
    
    await db.query(`
      DELETE FROM migration_locks
      WHERE migration_name = $1 AND locked_by = $2
    `, [migrationName, lockHolder]);
  }
}