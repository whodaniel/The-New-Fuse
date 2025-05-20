import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MonitoringModule } from '../monitoring/monitoring.module.js';
import { LoggingModule } from '../logging/logging.module.js';
import { ConnectionPoolManager } from './ConnectionPoolManager.js';
import { DatabaseOptimizerService } from './database-optimizer.service.js';
import { QueryPerformanceMonitorService } from './query-performance-monitor.service.js';
import { DatabaseHealthService } from './database-health.service.js';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    PrismaModule,
    MonitoringModule,
    LoggingModule
  ],
  providers: [
    ConnectionPoolManager,
    DatabaseOptimizerService,
    QueryPerformanceMonitorService,
    DatabaseHealthService
  ],
  exports: [
    ConnectionPoolManager,
    DatabaseOptimizerService,
    QueryPerformanceMonitorService,
    DatabaseHealthService
  ]
})
export class DatabaseModule {}
