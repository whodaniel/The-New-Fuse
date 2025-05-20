import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { LoggerService } from '../logging/LoggerService.js';
import { MetricsService } from '../monitoring/MetricsService.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  table: string;
  recordId: string;
  userId: string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
}

interface AuditConfig {
  excludeTables?: string[];
  includeData?: boolean;
  logMetadata?: boolean;
  retention?: number;
}

@Injectable()
export class AuditLogManager implements OnModuleInit {
  private readonly defaultConfig: AuditConfig = {
    excludeTables: ['audit_logs', 'migrations'],
    includeData: true,
    logMetadata: true,
    retention: 90, // days
  };

  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    await this.ensureAuditTable();
    await this.setupTriggers();
    this.startRetentionJob();
  }

  private async ensureAuditTable(): Promise<void> {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        action TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        user_id TEXT,
        old_value JSONB,
        new_value JSONB,
        metadata JSONB,
        query TEXT,
        client_info JSONB
      );

      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    `);
  }

  private async setupTriggers(): Promise<void> {
    // Get all tables except excluded ones
    const tables = await this.dataSource.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename NOT IN (${this.defaultConfig.excludeTables!.map(t => `'${t}'`).join(',')})
    `);

    for (const { tablename } of tables) {
      await this.createAuditTrigger(tablename);
    }
  }

  private async createAuditTrigger(tableName: string): Promise<void> {
    const triggerFunction = `
      CREATE OR REPLACE FUNCTION audit_${tableName}_trigger()
      RETURNS TRIGGER AS $$
      DECLARE
        audit_row audit_logs;
        client_info jsonb;
      BEGIN
        client_info := json_build_object(
          'application_name', current_setting('application_name'),
          'ip_address', inet_client_addr(),
          'session_id', current_setting('app.session_id', true)
        );

        audit_row = ROW(
          gen_random_uuid(),            -- id
          CURRENT_TIMESTAMP,            -- timestamp
          TG_OP,                        -- action
          TG_TABLE_NAME::TEXT,          -- table_name
          CASE TG_OP
            WHEN 'DELETE' THEN OLD.id::TEXT
            ELSE NEW.id::TEXT
          END,                          -- record_id
          current_setting('app.user_id', true), -- user_id
          CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE'
            THEN to_jsonb(OLD)
            ELSE NULL
          END,                          -- old_value
          CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE'
            THEN to_jsonb(NEW)
            ELSE NULL
          END,                          -- new_value
          NULL,                         -- metadata
          current_query(),              -- query
          client_info                   -- client_info
        );

        INSERT INTO audit_logs VALUES (audit_row.*);
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS ${tableName}_audit_trigger ON ${tableName};
      
      CREATE TRIGGER ${tableName}_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON ${tableName}
      FOR EACH ROW EXECUTE FUNCTION audit_${tableName}_trigger();
    `;

    await this.dataSource.query(triggerFunction);
  }

  private startRetentionJob(): void {
    setInterval(async () => {
      await this.cleanupOldRecords();
    }, 24 * 60 * 60 * 1000); // Run daily
  }

  async logManualEntry(
    entry: Omit<AuditLogEntry, 'id' | 'timestamp'>,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.dataSource.query(
        `INSERT INTO audit_logs (
          action, table_name, record_id, user_id, 
          old_value, new_value, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          entry.action,
          entry.table,
          entry.recordId,
          entry.userId,
          entry.oldValue ? JSON.stringify(entry.oldValue) : null,
          entry.newValue ? JSON.stringify(entry.newValue) : null,
          metadata ? JSON.stringify(metadata) : null,
        ]
      );

      this.metrics.increment('database.audit.manual_entries');
    } catch (error) {
      this.logger.error('Failed to create manual audit log entry:', error);
      this.metrics.increment('database.audit.errors');
    }
  }

  async getAuditHistory(
    options: {
      table?: string;
      recordId?: string;
      userId?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AuditLogEntry[]> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (options.table) {
      query += ` AND table_name = $${paramIndex++}`;
      params.push(options.table);
    }

    if (options.recordId) {
      query += ` AND record_id = $${paramIndex++}`;
      params.push(options.recordId);
    }

    if (options.userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(options.userId);
    }

    if (options.action) {
      query += ` AND action = $${paramIndex++}`;
      params.push(options.action);
    }

    if (options.startDate) {
      query += ` AND timestamp >= $${paramIndex++}`;
      params.push(options.startDate);
    }

    if (options.endDate) {
      query += ` AND timestamp <= $${paramIndex++}`;
      params.push(options.endDate);
    }

    query += ' ORDER BY timestamp DESC';

    if (options.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }

    try {
      const results = await this.dataSource.query(query, params);
      this.metrics.increment('database.audit.queries');
      return results;
    } catch (error) {
      this.logger.error('Failed to retrieve audit history:', error);
      this.metrics.increment('database.audit.query_errors');
      throw error;
    }
  }

  async getChangesForRecord(
    table: string,
    recordId: string
  ): Promise<{
    changes: AuditLogEntry[];
    summary: {
      totalChanges: number;
      lastModified: Date;
      modifiedBy: string[];
    };
  }> {
    const changes = await this.getAuditHistory({
      table,
      recordId,
      limit: 100,
    });

    return {
      changes,
      summary: {
        totalChanges: changes.length,
        lastModified: changes[0]?.timestamp || new Date(),
        modifiedBy: [...new Set(changes.map(c => c.userId))],
      },
    };
  }

  private async cleanupOldRecords(): Promise<void> {
    try {
      const result = await this.dataSource.query(`
        DELETE FROM audit_logs 
        WHERE timestamp < NOW() - INTERVAL '${this.defaultConfig.retention} days'
      `);

      this.metrics.increment('database.audit.cleanup.success');
      this.logger.info(`Cleaned up ${result.rowCount} old audit records`);
    } catch (error) {
      this.metrics.increment('database.audit.cleanup.failed');
      this.logger.error('Failed to clean up old audit records:', error);
    }
  }

  async exportAuditLogs(
    options: {
      format: 'csv' | 'json';
      startDate: Date;
      endDate: Date;
      tables?: string[];
    }
  ): Promise<string> {
    let query = `
      SELECT 
        id,
        timestamp,
        action,
        table_name,
        record_id,
        user_id,
        old_value,
        new_value,
        metadata,
        query,
        client_info
      FROM audit_logs
      WHERE timestamp BETWEEN $1 AND $2
    `;

    const params = [options.startDate, options.endDate];

    if (options.tables?.length) {
      query += ` AND table_name = ANY($3)`;
      params.push(options.tables);
    }

    const results = await this.dataSource.query(query, params);

    if (options.format === 'csv') {
      // Convert to CSV format
      const fields = ['id', 'timestamp', 'action', 'table_name', 'record_id', 'user_id'];
      const csv = results.map((row: any) => 
        fields.map(field => JSON.stringify(row[field])).join(',')
      );
      return [fields.join(','), ...csv].join('\n');
    }

    return JSON.stringify(results, null, 2);
  }
}