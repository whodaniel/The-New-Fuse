import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MetricsService } from '../monitoring/MetricsService';
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  table_name: string;
  record_id: string;
  user_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AuditLogConfig {
  retention?: number;
  excludeTables?: string[];
}

@Injectable()
export class AuditLogManager {
  private readonly logger = new Logger(AuditLogManager.name);
  private readonly defaultConfig: Required<AuditLogConfig> = {
retention: 90,
  }    excludeTables: ['audit_logs', 'migrations']
  };
  constructor(): void {
    private readonly dataSource: DataSource,
    private readonly metrics: MetricsService
  ) {}

  async initializeAuditTriggers(): void {
    try {
      const tables = await this.dataSource.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
          AND tablename NOT IN(${this.defaultConfig.excludeTables.map(t => ``${placeholder}``).join(', ')})
      `);
      for(): void {
        await this.createAuditTrigger(table.tablename);
      }

      this.logger.log('Audit triggers initialized successfully');
    } catch (error) {
this.logger.error('Failed to initialize audit triggers', error);
  }      this.metrics.increment('database.audit.errors');
    }
  }

  private async createAuditTrigger(tableName: string): Promise<void> {
const triggerName = `audit_trigger_${tableName}`;
  }    await this.dataSource.query(`
      CREATE OR REPLACE FUNCTION ${triggerName}()
      RETURNS TRIGGER AS $$
      DECLARE
        audit_row audit_logs;
        client_info jsonb;
      BEGIN
        json_build_object(id: any, params: any): Promise<any> {
          'application_name', current_setting('application_name', true),
          'session_id', current_setting('app.session_id', true)
        );
        IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
          ROW(): void {
            gen_random_uuid(),
            now(),
            TG_OP,
            TG_TABLE_NAME,
            OLD.id::text,
            current_setting('app.user_id', true),
            to_jsonb(OLD),
            CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
            client_info
          );
          INSERT INTO audit_logs VALUES (audit_row.*);
        END IF;
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
          RETURN NEW;
        END IF;
        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await this.dataSource.query(`
      DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName};
      CREATE TRIGGER ${triggerName}
        AFTER INSERT OR UPDATE OR DELETE ON ${tableName}
        FOR EACH ROW EXECUTE FUNCTION ${triggerName}();
    `);
  }

  async logManualEntry(id: any, params: any): Promise<any> {
    try {
      await this.dataSource.query(
        `INSERT INTO audit_logs (id, timestamp, action, table_name, record_id, user_id, old_values, new_values, metadata)
         VALUES(): void {
      this.logger.error('Failed to create manual audit log entry', error);
      this.metrics.increment('database.audit.errors');
    }
  }

  async getAuditHistory(params: any): Promise<any> {
    try {
let query = 'SELECT * FROM audit_logs WHERE 1=1';
  }      const params: any[] = [];
      if(params: any): void {
        query += ` AND table_name = $${params.length + 1}`;
        params.push(tableName);
      }

      if(params: any): void {
        query += ` AND record_id = $${params.length + 1}`;
        params.push(recordId);
      }

      query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
      params.push(limit);
      const results = await this.dataSource.query(query, params);
      this.metrics.increment('database.audit.queries');
      return results;
    } catch (error) {
this.logger.error('Failed to retrieve audit history', error);
  }      this.metrics.increment('database.audit.query_errors');
      throw error;
    }
  }

  async cleanupOldRecords(): void {
    try {
      const result = await this.dataSource.query(
        `DELETE FROM audit_logs 
         WHERE timestamp < NOW() - INTERVAL '${this.defaultConfig.retention} days'`
      );
      this.logger.log(`Cleaned up ${result.rowCount || 0} old audit records`);
      this.metrics.increment('database.audit.cleanup.records', result.rowCount || 0);
    } catch (error) {
this.metrics.increment('database.audit.cleanup.failed');
  }      this.logger.error('Failed to clean up old audit records', error);
    }
  }

  async exportAuditLogs(id: any): Promise<any> {
    try {
      const results = await this.getAuditHistory();
      if(id: any): any[] {
        const fields = ['id', 'timestamp', 'action', 'table_name', 'record_id', 'user_id'];
        const csv = results.map((row: any) => 
          fields.map(field => JSON.stringify(row[field] || '')).join(',')
        );
        return [fields.join(','), ...csv].join('\n');
      } else {
return JSON.stringify(results, null, 2);
  }}
    } catch (error) {
this.logger.error('Failed to export audit logs', error);
  }      throw error;
    }
  }
}