import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseManager } from './databaseManager.js';
import { Logger } from '@the-new-fuse/utils';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DataIntegrityService implements OnModuleInit {
  private logger = new Logger('DataIntegrityService');
  private readonly constraintChecks = new Map<string, () => Promise<void>>();
  private isCheckingConstraints = false;

  constructor(
    private readonly dbManager: DatabaseManager,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async onModuleInit() {
    await this.setupIntegrityChecks();
    this.schedulePeriodicChecks();
  }

  private async setupIntegrityChecks() {
    const db = this.dbManager.getDataSource();
    await db.query(`
      CREATE OR REPLACE FUNCTION check_referential_integrity()
      RETURNS trigger AS $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND table_name = TG_TABLE_NAME
        ) THEN
          RETURN NEW;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION validate_json_schema()
      RETURNS trigger AS $$
      BEGIN
        IF NEW.config IS NOT NULL AND NOT jsonb_typeof(NEW.config) = 'object' THEN
          RAISE EXCEPTION 'Invalid JSON schema in config field';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Add triggers to relevant tables
      DO $$
      BEGIN
        CREATE TRIGGER ensure_referential_integrity
          BEFORE INSERT OR UPDATE ON tasks
          FOR EACH ROW
          EXECUTE FUNCTION check_referential_integrity();
      EXCEPTION
        WHEN others THEN NULL;
      END $$;
    `);
  }

  private schedulePeriodicChecks() {
    // Run integrity checks every hour
    setInterval(async () => {
      await this.runIntegrityChecks();
    }, 3600000);
  }

  async runIntegrityChecks() {
    if (this.isCheckingConstraints) {
      return;
    }

    this.isCheckingConstraints = true;
    const startTime = Date.now();
    const issues: any[] = [];

    try {
      const db = this.dbManager.getDataSource();

      // Check for orphaned records
      const orphanedRecords = await db.query(`
        WITH orphans AS (
          SELECT t.id, 'task' as type
          FROM tasks t
          LEFT JOIN agents a ON t.agent_id = a.id
          WHERE t.agent_id IS NOT NULL AND a.id IS NULL
          UNION ALL
          SELECT ps.id, 'pipeline_stage' as type
          FROM pipeline_stages ps
          LEFT JOIN pipelines p ON ps.pipeline_id = p.id
          WHERE p.id IS NULL
        )
        SELECT * FROM orphans;
      `);

      if (orphanedRecords.length > 0) {
        issues.push({
          type: 'orphaned_records',
          count: orphanedRecords.length,
          details: orphanedRecords
        });
      }

      // Check for invalid JSON in config columns
      const invalidJson = await db.query(`
        SELECT id, 'agent' as type 
        FROM agents 
        WHERE config IS NOT NULL AND NOT jsonb_typeof(config) = 'object'
        UNION ALL
        SELECT id, 'pipeline' as type
        FROM pipelines
        WHERE config IS NOT NULL AND NOT jsonb_typeof(config) = 'object';
      `);

      if (invalidJson.length > 0) {
        issues.push({
          type: 'invalid_json',
          count: invalidJson.length,
          details: invalidJson
        });
      }

      // Check for duplicate entries
      const duplicates = await db.query(`
        SELECT username, COUNT(*) 
        FROM users 
        GROUP BY username 
        HAVING COUNT(*) > 1;
      `);

      if (duplicates.length > 0) {
        issues.push({
          type: 'duplicates',
          count: duplicates.length,
          details: duplicates
        });
      }

      // Log check results
      const duration = Date.now() - startTime;
      await this.logIntegrityCheck(issues, duration);

      // Emit events for any issues found
      if (issues.length > 0) {
        this.eventEmitter.emit('integrity_check_failed', {
          timestamp: new Date(),
          issues,
          duration
        });
      }
    } catch (error) {
      this.logger.error('Error during integrity check:', error);
      this.eventEmitter.emit('integrity_check_error', {
        timestamp: new Date(),
        error
      });
    } finally {
      this.isCheckingConstraints = false;
    }
  }

  private async logIntegrityCheck(issues: any[], duration: number) {
    const db = this.dbManager.getDataSource();
    await db.query(
      `INSERT INTO audit_log (
        event_type,
        timestamp,
        details,
        duration
      ) VALUES ($1, $2, $3, $4)`,
      [
        'integrity_check',
        new Date(),
        { issues },
        duration
      ]
    );
  }

  async repairIntegrityIssues(issues: any[]) {
    const db = this.dbManager.getDataSource();
    const repairs: any[] = [];

    try {
      await db.query('BEGIN');

      for (const issue of issues) {
        switch (issue.type) {
          case 'orphaned_records':
            // Remove orphaned records
            await db.query(`
              DELETE FROM tasks WHERE id = ANY($1::uuid[])
            `, [issue.details.map((r: any) => r.id)]);
            repairs.push({ type: 'removed_orphaned', count: issue.details.length });
            break;

          case 'invalid_json':
            // Reset invalid JSON to empty object
            await db.query(`
              UPDATE agents SET config = '{}'::jsonb 
              WHERE id = ANY($1::uuid[])
            `, [issue.details.map((r: any) => r.id)]);
            repairs.push({ type: 'fixed_json', count: issue.details.length });
            break;

          case 'duplicates':
            // Keep only the oldest record for duplicates
            await db.query(`
              DELETE FROM users u1 USING users u2
              WHERE u1.username = u2.username 
              AND u1.created_at > u2.created_at
            `);
            repairs.push({ type: 'removed_duplicates', count: issue.details.length });
            break;
        }
      }

      await db.query('COMMIT');

      // Log repair results
      await this.logRepairOperation(repairs);
    } catch (error) {
      await db.query('ROLLBACK');
      this.logger.error('Error during integrity repair:', error);
      throw error;
    }
  }

  private async logRepairOperation(repairs: any[]) {
    const db = this.dbManager.getDataSource();
    await db.query(
      `INSERT INTO audit_log (
        event_type,
        timestamp,
        details
      ) VALUES ($1, $2, $3)`,
      [
        'integrity_repair',
        new Date(),
        { repairs }
      ]
    );
  }
}