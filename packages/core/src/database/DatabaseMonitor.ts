import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

interface QueryInfo {
  query: string;
  params: any;
  duration: number; // in ms
}

@Injectable()
export class DatabaseMonitor implements OnModuleInit {
  private readonly logger = new Logger(DatabaseMonitor.name);
  private longQueryThreshold = 1000; // 1 second

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Database Monitor Initialized.');
    this.subscribeToPrismaEvents();
  }

  private subscribeToPrismaEvents(): void {
    // This assumes Prisma's logging is configured to emit events.
    // In a real implementation, you might need to extend PrismaClient to emit these events.
    this.prisma.$on('query', (e) => {
      const queryInfo: QueryInfo = {
        query: e.query,
        params: e.params,
        duration: e.duration,
      };
      this.handleQueryEvent(queryInfo);
    });
    this.logger.log("Subscribed to Prisma 'query' events.");
  }

  handleQueryEvent(queryInfo: QueryInfo): void {
    this.logger.debug(`Query executed in ${queryInfo.duration}ms: ${queryInfo.query}`);
    if (queryInfo.duration > this.longQueryThreshold) {
      this.logger.warn(`Long-running query detected (${queryInfo.duration}ms): ${queryInfo.query}`);
      this.eventEmitter.emit('database.long_query', queryInfo);
    }
  }

  @OnEvent('database.migration.success')
  handleMigrationSuccess(payload: { migrationName: string; duration: number }): void {
    this.logger.log(`Migration '${payload.migrationName}' completed successfully in ${payload.duration}ms.`);
  }

  @OnEvent('database.security.alert')
  handleSecurityAlert(payload: { alertType: string; details: any }): void {
    this.logger.error(`Database security alert: ${payload.alertType}`, payload.details);
  }

  async checkConnectionHealth(): Promise<{ status: 'ok' | 'error'; details?: any }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      this.logger.error('Database connection health check failed', error.stack);
      return { status: 'error', details: { error: error.message } };
    }
  }
}
