import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseManager } from './databaseManager.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface AuditEvent {
  type: 'query' | 'migration' | 'security' | 'error';
  timestamp: Date;
  details: any;
  duration?: number;
  user?: string;
}

@Injectable()
export class DatabaseMonitor implements OnModuleInit {
  private logger = new Logger('DatabaseMonitor');
  private metrics: Map<string, number> = new Map();
  private slowQueryThreshold = 1000; // 1 second

  constructor(
    private readonly dbManager: DatabaseManager,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async onModuleInit() {
    this.setupMetricsCollection();
    this.setupAuditLogging();
    await this.createAuditSchema();
  }

  private async createAuditSchema() {
    const db = this.dbManager.getDataSource();
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        details JSONB,
        duration INTEGER,
        user_id VARCHAR(255),
        ip_address VARCHAR(45)
      );

      CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_log(event_type);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);

      CREATE TABLE IF NOT EXISTS performance_metrics (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(100) NOT NULL,
        value DOUBLE PRECISION NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        labels JSONB
      );

      CREATE INDEX IF NOT EXISTS idx_metrics_name_timestamp ON performance_metrics(metric_name, timestamp);
    `);
  }

  private setupMetricsCollection() {
    // Collect metrics every 15 seconds
    setInterval(async () => {
      const stats = await this.dbManager.getStats();
      await this.recordMetrics({
        activeConnections: stats.connections.active,
        queryCount: stats.queries.total,
        avgQueryDuration: stats.queries.avgDuration,
        failedQueries: stats.queries.failed,
        cacheHitRate: this.calculateCacheHitRate()
      });
    }, 15000);
  }

  private setupAuditLogging() {
    this.eventEmitter.on('query', async (query: any) => {
      if (query.duration > this.slowQueryThreshold) {
        await this.logSlowQuery(query);
      }
      await this.recordAuditEvent({
        type: 'query',
        timestamp: new Date(),
        details: {
          sql: query.query,
          parameters: query.parameters
        },
        duration: query.duration
      });
    });

    this.eventEmitter.on('migration', async (event: any) => {
      await this.recordAuditEvent({
        type: 'migration',
        timestamp: new Date(),
        details: event
      });
    });

    this.eventEmitter.on('security', async (event: any) => {
      await this.recordAuditEvent({
        type: 'security',
        timestamp: new Date(),
        details: event
      });
    });
  }

  private async recordMetrics(metrics: Record<string, number>) {
    const db = this.dbManager.getDataSource();
    const timestamp = new Date();

    for (const [name, value] of Object.entries(metrics)) {
      await db.query(
        'INSERT INTO performance_metrics (metric_name, value, timestamp) VALUES ($1, $2, $3)',
        [name, value, timestamp]
      );
    }
  }

  private async recordAuditEvent(event: AuditEvent) {
    const db = this.dbManager.getDataSource();
    await db.query(
      'INSERT INTO audit_log (event_type, timestamp, details, duration, user_id) VALUES ($1, $2, $3, $4, $5)',
      [event.type, event.timestamp, event.details, event.duration, event.user]
    );
  }

  private async logSlowQuery(query: any) {
    this.logger.warn(`Slow query detected (${query.duration}ms):`, {
      sql: query.query,
      parameters: query.parameters
    });
  }

  private calculateCacheHitRate(): number {
    const hits = Array.from(this.metrics.values()).reduce((a, b) => a + b, 0);
    const total = this.metrics.size;
    return total ? (hits / total) * 100 : 0;
  }

  async getAuditReport(startDate: Date, endDate: Date) {
    const db = this.dbManager.getDataSource();
    return db.query(`
      SELECT 
        event_type,
        COUNT(*) as event_count,
        AVG(duration) as avg_duration,
        MIN(timestamp) as first_occurrence,
        MAX(timestamp) as last_occurrence
      FROM audit_log
      WHERE timestamp BETWEEN $1 AND $2
      GROUP BY event_type
      ORDER BY event_count DESC
    `, [startDate, endDate]);
  }

  async getPerformanceReport(startDate: Date, endDate: Date) {
    const db = this.dbManager.getDataSource();
    return db.query(`
      SELECT 
        metric_name,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        COUNT(*) as sample_count
      FROM performance_metrics
      WHERE timestamp BETWEEN $1 AND $2
      GROUP BY metric_name
      ORDER BY metric_name
    `, [startDate, endDate]);
  }
}